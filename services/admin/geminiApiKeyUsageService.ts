export interface GeminiUsageData {
  status: "active" | "error" | "missing_key" | "quota_exceeded";
  latency: number | null; // Tempo de resposta em ms
  model: string;
  error?: string;
}

export async function getGeminiUsage(): Promise<GeminiUsageData> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const model = "gemini-2.5-flash"; // Modelo mais rápido e barato para check

  if (!apiKey) {
    return {
      status: "missing_key",
      latency: null,
      model,
    };
  }

  const startTime = performance.now();

  try {
    // Usamos fetch direto na API REST para não depender da SDK apenas para esse check
    // Isso mantém o bundle size menor se você não usar a SDK em todo lugar
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Ping" }] }],
          generationConfig: { maxOutputTokens: 1 }, // Resposta mínima
        }),
        next: { revalidate: 0 }, // Sem cache para testar status real
      },
    );

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Tratamento específico para erro de cota (429)
      if (response.status === 429) {
        return {
          status: "quota_exceeded",
          latency,
          model,
          error: "Rate limit exceeded",
        };
      }

      return {
        status: "error",
        latency,
        model,
        error: errorData.error?.message || `API returned ${response.status}`,
      };
    }

    return {
      status: "active",
      latency,
      model,
    };
  } catch (error) {
    console.error("Error checking Gemini status:", error);
    return {
      status: "error",
      latency: null,
      model,
      error:
        error instanceof Error ? error.message : "Unknown connection error",
    };
  }
}
