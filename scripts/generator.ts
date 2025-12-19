
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local first
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { siteConfig } from '../site-config';
import connectDB from '../src/lib/db/connect';
import { Post } from '../src/lib/db/models';

if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const HISTORY_FILE = path.join(process.cwd(), 'history.json');

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


// Helper: Generate with Ollama
async function generateWithOllama(prompt: string): Promise<string> {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2.5:0.5b',
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error('Ollama generation failed:', error);
        throw error;
    }
}

async function generateTopic(history: string[]) {
  const prompt = `
    You are an expert content strategist for a blog about "${siteConfig.niche}".
    
    Here is a list of topics we have ALREADY covered:
    ${JSON.stringify(history.slice(-20))} 
    
    Please generate ONE unique, engaging, and specific blog post topic that is NOT in the list above.
    The topic should be catchy and relevant to the current trends in AI and Tech.
    Return ONLY the topic title as plain text. No quotes.
  `;

  console.log("Generating topic with Ollama...");
  return generateWithOllama(prompt);
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
        - Brief Introduction (Hook)
        - Core Content (3-4 sections with H2 headings)
        - Conclusion (Key takeaways)
    - No filler, no fluff. Concise and insightful.
    - Do NOT include the title in the output. Start directly with the introduction.
    - Use code blocks if explaining technical concepts.
    - Do NOT wrap the output in markdown code fence (like \`\`\`markdown). Just return the raw markdown content.
  `;

  console.log("Generating content with Ollama...");
  let content = await generateWithOllama(prompt);
  
  // Strip markdown fences if present
  content = content.replace(/^```markdown\s*/, '').replace(/```$/, '');
  
  return content;
}

async function main() {
  try {
    const history = getHistory();
    const topic = await generateTopic(history);
    console.log(`Selected Topic: ${topic}`);

    const content = await generatePost(topic);
    
    // Connect to DB
    console.log("Connecting to DB with URI:", process.env.MONGODB_URI ? "Defined" : "Undefined");
    await connectDB();

    const slug = slugify(topic);
    
    // Check if duplicate
    const existing = await Post.findOne({ slug });
    if (existing) {
         console.log('Skipping duplicate slug collision.');
         return;
    }

    // Save to MongoDB
    await Post.create({
        title: topic.replace(/"/g, ''),
        slug: slug,
        description: `An insightful exploration of ${topic}.`,
        content: content,
        date: new Date(),
        tags: ["AI", "Technology", "Automation"], // Default tags for now
        isAiGenerated: true
    });
    
    addToHistory(topic);
    
    console.log(`Successfully published to MongoDB: ${slug}`);
    
  } catch (error) {
    console.error('Automation Failed:', error);
    process.exit(1);
  } finally {
      process.exit(0);
  }
}

main();
