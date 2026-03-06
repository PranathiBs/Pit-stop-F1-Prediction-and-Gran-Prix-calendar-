import { NextResponse } from 'next/server';
import { getLatestUpdates } from '@/lib/f1-news';

export const revalidate = 30; // Match the 30s polling logic of the dashboard

export async function GET() {
    try {
        const data = await getLatestUpdates();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API /news error:', error);
        return NextResponse.json({ items: [], lastUpdated: new Date().toISOString() }, { status: 500 });
    }
}
