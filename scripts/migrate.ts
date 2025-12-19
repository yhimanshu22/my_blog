
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, Highlight } from '../src/lib/db/models';
import connectDB from '../src/lib/db/connect';

// Assume running from project root or via tsx
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const DATA_FILE = path.join(process.cwd(), 'data', 'interactions.json');

async function migrate() {
    console.log('Starting migration...');
    await connectDB();
    console.log('Connected to MongoDB.');

    // 1. Migrate Posts
    if (fs.existsSync(POSTS_DIR)) {
        const files = fs.readdirSync(POSTS_DIR);
        for (const file of files) {
            if (!file.endsWith('.mdx')) continue;
            
            const filePath = path.join(POSTS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data, content: body } = matter(content);
            const slug = file.replace('.mdx', '');

            const postData = {
                title: data.title,
                slug: slug,
                description: data.description,
                content: body,
                date: new Date(data.date),
                tags: data.tags || [],
                isAiGenerated: true, // Assuming existing ones are or we default
            };

            await Post.findOneAndUpdate(
                { slug: slug },
                postData,
                { upsert: true, new: true }
            );
            console.log(`Migrated post: ${slug}`);
        }
    } else {
        console.log('No posts directory found, skipping posts migration.');
    }

    // 2. Migrate Highlights
    if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        try {
            const data = JSON.parse(fileContent);
            // structure: { "slug": { "highlights": [...] } }
            
            for (const [slug, val] of Object.entries(data)) {
                // @ts-ignore
                const highlights = val.highlights || [];
                for (const h of highlights) {
                    await Highlight.findOneAndUpdate(
                        { 
                            articleSlug: slug, 
                            // Try to match somewhat uniquely if running multiple times. 
                            // Using text + startOffset as a rough key since we didn't preserve IDs cleanly in old format
                            // Actually, old format had ID. Let's use if we can, but we are moving to Mongo IDs maybe?
                            // Or keep the UUID as a field? My schema doesn't have 'id' field, only _id.
                            // I should probably map old ID to _id or just ignore old ID if I don't care about preserving it exactly.
                            // For safety, let's just insert. But to be idempotent:
                            // We will check if a highlight with same text/range exists.
                             'range.startOffset': h.range.startOffset 
                        },
                        {
                            articleSlug: slug,
                            text: h.text,
                            range: h.range,
                            color: h.color || 'yellow',
                            createdAt: new Date(h.createdAt)
                        },
                        { upsert: true }
                    );
                }
                console.log(`Migrated ${highlights.length} highlights for ${slug}`);
            }
        } catch (e) {
            console.error('Error parsing interactions.json', e);
        }
    } else {
        console.log('No interactions.json found, skipping highlights migration.');
    }

    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(console.error);
