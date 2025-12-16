"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Music, User, Youtube, Play, 
  RotateCcw, ChevronLeft, Check, X, Loader2, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- TIPAGENS E FUNÇÕES AUXILIARES ---

type LrcLine = { ms: number; text: string };

// Declaração de módulo para evitar erro de tipagem no Tiptap
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    music: {
      insertMusic: (payload: NonNullable<MusicAttrs["music"]>) => ReturnType;
      setMusicAttrs: (attrs: Partial<NonNullable<MusicAttrs["music"]>>) => ReturnType;
    };
  }
}

type MusicAttrs = {
  music?: {
    videoUrl?: string;
    track?: string;
    artist?: string;
    lrc?: string;
    synced?: LrcLine[];
    mode?: "fill";
    pauseEvery?: 1 | 2;
    useranswers?: Record<string, string>;
  } | null;
};

function getYouTubeId(url: string): string | null {
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

function buildEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : "";
  return `https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1${origin}`;
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
    const text = m[4] || "";
    out.push({ ms, text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

type LrcLibItem = { syncedLyrics?: string; plainLyrics?: string };
async function fetchLrc(track: string, artist: string): Promise<{ lrc?: string; synced?: LrcLine[] } | null> {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr: unknown = await r.json();
    if (!Array.isArray(arr)) return null;
    const item = (arr as LrcLibItem[]).find((x) => typeof x?.syncedLyrics === "string" || typeof x?.plainLyrics === "string");
    if (!item) return null;
    const lrc = item.syncedLyrics || item.plainLyrics || "";
    const synced = lrc ? parseLrc(lrc) : [];
    return { lrc, synced };
  } catch {
    return null;
  }
}

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function chooseBlankWord(text: string): string | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const sorted = words
    .map((w) => w.replace(/[^\p{L}\p{N}']/gu, ""))
    .filter((w) => w.length > 0)
    .sort((a, b) => b.length - a.length);
  return sorted[0] || null;
}

function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}']/gu, "")
    .toLowerCase()
    .trim();
}

type YTPlayer = {
  getCurrentTime?: () => number;
  pauseVideo?: () => void;
  playVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState?: () => number;
};
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: { Player: new (el: HTMLIFrameElement, opts?: unknown) => YTPlayer };
  }
}

// --- COMPONENTE PRINCIPAL ---

