"use client";

import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Search, Youtube, Music, User, Loader2, PlayCircle, Clock } from "lucide-react";
import { isExtensionAvailable } from "@/lib/tiptap-utils";
import { cn } from "@/lib/utils";

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

function getYouTubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes("youtube.com") && host !== "youtu.be") return null;
    const re = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const m = url.match(re);
    return m && m[1].length === 11 ? m[1] : null;
  } catch {
    return null;
  }
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
  const currentVideoId = getYouTubeIdFromUrl(sanitizedVideoUrl);

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
    
    // Tenta inserir via comando da extensão
    const hasMusic = isExtensionAvailable(editor, "music");
    if (hasMusic) {
      try {
        if (editor?.commands?.insertMusic?.(payload)) {
          onClose();
          return;
        }
      } catch {}
      try {
        if (editor?.chain().focus().insertContent({ type: "music", attrs: { music: payload } }).run()) {
          onClose();
          return;
        }
      } catch {}
    }

    // Fallback HTML
    try {
      const musicStr = JSON.stringify(payload).replace(/'/g, "&#39;");
      const htmlA = `<music-node music='${musicStr}'></music-node>`;
      const htmlB = `<div data-music='${musicStr}'></div>`;
      const chain = editor?.chain().focus();
      let ok = false;
      try { ok = !!chain?.insertContent(htmlA).run(); } catch {}
      if (!ok) { try { ok = !!editor?.chain().focus().insertContent(htmlB).run(); } catch {} }
      if (ok) onClose();
    } catch {}
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      setSearchError(null);
      const r = await fetch(`/api/editor/youtube-search?q=${encodeURIComponent(q)}&maxResults=6`);
      const data = await r.json();
      if (!r.ok) {
        const code = (data?.error as string) || "search_failed";
        if (code === "Authentication required") setSearchError("Faça login para buscar vídeos.");
        else if (code === "missing_api_key") setSearchError("Configure a API Key do YouTube.");
        else setSearchError("Falha ao buscar vídeos.");
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
    
    // Tentativa inteligente de parsear Título - Artista
    const parts = item.title.split("-").map(s => s.trim());
    if (parts.length >= 2) {
      // Geralmente "Artista - Música" no YouTube
      setArtist(parts[0]);
      setTrack(parts.slice(1).join(" - ")); 
    } else {
      setTrack(item.title);
      setArtist(item.channelTitle);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-muted/10 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" /> 
            Ferramenta de Música
          </DialogTitle>
          <DialogDescription>
            Busque um vídeo no YouTube ou cole o link direto para criar um exercício de "Complete a Letra".
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              
              {/* Seção de Busca */}
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Buscar no YouTube</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Nome da música ou artista..." 
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} disabled={searching || !search.trim()}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>

                {searchError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {searchError}
                  </div>
                )}

                {results.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
                    {results.map((it) => {
                      const isSelected = currentVideoId === it.videoId;
                      return (
                        <button
                          key={it.videoId}
                          className={cn(
                            "group text-left border rounded-lg overflow-hidden transition-all hover:shadow-md focus:outline-none ring-offset-2",
                            isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                          )}
                          onClick={() => chooseVideo(it)}
                        >
                          <div className="relative aspect-video bg-muted">
                            {it.thumbnail ? (
                              <Image 
                                src={it.thumbnail} 
                                alt={it.title} 
                                fill 
                                className={cn("object-cover transition-opacity", isSelected ? "opacity-100" : "opacity-90 group-hover:opacity-100")} 
                                unoptimized 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Youtube className="w-8 h-8 opacity-20" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-medium line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
                              {it.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> {it.channelTitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Seção de Configuração */}
              <Card className="border-dashed shadow-sm bg-muted/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    Configuração do Exercício
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Link do Vídeo</Label>
                    <div className="relative">
                      <Youtube className="absolute left-2.5 top-2.5 h-4 w-4 text-red-500" />
                      <Input 
                        value={videoUrl} 
                        onChange={(e) => setVideoUrl(sanitizeUrlInput(e.target.value))} 
                        placeholder="https://youtube.com/..." 
                        className="pl-9 bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Música</Label>
                      <div className="relative">
                        <Music className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={track} 
                          onChange={(e) => setTrack(e.target.value)} 
                          placeholder="Ex: Shape of You" 
                          className="pl-9 bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Artista</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={artist} 
                          onChange={(e) => setArtist(e.target.value)} 
                          placeholder="Ex: Ed Sheeran" 
                          className="pl-9 bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pausar Automaticamente
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={pauseEvery === 1 ? "primary" : "outline"} 
                        onClick={() => setPauseEvery(1)}
                        className="w-32"
                      >
                        A cada 1 linha
                      </Button>
                      <Button 
                        size="sm" 
                        variant={pauseEvery === 2 ? "primary" : "outline"} 
                        onClick={() => setPauseEvery(2)}
                        className="w-32"
                      >
                        A cada 2 linhas
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      O vídeo pausará automaticamente para o aluno preencher a lacuna.
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 border-t bg-background">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleInsert} disabled={!canInsert} className="px-8">
            Inserir no Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MusicToolModal;