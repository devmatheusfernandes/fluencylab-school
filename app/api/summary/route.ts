import { NextResponse } from 'next/server';
import { TranscriptionService } from '@/services/learning/transcriptionService';

export async function POST(req: Request) {
  try {
    const { callId, studentId, notebookId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }
    
    if (!studentId || !notebookId) {
      return NextResponse.json({ error: 'Student ID and Notebook ID are required for saving.' }, { status: 400 });
    }

    const service = new TranscriptionService();
    const { summary } = await service.processAndSaveSummary(callId, studentId, notebookId);

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
