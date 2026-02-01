"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  Search,
  Youtube,
  Music,
  Loader2,
  CheckCircle2,
  Edit3,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Wand2,
  MousePointerClick
} from "lucide-react";
import { isExtensionAvailable } from "@/lib/ui/tiptapUtils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// --- UTILITÁRIOS LOCAIS ---

type LrcLine = { ms: number; text: string };
type CustomGapMap = Record<number, number>; // { lineIndex: wordIndex }

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

function parseLrc(lrc: string): LrcLine[] {
  const lines = lrc.split(/\r?\n/);
  const out: LrcLine[] = [];
  for (const line of lines) {
    const m = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/);
    if (!m) continue;
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    const hun = m[3] ? parseInt(m[3], 10) : 0;
    const ms = min * 60_000 + sec * 1000 + hun * 10;
    const text = m[4].trim();
    if (text) out.push({ ms, text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

// Lógica duplicada do Node para prever o que o modo Auto fará
function getAutoGapIndex(text: string): number {
  const words = text.split(" ");
  if (words.length === 0) return -1;
  
  // Encontra a palavra mais longa válida
  let maxLen = 0;
  let maxIdx = -1;

  words.forEach((w, i) => {
    const clean = w.replace(/[^\p{L}\p{N}']/gu, "");
    if (clean.length > 2 && clean.length > maxLen) { // Preferimos palavras > 2 letras
      maxLen = clean.length;
      maxIdx = i;
    }
  });

  // Fallback se todas forem curtas, pega a primeira
  if (maxIdx === -1 && words.length > 0) return 0;
  
  return maxIdx;
}

async function fetchLrcData(track: string, artist: string) {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr: any[] = await r.json();
    if (!Array.isArray(arr)) return null;
    const item = arr.find(
      (x) => typeof x?.syncedLyrics === "string" && x.syncedLyrics.length > 0
    );
    return item ? item.syncedLyrics : null;
  } catch {
    return null;
  }
}

type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor };

export const MusicToolModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  editor,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Dados
  const [videoUrl, setVideoUrl] = useState("");
  const [track, setTrack] = useState("");
  const [artist, setArtist] = useState("");
  const [pauseEvery, setPauseEvery] = useState<1 | 2>(1);

  // Busca
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Editor
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lrcContent, setLrcContent] = useState<string>("");
  const [parsedLines, setParsedLines] = useState<LrcLine[]>([]);
  
  // --- NOVA FEATURE: MODO DE SELEÇÃO ---
  const [gapMode, setGapMode] = useState<"auto" | "manual">("manual");
  const [customGaps, setCustomGaps] = useState<CustomGapMap>({});

  const sanitizedVideoUrl = sanitizeUrlInput(videoUrl);
  const isValidUrl = isValidYouTubeUrl(sanitizedVideoUrl);
  const currentVideoId = getYouTubeIdFromUrl(sanitizedVideoUrl);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setResults([]);
        setSearch("");
        setCustomGaps({});
        setLrcContent("");
        setGapMode("manual");
      }, 300);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      setSearchError(null);
      const r = await fetch(
        `/api/editor/youtube-search?q=${encodeURIComponent(q)}&maxResults=6`
      );
      const data = await r.json();
      if (!r.ok) {
        setSearchError("Erro ao buscar.");
        setResults([]);
        return;
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      setResults(items);
    } catch {
      setSearchError("Falha na conexão.");
    } finally {
      setSearching(false);
    }
  };

  const chooseVideo = (item: any) => {
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;
    setVideoUrl(url);
    const parts = item.title.split("-").map((s: string) => s.trim());
    if (parts.length >= 2) {
      setArtist(parts[0]);
      setTrack(parts.slice(1).join(" - "));
    } else {
      setTrack(item.title);
      setArtist(item.channelTitle);
    }
  };

  const handleNextStep = async () => {
    if (!isValidUrl || !track || !artist) return;
    
    setIsLoadingLyrics(true);
    try {
      const lrc = await fetchLrcData(track, artist);
      if (lrc) {
        setLrcContent(lrc);
        setParsedLines(parseLrc(lrc));
        setStep(2);
      } else {
        // Sem letra, força manual vazio ou lida com erro
        setParsedLines([]);
        setStep(2);
      }
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const toggleGap = (lineIndex: number, wordIndex: number) => {
    if (gapMode === "auto") return; // Não permite edição no modo auto

    setCustomGaps((prev) => {
      const next = { ...prev };
      if (next[lineIndex] === wordIndex) {
        delete next[lineIndex];
      } else {
        next[lineIndex] = wordIndex;
      }
      return next;
    });
  };

  const handleInsert = () => {
    const payload = {
      videoUrl: sanitizedVideoUrl,
      track: track.trim(),
      artist: artist.trim(),
      pauseEvery,
      mode: "fill" as const,
      lrc: lrcContent,
      gapMode, // Envia o modo escolhido
      customGaps: gapMode === "manual" ? customGaps : {}, // Se for auto, ignora customGaps
      useranswers: {},
    };

    const hasMusic = isExtensionAvailable(editor, "music");
    if (hasMusic) {
      editor?.chain().focus().insertContent({ type: "music", attrs: { music: payload } }).run();
    }
    onClose();
  };

  // Calcula prévias do modo automático para exibição
  const autoGapsPreview = useMemo(() => {
    const map: CustomGapMap = {};
    parsedLines.forEach((line, idx) => {
      const wordIdx = getAutoGapIndex(line.text);
      if (wordIdx !== -1) map[idx] = wordIdx;
    });
    return map;
  }, [parsedLines]);

  // Render Step 2
  const renderStep2 = () => {
    const activeGaps = gapMode === "auto" ? autoGapsPreview : customGaps;

    return (
      <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 fade-in">
        
        {/* Seletor de Modo */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-lg border">
          <div className="flex-1 space-y-1">
             <Label className="text-base">Modo de Seleção</Label>
             <p className="text-xs text-muted-foreground">Como as lacunas serão escolhidas?</p>
          </div>
          <div className="flex bg-background rounded-md border p-1 h-fit shrink-0">
             <button
               onClick={() => setGapMode("auto")}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-all",
                 gapMode === "auto" 
                   ? "bg-primary text-primary-foreground shadow-sm" 
                   : "text-muted-foreground hover:bg-muted"
               )}
             >
               <Wand2 className="w-4 h-4" /> Automático
             </button>
             <button
               onClick={() => setGapMode("manual")}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-all",
                 gapMode === "manual" 
                   ? "bg-primary text-primary-foreground shadow-sm" 
                   : "text-muted-foreground hover:bg-muted"
               )}
             >
               <MousePointerClick className="w-4 h-4" /> Manual
             </button>
          </div>
        </div>

        {/* Instrução Contextual */}
        <div className={cn(
          "p-3 rounded-md text-sm border flex items-center gap-2 transition-colors",
          gapMode === "auto" 
            ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800"
            : "bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800"
        )}>
           {gapMode === "auto" ? (
             <>
               <Wand2 className="w-4 h-4 shrink-0" />
               <span>Visualização: O sistema escolheu as palavras destacadas em azul (as mais longas).</span>
             </>
           ) : (
             <>
               <Edit3 className="w-4 h-4 shrink-0" />
               <span>Edição: Clique nas palavras abaixo para escondê-las (destaque vermelho).</span>
             </>
           )}
        </div>

        {parsedLines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p>Letra não disponível para edição.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 border rounded-md p-4 bg-background">
            <div className="space-y-4">
              {parsedLines.map((line, lIdx) => {
                const words = line.text.split(" ");
                return (
                  <div key={lIdx} className="flex flex-wrap gap-1.5 items-center text-sm">
                    <span className="text-xs text-muted-foreground w-8 select-none font-mono opacity-50">
                      {lIdx + 1}
                    </span>
                    {words.map((word, wIdx) => {
                      const cleanWord = word.replace(/[^\p{L}\p{N}']/gu, "");
                      if (!cleanWord) return <span key={wIdx}>{word}</span>;

                      const isSelected = activeGaps[lIdx] === wIdx;

                      // Estilos diferentes para Auto (Info) vs Manual (Danger/Action)
                      const activeStyle = gapMode === "auto"
                        ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200"
                        : "bg-red-100 border-red-300 text-red-700 font-medium dark:bg-red-900/40 dark:border-red-800 dark:text-red-200";

                      return (
                        <button
                          key={wIdx}
                          onClick={() => toggleGap(lIdx, wIdx)}
                          disabled={gapMode === "auto"}
                          className={cn(
                            "px-1.5 py-0.5 rounded transition-all border",
                            isSelected
                              ? activeStyle
                              : "bg-transparent border-transparent hover:bg-muted hover:border-border",
                            gapMode === "auto" && !isSelected && "opacity-50 cursor-default"
                          )}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label>Buscar no YouTube</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nome da música..."
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={searching || !search.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        {results.length > 0 && (
          <ScrollArea className="h-[220px] rounded-md border p-4 bg-muted/10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((it) => {
                const isSelected = currentVideoId === it.videoId;
                return (
                  <button
                    key={it.videoId}
                    className={cn(
                      "group text-left border rounded-lg overflow-hidden transition-all hover:shadow-md",
                      isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                    )}
                    onClick={() => chooseVideo(it)}
                  >
                    <div className="relative aspect-video bg-muted">
                      {it.thumbnail && <Image src={it.thumbnail} alt={it.title} fill className="object-cover" unoptimized />}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-xs">
                      <div className="font-medium line-clamp-2">{it.title}</div>
                      <div className="text-muted-foreground line-clamp-1">{it.channelTitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Link Direto</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(sanitizeUrlInput(e.target.value))} placeholder="https://youtube.com/..." />
        </div>
        <div className="space-y-2">
           <Label>Pausa Automática</Label>
           <div className="flex gap-2">
             <Button size="sm" variant={pauseEvery === 1 ? "glass" : "outline"} onClick={() => setPauseEvery(1)} className="flex-1">1 Linha</Button>
             <Button size="sm" variant={pauseEvery === 2 ? "glass" : "outline"} onClick={() => setPauseEvery(2)} className="flex-1">2 Linhas</Button>
           </div>
        </div>
        <div className="space-y-2">
            <Label>Música</Label>
            <Input value={track} onChange={(e) => setTrack(e.target.value)} />
        </div>
        <div className="space-y-2">
            <Label>Artista</Label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-muted/10 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" /> Ferramenta de Música
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Escolha o vídeo." : "Configure as lacunas do exercício."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {step === 1 ? renderStep1() : renderStep2()}
        </div>

        <DialogFooter className="p-4 border-t bg-background shrink-0 flex justify-between items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {step === 2 && gapMode === "manual" && (
              <><Badge variant="secondary">{Object.keys(customGaps).length}</Badge> lacunas manuais</>
            )}
            {step === 2 && gapMode === "auto" && (
              <><Badge variant="outline">Auto</Badge> Lacunas automáticas</>
            )}
          </div>
          <div className="flex gap-2">
            {step === 2 ? (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            )}

            {step === 1 ? (
              <Button onClick={handleNextStep} disabled={!isValidUrl || !track || isLoadingLyrics}>
                {isLoadingLyrics ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <>Próximo <ChevronRight className="w-4 h-4 ml-2" /></>}
              </Button>
            ) : (
              <Button onClick={handleInsert}>Concluir e Inserir</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MusicToolModal;