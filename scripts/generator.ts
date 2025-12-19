
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local first
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { siteConfig } from '../site-config';
// DB imports moved to dynamic import to avoid hoisting issues

if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


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
You are a professional technical writer.

Write a high-quality blog post about the given topic.

IMPORTANT:
- Do NOT generate a title.
- Do NOT restate the topic as a heading.
- Start directly with the introduction paragraph.

Writing style:
- ${siteConfig.tone}
- Clear, concise, and insightful
- Medium.com-style readability

Target audience:
- ${siteConfig.targetAudience}

Structure (MANDATORY):
1. Introduction
   - 2–3 short paragraphs
   - Strong opening hook
   - No fluff

2. Main Content
   - 3 to 4 sections
   - Use H2 headings (##)
   - Each section should cover one clear idea
   - Use examples where helpful

3. Conclusion
   - Brief and actionable takeaways

Formatting rules:
- Output Markdown only
- Do NOT include any title or H1
- Use code blocks only when technically required
- Do NOT wrap output in markdown code fences
- No emojis, hashtags, or promotional language
- No AI self-references

Quality constraints:
- No repetition
- No generic filler
- Professional and readable
`;

  console.log("Generating content with Ollama...");
  let content = await generateWithOllama(prompt);

  // Safety cleanup
  content = content.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');

  return content;
}



async function main() {
  try {
    // Dynamic import to ensure env vars are loaded
    const { default: connectDB } = await import('../src/lib/db/connect');
    const { Post } = await import('../src/lib/db/models');

    // Connect to DB first to get history
    console.log("Connecting to DB...");
    await connectDB();

    // Get recent topics
    const posts = await Post.find({}, 'title').sort({ date: -1 }).limit(20);
    const history = posts.map((p: any) => p.title);
    const topic = await generateTopic(history);
    console.log(`Selected Topic: ${topic}`);

    const content = await generatePost(topic);
    
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
    
    console.log(`Successfully published to MongoDB: ${slug}`);
    
  } catch (error) {
    console.error('Automation Failed:', error);
    process.exit(1);
  } finally {
      process.exit(0);
  }
}

main();
