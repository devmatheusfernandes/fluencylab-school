"use client";
import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { MyUILayout } from "./MyUILayout";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useCallContext } from "@/context/CallContext";
import { Loader2 } from "lucide-react";
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export default function VideoHome() {
  const { data: session } = useSession();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any | null>(null);
  const { callData } = useCallContext();

  useEffect(() => {
    const init = async () => {
      if (!session?.user?.id || !callData?.callId) return;

      const userId = session.user.id;
      const userName = session.user.name || "Usuário";
      const callId = callData.callId;

      // 1. Fetch Token
      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const { token } = await response.json();
        if (!token) throw new Error("Token não encontrado");

        // 2. Create Client
        const user: User = {
          id: userId,
          name: userName,
          image:
            session.user.image ||
            `https://getstream.io/random_svg/?id=${userId}&name=${userName}`,
        };

        const newClient = new StreamVideoClient({
          apiKey,
          user,
          token,
        });

        // 3. Create Call
        const newCall = newClient.call("default", callId);

        await newCall.getOrCreate({
          data: {
            settings_override: {
              transcription: {
                mode: "auto-on",
                closed_caption_mode: "available",
              },
            },
          },
        });

        setClient(newClient);
        setCall(newCall);
      } catch (error) {
        console.error("Erro ao inicializar vídeo:", error);
      }
    };

    init();

    return () => {
      if (client) {
        client.disconnectUser();
        setClient(null);
        setCall(null);
      }
    };
     
  }, [session?.user?.id, callData?.callId]);

  if (!client || !call) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout />
      </StreamCall>
    </StreamVideo>
  );
}
