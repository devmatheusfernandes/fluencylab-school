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
import { useState, useEffect, useCallback } from "react";
import { useCallContext } from "@/context/CallContext";
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string; // apenas teste, precisa mudar

export default function VideoHome() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null); // State to store the fetched token
  const [client, setClient] = useState<StreamVideoClient | null>(null); // State to store the client
  const [call, setCall] = useState<any | null>(null); // State to store the call
  const getUserTokenFunction = useCallback(getUserToken, []);

  const { callData } = useCallContext();
  const callId = callData?.callId;

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
      setUserName(session.user.name || "Sem nome");
    } else {
      setUserId("Precisa logar antes");
      setUserName(null);
    }
  }, [session]);

  useEffect(() => {
    if (userId && userId !== "Precisa logar antes") {
      getUserTokenFunction(userId, userName || "Sample User");
    } else if (userId === null) {
      console.log("User session not loaded yet.");
    }
  }, [getUserTokenFunction, userId, userName]);

  useEffect(() => {
    if (streamToken && userId && userName && callId) {
      // Initialize StreamVideo client and call only when token, userId, and userName are available
      const user: User = {
        id: userId,
        name: userName,
        image: `https://getstream.io/random_svg/?id=${userId}&name=${userName}`, // Generate dynamic image URL
      };

      const newClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user,
        token: streamToken,
      });
      setClient(newClient); // Set the client in state

      const newCall = newClient.call("development", callId as string);
      setCall(newCall); // Set the call in state
      newCall.getOrCreate();
    }
  }, [streamToken, userId, userName, callId]); // Effect dependency on streamToken, userId, and userName

  async function getUserToken(userId: string, userName: string) {
    console.log("User ID being sent:", userId);
    const response = await fetch("/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: userId }),
    });

    if (!response.ok) {
      console.error(
        "Error fetching token:",
        response.status,
        response.statusText
      );
      return;
    }

    const responseBody = await response.json();
    const token = responseBody.token;

    if (token) {
      setStreamToken(token);
    } else {
      console.log("No token found");
    }
  }

  if (!client || !call) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        <div className="flex flex-col justify-center items-center h-[85vh] w-[85vw]">
          <div className="animate-spin h-16 w-16 border-8 border-t-transparent border-indigo-600 rounded-full"></div>
        </div>
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
