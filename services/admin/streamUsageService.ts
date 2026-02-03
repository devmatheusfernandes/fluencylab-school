import "server-only";
import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";

export interface StreamUsageData {
  chat: {
    mau: number;
    concurrentConnections: number;
    totalChannels: number;
    totalMessages: number;
  };
  video: {
    totalCalls: number;
    totalMinutes: number;
    activeCalls: number;
  };
  period: string;
  status: "connected" | "error";
  error?: string;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET;

export async function getStreamUsage(
  range: "30d" | "current-month" = "30d",
): Promise<StreamUsageData> {
  // Verificação inicial de credenciais
  if (!apiKey || !apiSecret) {
    return {
      chat: {
        mau: 0,
        concurrentConnections: 0,
        totalChannels: 0,
        totalMessages: 0,
      },
      video: { totalCalls: 0, totalMinutes: 0, activeCalls: 0 },
      period: range,
      status: "error",
      error: "Missing Stream API Credentials",
    };
  }

  try {
    const chatClient = StreamChat.getInstance(apiKey, apiSecret);
    const videoClient = new StreamClient(apiKey, apiSecret);

    const now = new Date();
    let startTime: Date;

    if (range === "current-month") {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // --- CHAT METRICS ---

    // 1. Contagem de Canais
    const channelsCount = await chatClient.queryChannels(
      {}, // Filter
      {}, // Sort
      { limit: 1, watch: false, state: true }, // Options
    );

    // 2. MAU (Usuários Ativos)
    // A queryUsers retorna { users: [...], ... }
    const activeUsersResponse = await chatClient.queryUsers(
      { last_active: { $gt: startTime.toISOString() } },
      { last_active: -1 },
      { limit: 1 }, // limit 1 é suficiente se usarmos a contagem retornada ou length
    );

    // --- VIDEO METRICS ---

    let callsList: any[] = [];

    // Proteção contra erro de função inexistente (caso a versão do SDK varie)
    if (typeof (videoClient as any).queryCalls === "function") {
      const callsResponse = await (videoClient as any).queryCalls({
        filter_conditions: {
          starts_at: { $gt: startTime.toISOString() },
        },
        limit: 100,
      });
      callsList = callsResponse.calls || [];
    } else {
      console.warn(
        "Stream Video SDK: queryCalls method not found. Check SDK version.",
      );
    }

    let totalVideoMinutes = 0;
    let activeCallsCount = 0;

    // Loop seguro com 'any' para evitar erros de tipagem do objeto Call
    callsList.forEach((call: any) => {
      const session = call.state?.session;

      // Contar chamadas ativas
      if (!session?.ended_at) {
        activeCallsCount++;
      }

      // Calcular minutos
      if (session?.started_at && session?.ended_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        const durationMinutes = (end - start) / 1000 / 60;

        // Estimativa: Duração x 2 participantes
        totalVideoMinutes += durationMinutes * 2;
      }
    });

    // Tratamento seguro da resposta do channelsCount
    // Em algumas versões é array, em outras é objeto com propriedade channels
    const totalChannels = Array.isArray(channelsCount)
      ? channelsCount.length
      : (channelsCount as any).length || 0;

    // Tratamento seguro do activeUsers
    // A propriedade correta é .users
    const mauCount = activeUsersResponse.users
      ? activeUsersResponse.users.length
      : 0;

    return {
      chat: {
        mau: mauCount,
        concurrentConnections: 0,
        totalChannels: totalChannels,
        totalMessages: 0,
      },
      video: {
        totalCalls: callsList.length,
        totalMinutes: Math.round(totalVideoMinutes),
        activeCalls: activeCallsCount,
      },
      period: range,
      status: "connected",
    };
  } catch (error: any) {
    console.error("Stream API Error:", error);
    return {
      chat: {
        mau: 0,
        concurrentConnections: 0,
        totalChannels: 0,
        totalMessages: 0,
      },
      video: { totalCalls: 0, totalMinutes: 0, activeCalls: 0 },
      period: range,
      status: "error",
      error: error.message || "Unknown Stream API Error",
    };
  }
}