export const MusicNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const raw: MusicAttrs = node.attrs;
  const attrs: MusicAttrs = {
    ...raw,
    music:
      typeof raw?.music === "string"
        ? (() => {
            try {
              return JSON.parse(raw.music as string);
            } catch {
              return null;
            }
          })()
        : raw?.music || null,
  };

  const [videoUrl, setVideoUrl] = useState<string>(() => attrs.music?.videoUrl || "");
  const [track, setTrack] = useState<string>(() => attrs.music?.track || "");
  const [artist, setArtist] = useState<string>(() => attrs.music?.artist || "");
  const [pauseEvery, setPauseEvery] = useState<1 | 2>(() => (attrs.music?.pauseEvery as 1 | 2) || 1);
  const [synced, setSynced] = useState<LrcLine[]>(() => attrs.music?.synced || []);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [blankWord, setBlankWord] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);
  const waitingInputRef = useRef<boolean>(false);
  const replayingRef = useRef<boolean>(false);
  const startPendingRef = useRef<boolean>(false);
  const pauseTimeoutRef = useRef<number | null>(null);
  const currentEndMsRef = useRef<number>(0);
  const seekingNextRef = useRef<boolean>(false);

  // --- LÓGICA DO JOGO ---
  const ensureGapForCurrentLine = () => {
    if (!playerReady) return;
    const idx = currentIndexRef.current;
    const line = synced[idx];
    if (!line) return;
    const tMs = Number(playerRef.current?.getCurrentTime?.() || 0) * 1000;
    const startMs = getLineStartMs(idx);
    const endMs = getLineEndMs(idx);
    if (!blankWord && tMs >= startMs && tMs < endMs) {
      const bw = chooseBlankWord(line.text || "");
      setBlankWord(bw);
    }
  };

  const getLineStartMs = (idx: number) => (synced[idx]?.ms ?? 0);
  const getLineEndMs = (idx: number) => {
    const next = synced[idx + 1];
    if (next && typeof next.ms === "number") return Math.max(next.ms - 10, getLineStartMs(idx));
    return getLineStartMs(idx) + 2000;
  };
  
  const schedulePauseForCurrentLine = () => {
    if (!playerReady) return;
    const idx = currentIndexRef.current;
    const endMs = getLineEndMs(idx);
    currentEndMsRef.current = endMs;
    const tMs = Number(playerRef.current?.getCurrentTime?.() || 0) * 1000;
    const delay = Math.max(endMs - tMs, 0);
    
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    pauseTimeoutRef.current = window.setTimeout(() => {
      // Pausa apenas se não tivermos pulado para a próxima linha manualmente
      // A verificação real acontece no loop do timerRef, este timeout é um fallback
      setWaitingInput(true);
      waitingInputRef.current = true;
      replayingRef.current = false;
      try {
        playerRef.current?.pauseVideo?.();
      } catch {}
    }, delay);
  };

  const embedUrl = useMemo(() => (videoUrl ? buildEmbedUrl(videoUrl) : null), [videoUrl]);

  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;
    const yt = window.YT;
    if (yt?.Player && iframeRef.current) {
      playerRef.current = new yt.Player(iframeRef.current, {
        events: {
          onReady: (e: any) => {
            playerRef.current = e?.target || playerRef.current;
            setPlayerReady(true);
            if (startPendingRef.current || started) {
              try {
                playerRef.current?.playVideo?.();
              } catch {}
              startPendingRef.current = false;
            }
          },
          onStateChange: (e: any) => {
            const state = e?.data;
            if (state === 1 && seekingNextRef.current) {
              seekingNextRef.current = false;
              setWaitingInput(false);
              waitingInputRef.current = false;
              schedulePauseForCurrentLine();
            }
          },
        },
      });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(s);
    window.onYouTubeIframeAPIReady = () => {
      if (iframeRef.current) {
        const yti = window.YT;
        if (yti?.Player) {
          playerRef.current = new yti.Player(iframeRef.current, {
            events: {
              onReady: (e: any) => {
                playerRef.current = e?.target || playerRef.current;
                setPlayerReady(true);
                if (startPendingRef.current || started) {
                  try {
                    playerRef.current?.playVideo?.();
                  } catch {}
                  startPendingRef.current = false;
                }
              },
              onStateChange: (e: any) => {
                const state = e?.data;
                if (state === 1 && seekingNextRef.current) {
                  seekingNextRef.current = false;
                  setWaitingInput(false);
                  waitingInputRef.current = false;
                  schedulePauseForCurrentLine();
                }
              },
            },
          });
        }
      }
    };
  }, [embedUrl]);

  const saveAttrs = (next: Partial<MusicAttrs["music"]>) => {
    const base = attrs.music || {};
    updateAttributes?.({ music: { ...base, ...next } });
  };

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    waitingInputRef.current = waitingInput;
  }, [waitingInput]);

  const handleSetup = async () => {
    if (!videoUrl || !track || !artist) return;
    setLoading(true);
    try {
      const data = await fetchLrc(track, artist);
      const s = data?.synced || [];
      setSynced(s);
      saveAttrs({ videoUrl, track, artist, lrc: data?.lrc || "", synced: s, pauseEvery });
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    if (!synced.length) return;
    setStarted(true);
    setWaitingInput(false);
    waitingInputRef.current = false;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setBlankWord(() => {
      const first = synced[0];
      return first ? chooseBlankWord(first.text || "") : null;
    });
    setInputValue("");
    setFeedback(null);
    if (playerReady) {
      try {
        playerRef.current?.playVideo?.();
      } catch {}
      schedulePauseForCurrentLine();
    } else {
      startPendingRef.current = true;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      if (!playerReady) return;
      const t = Number(playerRef.current?.getCurrentTime?.() || 0) * 1000;
      const nextIdx = Math.min(currentIndexRef.current, synced.length - 1);
      const target = synced[nextIdx];
      if (!target) return;
      const endMs = getLineEndMs(nextIdx);
      const startMs = getLineStartMs(nextIdx);
      
      // Define a palavra em branco se estivermos no intervalo correto e ela ainda não existir
      if (!blankWord && t >= startMs && t < endMs) {
        const bw = chooseBlankWord(target.text || "");
        setBlankWord(bw);
        schedulePauseForCurrentLine();
      }

      // Pausa se chegou ao fim da linha e estamos no modo de replay ou jogo normal
      const shouldPause =
        (!waitingInputRef.current && t >= endMs) ||
        (replayingRef.current && t >= endMs);
        
      if (shouldPause) {
        setWaitingInput(true);
        waitingInputRef.current = true;
        replayingRef.current = false;
        try {
          playerRef.current?.pauseVideo?.();
        } catch {}
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const submitAnswer = () => {
    const target = synced[currentIndex];
    if (!target || !blankWord) return;
    const v = normalizeWord(inputValue);
    const b = normalizeWord(blankWord);
    
    if (v && b && v === b) {
      // RESPOSTA CORRETA
      setFeedback("correct");
      const nextAns = { ...(attrs.music?.useranswers || {}), [String(currentIndex)]: inputValue.trim() };
      saveAttrs({ useranswers: nextAns });
      
      // Limpa estados de bloqueio
      setWaitingInput(false);
      waitingInputRef.current = false;
      setInputValue("");
      setBlankWord(null);
      
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      
      // Avança índice
      const step = pauseEvery === 2 ? 2 : 1;
      setCurrentIndex((i) => {
        const ni = Math.min(i + step, synced.length - 1);
        currentIndexRef.current = ni;
        return ni;
      });

      // Toca o vídeo automaticamente
      try {
        playerRef.current?.playVideo?.();
      } catch {}
      
      schedulePauseForCurrentLine();
      ensureGapForCurrentLine();
      
      setTimeout(() => setFeedback(null), 800);
    } else {
      // RESPOSTA INCORRETA
      setFeedback("incorrect");
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  // --- RENDERIZAÇÃO ---

  const renderSetup = () => {
    return (
      <Card className="max-w-xl mx-auto border-dashed shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurar Exercício Musical
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Youtube className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9" 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                placeholder="Cole o link do YouTube..." 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Music className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  value={track} 
                  onChange={(e) => setTrack(e.target.value)} 
                  placeholder="Música" 
                />
              </div>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  value={artist} 
                  onChange={(e) => setArtist(e.target.value)} 
                  placeholder="Artista" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase">Pausar a cada:</span>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant={pauseEvery === 1 ? "primary" : "outline"} 
                  onClick={() => setPauseEvery(1)}
                  className="flex-1"
                >
                  1 Linha
                </Button>
                <Button 
                  size="sm"
                  variant={pauseEvery === 2 ? "primary" : "outline"} 
                  onClick={() => setPauseEvery(2)}
                  className="flex-1"
                >
                  2 Linhas
                </Button>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading || !videoUrl || !track || !artist} 
            className="w-full mt-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Buscando Letra...</> : "Criar Exercício"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderPlayer = () => {
    return (
      <Card className="max-w-2xl mx-auto overflow-hidden shadow-md border-muted">
        {/* Video Container */}
        <div className="relative w-full aspect-video bg-black">
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              className="absolute top-0 left-0 w-full h-full"
              src={embedUrl}
              title="YouTube video player"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/50">Vídeo indisponível</div>
          )}
        </div>

        <CardContent className="p-4 md:p-6 space-y-6">
          {!started ? (
            <div className="text-center py-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">{track || "Música Desconhecida"}</h3>
                <p className="text-muted-foreground">{artist || "Artista Desconhecido"}</p>
              </div>
              <Button size="lg" onClick={startGame} className="gap-2 px-8">
                <Play className="w-5 h-5 fill-current" /> Iniciar Prática
              </Button>
            </div>
          ) : (
            <>
              {/* Lyrics Display Area */}
              <div className="min-h-[140px] flex flex-col justify-center items-center text-center space-y-2 p-6 rounded-xl bg-muted/30 border border-muted">
                {(() => {
                  const line = synced[currentIndex];
                  if (!line) return <span className="text-muted-foreground italic">Fim da música ou aguardando...</span>;
                  
                  const text = line.text || "";
                  const ts = formatMs(line.ms);
                  
                  let before = text;
                  let after = "";
                  
                  if (blankWord) {
                    const lw = blankWord.toLowerCase();
                    const lt = text.toLowerCase();
                    const idx = lt.indexOf(lw);
                    if (idx >= 0) {
                      before = text.slice(0, idx).trimEnd();
                      after = text.slice(idx + blankWord.length).trimStart();
                    }
                  }

                  return (
                    <>
                      <Badge variant="outline" className="mb-2 text-xs font-normal text-muted-foreground">
                        {ts}
                      </Badge>
                      <div className="text-lg md:text-2xl font-medium leading-relaxed max-w-lg">
                        {!blankWord ? (
                          <span>{text}</span>
                        ) : (
                          <span className="inline-flex flex-wrap justify-center gap-1 items-baseline">
                            <span>{before}</span>
                            <span className="border-b-2 border-primary w-24 inline-block mx-1"></span>
                            <span>{after}</span>
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Input & Controls */}
              {waitingInput && blankWord && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        if (feedback) setFeedback(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && submitAnswer()}
                      placeholder="Digite a palavra que falta..."
                      className={cn(
                        "h-12 text-lg text-center bg-background",
                        feedback === "correct" && "border-green-500 ring-1 ring-green-500",
                        feedback === "incorrect" && "border-red-500 ring-1 ring-red-500"
                      )}
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      className={cn(
                        "h-12 w-12 shrink-0", 
                        feedback === "correct" && "bg-green-600 hover:bg-green-700",
                        feedback === "incorrect" && "bg-red-600 hover:bg-red-700"
                      )}
                      onClick={submitAnswer} 
                      disabled={!inputValue.trim()}
                    >
                      {feedback === "correct" ? <Check className="w-6 h-6" /> : 
                       feedback === "incorrect" ? <X className="w-6 h-6" /> : 
                       <Check className="w-6 h-6" />}
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        // REPLAY AUTOMÁTICO
                        const idx = currentIndexRef.current;
                        const start = getLineStartMs(idx) / 1000;
                        replayingRef.current = true;
                        setWaitingInput(false);
                        waitingInputRef.current = false;
                        
                        if (pauseTimeoutRef.current) {
                          window.clearTimeout(pauseTimeoutRef.current);
                          pauseTimeoutRef.current = null;
                        }
                        
                        try {
                          playerRef.current?.seekTo?.(start, true);
                          playerRef.current?.playVideo?.();
                        } catch {}
                        schedulePauseForCurrentLine();
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Replay
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const prev = Math.max(currentIndexRef.current - 1, 0);
                        setCurrentIndex(prev);
                        currentIndexRef.current = prev;
                        setFeedback(null);
                        setWaitingInput(false);
                        waitingInputRef.current = false;
                        setBlankWord(() => {
                          const ln = synced[prev];
                          return ln ? chooseBlankWord(ln.text || "") : null;
                        });
                        setInputValue("");
                        const start = getLineStartMs(prev) / 1000;
                        if (pauseTimeoutRef.current) {
                          window.clearTimeout(pauseTimeoutRef.current);
                          pauseTimeoutRef.current = null;
                        }
                        try {
                          playerRef.current?.seekTo?.(start, true);
                          playerRef.current?.playVideo?.();
                        } catch {}
                        schedulePauseForCurrentLine();
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <NodeViewWrapper className="my-6">
      {synced.length && embedUrl ? renderPlayer() : renderSetup()}
    </NodeViewWrapper>
  );
};

export const MusicNode = Node.create({
  name: "music",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      music: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-music]",
        getAttrs: (element: HTMLElement) => {
          const mStr = element.getAttribute("data-music") || "";
          let music: unknown = null;
          try {
            if (mStr) music = JSON.parse(mStr);
          } catch {}
          return { music };
        },
      },
      {
        tag: "music-node",
        getAttrs: (element: HTMLElement) => {
          const mStr = element.getAttribute("music") || "";
          let music: unknown = null;
          try {
            if (mStr) music = JSON.parse(mStr);
          } catch {}
          return { music };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const m = (HTMLAttributes as Record<string, unknown>)?.music as unknown;
    let mStr = "";
    if (typeof m === "string") {
      mStr = m;
    } else if (m && typeof m === "object") {
      mStr = JSON.stringify(m);
    }
    return ["music-node", mergeAttributes(HTMLAttributes, { music: mStr })];
  },

  addCommands() {
    return {
      insertMusic:
        (payload: NonNullable<MusicAttrs["music"]>) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { music: payload },
            })
            .run();
        },
      setMusicAttrs:
        (attrs: Partial<NonNullable<MusicAttrs["music"]>>) =>
        ({ chain }) => {
          return chain().focus().updateAttributes(this.name, { music: attrs }).run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MusicNodeView);
  },
});

export default MusicNode;