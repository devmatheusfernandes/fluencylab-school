import { NextRequest, NextResponse } from 'next/server';
import { commentsService } from '@/services/commentsService';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { docId, text } = body as { docId?: string; text?: string };
    if (!docId || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing docId or text' }, { status: 400 });
    }
    const record = await commentsService.upsert(docId, commentId, text.trim());
    return NextResponse.json(record);
  } catch (error) {
    console.error('[COMMENTS][PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const docId = request.nextUrl.searchParams.get('docId');
    if (!docId) {
      return NextResponse.json({ error: 'Missing docId' }, { status: 400 });
    }
    await commentsService.delete(docId, commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[COMMENTS][DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}