import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { TranscriptionService } from "@/services/learning/transcriptionService";
import { announcementService } from "@/services/communication/announcementService";

function verifyStreamWebhookSignature(params: {
  rawBody: string;
  signatureFromHeader: string;
  apiSecret: string;
}) {
  const expected = crypto
    .createHmac("sha256", params.apiSecret)
    .update(params.rawBody, "utf8")
    .digest("hex");

  const A = Buffer.from(expected, "utf8");
  const B = Buffer.from(params.signatureFromHeader, "utf8");
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream webhook not configured" },
        { status: 500 },
      );
    }

    const apiKeyFromHeader = req.headers.get("x-api-key");
    if (!apiKeyFromHeader || apiKeyFromHeader !== apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signature = req.headers.get("x-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Signature header" },
        { status: 400 },
      );
    }

    const rawBody = await req.text();
    if (
      !verifyStreamWebhookSignature({
        rawBody,
        signatureFromHeader: signature,
        apiSecret,
      })
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
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
