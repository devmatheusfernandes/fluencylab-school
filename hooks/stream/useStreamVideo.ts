import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { useCallContext } from "@/context/CallContext";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export const useStreamVideo = () => {
  const { data: session } = useSession();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any | null>(null);
  const { callData } = useCallContext();

  useEffect(() => {
    let mounted = true;
    let myClient: StreamVideoClient | null = null;

    const init = async () => {
      if (!session?.user?.id || !callData?.callId) return;

      const userId = session.user.id;
      const userName = session.user.name || "Usuário";
      const callId = callData.callId;

      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const { token } = await response.json();
        if (!token) throw new Error("Token não encontrado");

        if (!mounted) return;

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

        if (!mounted) {
          await newClient.disconnectUser();
          return;
        }

        myClient = newClient;
        setClient(newClient);
        setCall(newCall);
      } catch (error) {
        console.error("Erro ao inicializar vídeo:", error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (myClient) {
        myClient.disconnectUser();
      }
      setClient(null);
      setCall(null);
    };
  }, [session?.user?.id, session?.user?.image, session?.user?.name, callData?.callId]);

  return { client, call };
};
