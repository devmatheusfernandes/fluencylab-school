import { StreamClient } from '@stream-io/node-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { callId, studentId, notebookId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || !secret) {
      return NextResponse.json({ error: 'Stream credentials missing' }, { status: 500 });
    }

    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
    }

    const client = new StreamClient(apiKey, secret);
    const call = client.video.call('development', callId);

    // List recordings to find one with transcription
    const { recordings } = await call.listRecordings();
    console.log(`[Summary] Found ${recordings.length} recordings`);

    // Sort by end_time desc to get the latest
    const latestRecording = recordings.sort((a, b) => 
      new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    )[0];

    if (!latestRecording) {
      console.log("[Summary] No recordings found");
      return NextResponse.json({ error: 'No recordings found for this call' }, { status: 404 });
    }
    
    console.log(`[Summary] Latest recording ID: ${latestRecording.filename}, End Time: ${latestRecording.end_time}`);

    // Check if transcription is available
    let transcriptText = "";

    try {
        const { transcriptions } = await call.listTranscriptions();
        console.log(`[Summary] Found ${transcriptions.length} transcriptions`);
        
        const latestTranscript = transcriptions.sort((a, b) => 
            new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
        )[0];

        if (latestTranscript && latestTranscript.url) {
            console.log(`[Summary] Fetching transcription from: ${latestTranscript.url}`);
            const response = await fetch(latestTranscript.url);
            transcriptText = await response.text();
        } else {
             console.log("[Summary] No transcription URL found in listTranscriptions");
        }
    } catch (e) {
        console.log("Error listing transcriptions, falling back to recording check", e);
    }

    if (!transcriptText) {
         console.log("[Summary] Transcription text is empty. Checking fallback.");
         // Fallback: check if recording has a transcription link directly (some versions do)
         // or if we can't find it.
         return NextResponse.json({ error: 'No transcription found. Ensure recording and transcription were enabled.' }, { status: 404 });
    }

    console.log(`[Summary] Transcript text length: ${transcriptText.length}`);

    // Generate Summary with Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
    O seguinte texto é a transcrição de uma reunião que pode conter falas em Português e Inglês.
    Por favor, forneça um resumo conciso em Português.
    Destaque os pontos principais, decisões tomadas e itens de ação.
    
    Transcrição:
    ${transcriptText.substring(0, 30000)} // Limit length just in case
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log(`[Summary] Generated summary length: ${summary.length}`);

    // Save to Firestore if studentId and notebookId are provided
    if (studentId && notebookId && transcriptText) {
      try {
        console.log(`[Summary] Saving to users/${studentId}/Notebooks/${notebookId}`);
        await adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`).set({
          transcriptions: FieldValue.arrayUnion({
            date: new Date(),
            content: transcriptText,
            summary: summary
          })
        }, { merge: true });
        console.log("[Summary] Saved successfully");
      } catch (saveError) {
        console.error("Error saving transcription to notebook:", saveError);
      }
    }

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
