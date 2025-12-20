import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { TranscriptionService } from '@/services/transcriptionService';

export async function POST(request: NextRequest) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;
    
    if (!apiKey || !secret) {
        console.error("Missing Stream credentials in webhook route");
        return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const client = new StreamClient(apiKey, secret);
    
    // Verify signature
    const signature = request.headers.get('x-signature');
    const body = await request.text();
    
    if (!signature || !client.verifyWebhook(body, signature)) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`[Webhook] Received event: ${event.type} for call ${event.call_cid}`);
    
    if (event.type === 'call.transcription_ready') {
        const { call_cid, transcription } = event;
        // The event payload might not contain full custom data, so we might need to fetch the call
        // But first, let's try to get it from event if possible.
        // Usually event.call contains the call object.
        
        let studentId = event.call?.custom?.studentId;
        let notebookId = event.call?.custom?.notebookId;
        
        if (!studentId || !notebookId) {
             console.log("[Webhook] Custom data missing in event, fetching call...");
             try {
                // Parse call type and id from cid "video:call_id"
                const [type, id] = call_cid.split(':');
                const call = await client.video.call(type, id).get();
                studentId = call.call.custom.studentId;
                notebookId = call.call.custom.notebookId;
             } catch (e) {
                 console.error("[Webhook] Error fetching call:", e);
             }
        }

        console.log(`[Webhook] Processing transcription for student ${studentId}, notebook ${notebookId}`);

        if (studentId && notebookId) {
             const service = new TranscriptionService();
             
             try {
                // Fetch text
                const text = await service.fetchAndParseTranscription(transcription.url);
                
                if (text) {
                    // Generate summary
                    const summary = await service.generateSummary(text);
                    
                    // Update Firestore
                    // call_cid is usually "default:call_id", we need just call_id
                    const callId = event.call?.id || call_cid.split(':')[1];
                    
                    await service.updateTranscription(studentId, notebookId, callId, {
                        content: text,
                        summary: summary,
                        status: 'available',
                        updatedAt: new Date()
                    });
                    
                    console.log("[Webhook] Transcription and summary updated successfully");
                } else {
                    console.log("[Webhook] Failed to fetch/parse transcription text");
                }
             } catch (e) {
                 console.error("[Webhook] Error processing transcription:", e);
             }
        } else {
            console.log("[Webhook] Missing studentId or notebookId, skipping");
        }
    }
    
    return NextResponse.json({ success: true });
}
