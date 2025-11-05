import { NextRequest, NextResponse } from 'next/server';
import { commentsService } from '@/services/commentsService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { docId, text } = body as { docId?: string; text?: string };
    if (!docId || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing docId or text' }, { status: 400 });
    }
    const record = await commentsService.addReply(docId, commentId, text.trim());
    return NextResponse.json(record);
  } catch (error) {
    console.error('[COMMENTS][REPLIES][POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}