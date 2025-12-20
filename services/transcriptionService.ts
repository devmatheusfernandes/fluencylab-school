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

  async saveCallMetadata(callId: string, studentId: string, notebookId: string) {
    console.log(`[TranscriptionService] Saving metadata for call ${callId}`);
    
    await adminDb
      .collection('users')
      .doc(studentId)
      .collection('Notebooks')
      .doc(notebookId)
      .set({
        transcriptions: FieldValue.arrayUnion({
          date: new Date(),
          content: '',
          summary: '',
          callId: callId,
          status: 'pending',
          updatedAt: new Date()
        })
      }, { merge: true });
      
    console.log("[TranscriptionService] Metadata saved");
  }

  async fetchAndParseTranscription(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const rawText = await response.text();
            
            if (rawText && rawText.trim().length > 0) {
                let transcriptText = rawText;
                
                if (url.endsWith('.jsonl') || rawText.trim().startsWith('{')) {
                     try {
                         const lines = rawText.trim().split('\n');
                         transcriptText = lines.map(line => {
                             try {
                                 if (!line.trim()) return "";
                                 const json = JSON.parse(line);
                                 return (json.results || []).map((r: any) => 
                                     r.alternatives?.[0]?.transcript || ""
                                 ).join(" ") || json.text || ""; 
                             } catch { return ""; }
                         }).join(" ");
                     } catch (e) {
                         transcriptText = rawText;
                     }
                }
                
                if (transcriptText.trim().length > 0) {
                    return transcriptText;
                }
            }
        }
    } catch (e) {
        console.error("[TranscriptionService] Error fetching/parsing transcription:", e);
    }
    return null;
  }

  async checkTranscriptionAvailability(callId: string) {
    console.log(`[TranscriptionService] Checking transcription for ${callId}`);
    const call = this.streamClient.video.call('development', callId);
    
    // Check transcriptions
    try {
        const { transcriptions } = await call.listTranscriptions();
        
        const latestTranscript = transcriptions.sort((a, b) => 
            new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
        )[0];

        if (latestTranscript?.url) {
            console.log(`[TranscriptionService] Found transcription url: ${latestTranscript.url}`);
            
            const text = await this.fetchAndParseTranscription(latestTranscript.url);
            
            if (text) {
                console.log(`[TranscriptionService] Transcription text length: ${text.length}`);
                return { available: true, text };
            } else {
                console.log(`[TranscriptionService] Failed to get text from URL`);
            }
        } else {
            console.log(`[TranscriptionService] No transcription URL found in list`);
        }
    } catch (e) {
        console.error("[TranscriptionService] Error fetching transcription list:", e);
    }
    
    return { available: false, text: '' };
  }

  async generateSummary(text: string) {
    if (!text || text.length < 50) return "Transcrição muito curta para gerar resumo.";

    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
    O seguinte texto é a transcrição de uma reunião que pode conter falas em Português e Inglês.
    Por favor, forneça um resumo conciso em Português.
    Destaque os pontos principais, decisões tomadas e itens de ação.
    
    Transcrição:
    ${text.substring(0, 30000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async updateTranscription(studentId: string, notebookId: string, callId: string, updates: any) {
    const docRef = adminDb.collection('users').doc(studentId).collection('Notebooks').doc(notebookId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
        const data = docSnap.data();
        let transcriptions = data?.transcriptions || [];
        
        const index = transcriptions.findIndex((t: any) => t.callId === callId);
        if (index !== -1) {
            transcriptions[index] = { ...transcriptions[index], ...updates, updatedAt: new Date() };
            await docRef.update({ transcriptions });
            return transcriptions[index];
        }
    }
    throw new Error("Transcription not found");
  }

  // Deprecated/Legacy support wrapper
  async processAndSaveSummary(callId: string, studentId: string, notebookId: string) {
      await this.saveCallMetadata(callId, studentId, notebookId);
      // We don't wait for completion anymore in the new flow, 
      // but if this is called by legacy code expecting a result, we might need to simulate it 
      // or just return empty.
      return { summary: '', transcriptText: '' };
  }
}
