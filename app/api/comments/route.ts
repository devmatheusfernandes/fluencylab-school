import { NextRequest, NextResponse } from 'next/server';
import { commentsService } from '@/services/communication/commentsService';

export async function GET(request: NextRequest) {
  try {
    const docId = request.nextUrl.searchParams.get('docId');
    if (!docId) {
      return NextResponse.json({ error: 'Missing docId' }, { status: 400 });
    }
    const comments = await commentsService.list(docId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('[COMMENTS][GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docId, id, text } = body as { docId?: string; id?: string; text?: string };
    if (!docId || !id || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing docId, id or text' }, { status: 400 });
    }
    const record = await commentsService.upsert(docId, id, text.trim());
    return NextResponse.json(record);
  } catch (error) {
    console.error('[COMMENTS][POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}