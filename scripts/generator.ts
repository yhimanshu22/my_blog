
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { siteConfig } from '../site-config';
import dotenv from 'dotenv';
import matter from 'gray-matter';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Using a fast/pro model

const HISTORY_FILE = path.join(process.cwd(), 'history.json');
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

// Helper: Ensure directory exists
if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
}

// Helper: Read history
const getHistory = (): string[] => {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

// Helper: Write history
const addToHistory = (topic: string) => {
  const history = getHistory();
  history.push(topic);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

// Helper: Slugify
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

async function generateTopic(history: string[]) {
  const prompt = `
    You are an expert content strategist for a blog about "${siteConfig.niche}".
    
    Here is a list of topics we have ALREADY covered:
    ${JSON.stringify(history.slice(-20))} 
    
    Please generate ONE unique, engaging, and specific blog post topic that is NOT in the list above.
    The topic should be catchy and relevant to the current trends in AI and Tech.
    Return ONLY the topic title as plain text. No quotes.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generatePost(topic: string) {
  console.log(`Generating content for: "${topic}"...`);
  
  const prompt = `
    Write a high-quality, professional blog post about "${topic}".
    
    Style Guide:
    - Tone: ${siteConfig.tone}
    - Audience: ${siteConfig.targetAudience}
    - Format: Markdown
    - Structure:
        - Engaging Title (different from the topic if improved)
        - Brief Introduction (Hook)
        - Core Content (3-4 sections with H2 headings)
        - Conclusion (Key takeaways)
    - No filler, no fluff. Concise and insightful.
    - Use code blocks if explaining technical concepts.
    - Do NOT wrap the output in markdown code fence (like \`\`\`markdown). Just return the raw markdown content.
  `;

  const result = await model.generateContent(prompt);
  let content = result.response.text();
  
  // Strip markdown fences if Gemini adds them
  content = content.replace(/^```markdown\s*/, '').replace(/```$/, '');
  
  return content;
}

async function main() {
  try {
    const history = getHistory();
    const topic = await generateTopic(history);
    console.log(`Selected Topic: ${topic}`);

    const content = await generatePost(topic);
    
    // Generate Frontmatter
    const date = new Date().toISOString();
    const slug = slugify(topic);
    
    // Check if we already have this slug (rare collision)
    if (fs.existsSync(path.join(POSTS_DIR, `${slug}.mdx`))) {
      console.log('Skipping duplicate slug collision.');
      return;
    }

    const fileContent = `---
title: "${topic.replace(/"/g, '\\"')}"
date: "${date}"
description: "An insightful exploration of ${topic}."
---

${content}
`;

    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.mdx`), fileContent);
    addToHistory(topic);
    
    console.log(`Successfully published: ${slug}.mdx`);
    
  } catch (error) {
    console.error('Automation Failed:', error);
    process.exit(1);
  }
}

main();
