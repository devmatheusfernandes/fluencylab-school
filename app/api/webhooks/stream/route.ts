import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/services/learning/transcriptionService';
import { announcementService } from '@/services/communication/announcementService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`[Webhook] Received event: ${body.type}`);

    // Validate if it's a transcription ready event
    if (body.type === 'call.transcription_ready') {
        const service = new TranscriptionService();
        await service.handleWebhookEvent(body);
    } 
    // Handle new message for push notifications
    else if (body.type === 'message.new') {
        const message = body.message;
        const sender = body.user;
        const channel = body.channel;
        const members = body.members || channel?.members;

        // Skip system messages or messages without text/attachments
        if (message.type !== 'system' && sender && sender.role !== 'system') {
            const recipients: string[] = [];
            
            // Extract recipients (all members except sender)
            if (members && Array.isArray(members)) {
                members.forEach((m: any) => {
                    const uid = m.user_id || m.user?.id;
                    if (uid && uid !== sender.id) {
                        recipients.push(uid);
                    }
                });
            }

            if (recipients.length > 0) {
                const title = sender.name || sender.id || 'Nova mensagem';
                
                let text = message.text;
                if (!text && message.attachments && message.attachments.length > 0) {
                    const type = message.attachments[0].type;
                    text = type === 'image' ? '📷 Enviou uma imagem' : 
                           type === 'video' ? '🎥 Enviou um vídeo' : 
                           type === 'audio' || type === 'voiceRecording' ? '🎤 Enviou um áudio' : 
                           '📎 Enviou um anexo';
                }
                
                if (!text) text = 'Enviou uma mensagem';

                const channelId = body.channel_id || (body.cid ? body.cid.split(':')[1] : null);
                const link = channelId ? `/hub/my-chat?channelId=${channelId}` : '/hub/my-chat';

                await announcementService.createSystemAnnouncement(
                    title,
                    text,
                    recipients,
                    link
                );
                console.log(`[Webhook] Sent notifications to ${recipients.length} users for message from ${sender.id}`);
            }
        }
    }
    else {
        console.log(`[Webhook] Ignoring event type: ${body.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
