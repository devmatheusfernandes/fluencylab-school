"use client";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { MyUILayout } from "./MyUILayout";
import { useStreamVideo } from "@/hooks/stream/useStreamVideo";
import { Loader2 } from "lucide-react";

export default function VideoHome() {
  const { client, call } = useStreamVideo();

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout />
      </StreamCall>
    </StreamVideo>
  );
}
