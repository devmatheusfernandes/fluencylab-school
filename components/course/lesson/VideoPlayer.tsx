"use client";

import React from "react";
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

const YouTubeEmbed: React.FC<{ url: string }> = ({ url }) => {
  const getVideoId = (url: string) => {
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      return null;
    }
    const regExp =
      /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  const videoId = getVideoId(url);
  
  if (!videoId) {
    // Generic iframe fallback
    return (
      <iframe
        className="w-full h-full"
        src={url}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;

  return (
    <iframe
      className="w-full h-full"
      src={embedUrl}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const hasVideo = !!videoUrl && videoUrl.trim() !== "";

  return (
    <div className="relative w-full aspect-video bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-white/5 group">
      {hasVideo ? (
        <YouTubeEmbed url={videoUrl} />
      ) : (
        // Gradient Placeholder
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-orange-900 flex flex-col items-center justify-center text-white p-6">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-8 h-8 fill-white text-white ml-1" />
          </div>
          <h3 className="text-xl font-medium text-center max-w-md line-clamp-2">
            {title || "No video available for this lesson"}
          </h3>
          
          {/* Mock Controls for visual consistency with the request */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent px-4 flex items-end pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="w-full space-y-2">
                {/* Timeline */}
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-indigo-500"></div>
                </div>
                {/* Icons */}
                <div className="flex items-center justify-between text-white/90">
                    <div className="flex items-center gap-4">
                        <Play className="w-5 h-5 fill-white" />
                        <Volume2 className="w-5 h-5" />
                        <span className="text-xs font-medium">00:00 / 00:00</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Maximize className="w-5 h-5" />
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
