import { StreamClient } from '@stream-io/node-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export class TranscriptionService {
  private streamClient: StreamClient;
  private geminiKey: string;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const secret = process.env.STREAM_SECRET;
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || !secret || !geminiKey) {
      throw new Error("Missing credentials for TranscriptionService");
    }

    this.streamClient = new StreamClient(apiKey, secret);
    this.geminiKey = geminiKey;
  }

  async processAndSaveSummary(callId: string, studentId: string, notebookId: string) {
    console.log(`[TranscriptionService] Processing call ${callId} for student ${studentId}, notebook ${notebookId}`);

    // 1. Fetch Transcription
    const call = this.streamClient.video.call('development', callId);
    
    // Check recordings
    const { recordings } = await call.listRecordings();
    console.log(`[TranscriptionService] Found ${recordings.length} recordings`);

    const latestRecording = recordings.sort((a, b) => 
      new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    )[0];

    if (!latestRecording) {
      console.log("[TranscriptionService] No recordings found");
      throw new Error('No recordings found for this call');
    }

    // Check transcriptions
    let transcriptText = "";
    try {
        const { transcriptions } = await call.listTranscriptions();
        console.log(`[TranscriptionService] Found ${transcriptions.length} transcriptions`);
        
        const latestTranscript = transcriptions.sort((a, b) => 
            new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
        )[0];

        if (latestTranscript?.url) {
            console.log(`[TranscriptionService] Fetching transcription from: ${latestTranscript.url}`);
            const response = await fetch(latestTranscript.url);
            transcriptText = await response.text();
        }
    } catch (e) {
        console.error("[TranscriptionService] Error fetching transcription list:", e);
    }

    if (!transcriptText) {
         console.log("[TranscriptionService] Transcription text is empty");
         throw new Error('No transcription found. Ensure recording and transcription were enabled.');
    }

    // 2. Generate Summary
    console.log("[TranscriptionService] Generating summary with Gemini...");
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    // Keeping the model version from original code, assuming it is correct for the user's setup
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 

    const prompt = `
    O seguinte texto é a transcrição de uma reunião que pode conter falas em Português e Inglês.
    Por favor, forneça um resumo conciso em Português.
    Destaque os pontos principais, decisões tomadas e itens de ação.
    
    Transcrição:
    ${transcriptText.substring(0, 30000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    console.log(`[TranscriptionService] Summary generated (length: ${summary.length})`);

    // 3. Save to Firestore
    console.log(`[TranscriptionService] Saving to users/${studentId}/Notebooks/${notebookId}`);
    
    await adminDb
      .collection('users')
      .doc(studentId)
      .collection('Notebooks')
      .doc(notebookId)
      .set({
        transcriptions: FieldValue.arrayUnion({
          date: new Date(),
          content: transcriptText,
          summary: summary,
          callId: callId
        })
      }, { merge: true });
      
    console.log("[TranscriptionService] Saved successfully");

    return { summary, transcriptText };
  }
}
