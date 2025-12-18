
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'interactions.json');

// Ensure data directory exists
const ensureDataFile = () => {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
    }
};

interface Highlight {
    id: string;
    text: string;
    range: {
        startPath: number[];
        startOffset: number;
        endPath: number[];
        endOffset: number;
    };
    color?: string;
    createdAt: number;
}

interface Interactions {
    [slug: string]: {
        highlights: Highlight[];
    };
}

export async function GET(req: NextRequest) {
    ensureDataFile();
    
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data: Interactions = JSON.parse(fileContent);
        const interactions = data[slug] || { highlights: [] };
        
        return NextResponse.json(interactions);
    } catch (error) {
        console.error('Error reading interactions:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    ensureDataFile();

    try {
        const body = await req.json();
        const { slug, highlight } = body;

        if (!slug || !highlight) {
            return NextResponse.json({ error: 'Slug and highlight are required' }, { status: 400 });
        }

        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        let data: Interactions = {};
        try {
            data = JSON.parse(fileContent);
        } catch {
            // If file is empty or corrupted, start fresh
            data = {};
        }

        if (!data[slug]) {
            data[slug] = { highlights: [] };
        }

        // Add proper validation here if needed, or check for duplicates
        data[slug].highlights.push(highlight);

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true, highlight });
    } catch (error) {
        console.error('Error saving highlight:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
