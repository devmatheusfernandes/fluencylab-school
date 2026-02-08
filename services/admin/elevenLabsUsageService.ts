import "server-only";

export interface ElevenLabsUsageData {
  subscription: {
    tier: string;
    characterCount: number;
    characterLimit: number;
    canExtendLimit: boolean;
    nextResetDate: number | null; // Unix Timestamp
  };
  voices: {
    count: number; // Não fornecido diretamente no endpoint de sub, mas podemos inferir ou buscar separado se necessário. Vamos usar os limites aqui.
    limit: number;
  };
  status: "connected" | "error";
  error?: string;
}

const apiKey = process.env.ELEVENLABS_API_KEY;

export async function getElevenLabsUsage(): Promise<ElevenLabsUsageData> {
  // Verificação inicial
  if (!apiKey) {
    return {
      subscription: {
        tier: "unknown",
        characterCount: 0,
        characterLimit: 0,
        canExtendLimit: false,
        nextResetDate: null,
      },
      voices: { count: 0, limit: 0 },
      status: "error",
      error: "Missing ELEVENLABS_API_KEY",
    };
  }

  try {
    // 1. Buscando dados da Assinatura (Limites e Uso)
    // Endpoint: GET /v1/user/subscription
    const response = await fetch(
      "https://api.elevenlabs.io/v1/user/subscription",
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache por 1 hora (ajuste conforme necessário)
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      subscription: {
        tier: data.tier || "custom",
        characterCount: data.character_count || 0,
        characterLimit: data.character_limit || 0,
        canExtendLimit: data.can_extend_character_limit || false,
        nextResetDate: data.next_character_count_reset_unix || null,
      },
      voices: {
        count: 0, // A API de subscription não retorna quantas vozes criadas você tem, apenas o limite.
        limit: data.voice_limit || 0,
      },
      status: "connected",
    };
  } catch (error: any) {
    console.error("ElevenLabs Service Error:", error);
    return {
      subscription: {
        tier: "unknown",
        characterCount: 0,
        characterLimit: 0,
        canExtendLimit: false,
        nextResetDate: null,
      },
      voices: { count: 0, limit: 0 },
      status: "error",
      error: error.message || "Failed to fetch ElevenLabs data",
    };
  }
}
