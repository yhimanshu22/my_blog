
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Highlight, IHighlight } from '@/lib/db/models';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    try {
        await connectDB();
        const highlights = await Highlight.find({ articleSlug: slug }).sort({ createdAt: 1 }).lean();
        
        // Transform _id to id for frontend if needed, or frontend adapts
        const formatted = highlights.map((h: any) => ({
            id: h._id.toString(), // The frontend expects a string ID
            text: h.text,
            range: h.range,
            color: h.color,
            createdAt: h.createdAt.getTime()
        }));

        return NextResponse.json({ highlights: formatted });
    } catch (error) {
        console.error('Error reading interactions:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slug, highlight } = body;

        if (!slug || !highlight) {
            return NextResponse.json({ error: 'Slug and highlight are required' }, { status: 400 });
        }

        await connectDB();

        const newHighlight = await Highlight.create({
            articleSlug: slug,
            text: highlight.text,
            range: highlight.range,
            color: highlight.color,
            createdAt: new Date(highlight.createdAt)
        });

        return NextResponse.json({ success: true, highlight: { ...highlight, id: newHighlight._id.toString() } });
    } catch (error) {
        console.error('Error saving highlight:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
