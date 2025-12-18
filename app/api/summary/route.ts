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

    // Sort by end_time desc to get the latest
    const latestRecording = recordings.sort((a, b) => 
      new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    )[0];

    if (!latestRecording) {
      return NextResponse.json({ error: 'No recordings found for this call' }, { status: 404 });
    }
    
    // Check if transcription is available
    // Note: The property name might vary based on SDK version. 
    // Usually it's linked via 'transcription_url' or we have to list transcriptions separately.
    // Let's try listing transcriptions if queryRecordings doesn't have it.
    
    let transcriptText = "";

    try {
        const { transcriptions } = await call.listTranscriptions();
        const latestTranscript = transcriptions.sort((a, b) => 
            new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
        )[0];

        if (latestTranscript && latestTranscript.url) {
            const response = await fetch(latestTranscript.url);
            transcriptText = await response.text();
        }
    } catch (e) {
        console.log("Error listing transcriptions, falling back to recording check", e);
    }

    if (!transcriptText) {
         // Fallback: check if recording has a transcription link directly (some versions do)
         // or if we can't find it.
         return NextResponse.json({ error: 'No transcription found. Ensure recording and transcription were enabled.' }, { status: 404 });
    }

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

    // Save to Firestore if studentId and notebookId are provided
    if (studentId && notebookId && transcriptText) {
      try {
        await adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`).update({
          transcriptions: FieldValue.arrayUnion({
            date: new Date(),
            content: transcriptText,
            summary: summary
          })
        });
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
