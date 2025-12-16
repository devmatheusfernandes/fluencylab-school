"use client";

import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { isExtensionAvailable } from "@/lib/tiptap-utils";

type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor };

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be";
  } catch {
    return false;
  }
}
function sanitizeUrlInput(url: string): string {
  return url.replace(/[`]/g, "").trim();
}

export const MusicToolModal: React.FC<BaseModalProps> = ({ isOpen, onClose, editor }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [track, setTrack] = useState("");
  const [artist, setArtist] = useState("");
  const [pauseEvery, setPauseEvery] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ videoId: string; title: string; channelTitle: string; thumbnail: string | null }>>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const sanitizedVideoUrl = sanitizeUrlInput(videoUrl);
  const canInsert = isValidYouTubeUrl(sanitizedVideoUrl) && track.trim().length > 0 && artist.trim().length > 0;

  const handleInsert = () => {
    if (!canInsert) return;
    const payload = {
      videoUrl: sanitizedVideoUrl,
      track: track.trim(),
      artist: artist.trim(),
      pauseEvery,
      mode: "fill" as const,
      useranswers: {},
    };
    const hasMusic = isExtensionAvailable(editor, "music");
    if (hasMusic) {
      try {
        const ok = editor?.commands?.insertMusic?.(payload);
        if (ok) {
          onClose();
          return;
        }
      } catch {}
      try {
        const objectOk = editor?.chain().focus().insertContent({
          type: "music",
          attrs: { music: payload },
        }).run();
        if (objectOk) {
          onClose();
          return;
        }
      } catch {}
    }
    try {
      const musicStr = JSON.stringify(payload).replace(/'/g, "&#39;");
      const htmlA = `<music-node music='${musicStr}'></music-node>`;
      const htmlB = `<div data-music='${musicStr}'></div>`;
      const chain = editor?.chain().focus();
      let ok = false;
      try {
        ok = !!chain?.insertContent(htmlA).run();
      } catch {}
      if (!ok) {
        try {
          ok = !!editor?.chain().focus().insertContent(htmlB).run();
        } catch {}
      }
      if (!ok) return;
      onClose();
    } catch {}
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      setSearchError(null);
      const r = await fetch(`/api/editor/youtube-search?q=${encodeURIComponent(q)}&maxResults=12`);
      const data = await r.json();
      if (!r.ok) {
        const code = (data?.error as string) || "search_failed";
        if (code === "Authentication required") {
          setSearchError("Faça login para buscar vídeos.");
        } else if (code === "missing_api_key") {
          setSearchError("Configure a variável de ambiente YOUTUBE_API_KEY ou NEXT_PUBLIC_YOUTUBE_API_KEY.");
        } else {
          setSearchError("Falha ao buscar vídeos. Tente novamente.");
        }
        setResults([]);
        return;
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      setResults(items);
    } finally {
      setSearching(false);
    }
  };

  const chooseVideo = (item: { videoId: string; title: string; channelTitle: string }) => {
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;
    setVideoUrl(url);
    const parts = item.title.split(" - ");
    if (parts.length >= 2) {
      setArtist(parts[0].trim());
      setTrack(parts.slice(1).join(" - ").trim());
    } else {
      setTrack(item.title.trim());
      setArtist(item.channelTitle.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="min-w-[80vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Música/YouTube</DialogTitle>
          <DialogDescription>Insira um vídeo e configure a letra sincronizada.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <Label>Buscar no YouTube</Label>
            <div className="flex gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Digite o nome da música ou artista" />
              <Button onClick={handleSearch} disabled={searching || !search.trim()}>{searching ? "Buscando..." : "Buscar"}</Button>
            </div>
            {searchError && <div className="text-xs text-red-600 mt-1">{searchError}</div>}
            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {results.map((it) => (
                  <button
                    key={it.videoId}
                    className="text-left border rounded-md overflow-hidden hover:border-primary/50 transition focus:outline-none"
                    onClick={() => chooseVideo(it)}
                  >
                    {it.thumbnail ? (
                      <Image src={it.thumbnail} alt={it.title} width={320} height={180} unoptimized className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-muted" />
                    )}
                    <div className="p-2">
                      <div className="text-xs font-medium line-clamp-2">{it.title}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{it.channelTitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Link do YouTube</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(sanitizeUrlInput(e.target.value))} placeholder="https://youtube.com/..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Música</Label>
              <Input value={track} onChange={(e) => setTrack(e.target.value)} placeholder="Nome da música" />
            </div>
            <div className="space-y-2">
              <Label>Artista</Label>
              <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Nome do artista" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pausar a cada</Label>
            <div className="flex items-center gap-2">
              <Button variant={pauseEvery === 1 ? "primary" : "outline"} onClick={() => setPauseEvery(1)}>1 linha</Button>
              <Button variant={pauseEvery === 2 ? "primary" : "outline"} onClick={() => setPauseEvery(2)}>2 linhas</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleInsert} disabled={!canInsert}>Inserir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MusicToolModal;
