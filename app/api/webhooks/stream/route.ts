import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/services/transcriptionService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`[Webhook] Received event: ${body.type}`);

    // Validate if it's a transcription ready event
    if (body.type === 'call.transcription_ready') {
        const service = new TranscriptionService();
        await service.handleWebhookEvent(body);
    } else {
        console.log(`[Webhook] Ignoring event type: ${body.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
