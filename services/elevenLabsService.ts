
import { getStorage } from 'firebase-admin/storage';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Default Voice IDs (Standard ElevenLabs voices)
// Sarah (Teacher) -> "Rachel" (American, clear) or similar. Let's use a known stable ID or the user provided ones.
// Leo (Student) -> "Drew" (American, news) or "Clyde". 
// Since I don't have the user's specific IDs, I'll use common defaults.
export const VOICE_IDS = {
  TEACHER: process.env.ELEVENLABS_VOICE_TEACHER || '21m00Tcm4TlvDq8ikWAM', // Rachel
  STUDENT: process.env.ELEVENLABS_VOICE_STUDENT || 'AZnzlk1XvdvUeBnXmlld', // Domi (Younger sounding)
};

export async function generateSpeech(text: string, voiceId: string): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not defined');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // or multilingual_v2
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs API Error: ${response.statusText} - ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
