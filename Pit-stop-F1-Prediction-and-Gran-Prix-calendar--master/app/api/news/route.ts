import { NextResponse } from 'next/server';
import { getLatestUpdates } from '@/lib/f1-news';

export async function GET() {
    try {
        const data = await getLatestUpdates();
        return NextResponse.json(data.items);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
