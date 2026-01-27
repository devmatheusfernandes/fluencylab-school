"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  Check,
  X,
  Loader2,
  Settings,
  Lightbulb,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TIPAGENS ---

type LrcLine = { ms: number; text: string };
// CustomGapMap: chaves podem virar string no JSON do Tiptap
type CustomGapMap = Record<string | number, number>; 

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    music: {
      insertMusic: (payload: NonNullable<MusicAttrs["music"]>) => ReturnType;
      setMusicAttrs: (
        attrs: Partial<NonNullable<MusicAttrs["music"]>>
      ) => ReturnType;
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
    gapMode?: "auto" | "manual";
    customGaps?: CustomGapMap;
    pauseEvery?: 1 | 2;
    offsetMs?: number;
    useranswers?: Record<string, string>;
  } | null;
};

// --- HELPERS ---

function buildEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes("youtube.com") && host !== "youtu.be") return null;
    const re = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const m = url.match(re);
    const id = m && m[1].length === 11 ? m[1] : null;
    if (!id) return null;
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : "";
    // Importante: enablejsapi=1
    return `https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1${origin}`;
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
    const ms =
      parseInt(m[1], 10) * 60000 +
      parseInt(m[2], 10) * 1000 +
      (m[3] ? parseInt(m[3], 10) : 0) * 10;
    const text = m[4].trim();
    if (text) out.push({ ms, text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

async function fetchLrc(track: string, artist: string) {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr: any[] = await r.json();
    const item = arr.find((x: any) => x.syncedLyrics);
    return item
      ? { lrc: item.syncedLyrics, synced: parseLrc(item.syncedLyrics) }
      : null;
  } catch {
    return null;
  }
}

function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function chooseAutoGap(text: string): string | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const sorted = words
    .map((w) => w.replace(/[^\p{L}\p{N}']/gu, ""))
    .filter((w) => w.length > 2)
    .sort((a, b) => b.length - a.length);
  return sorted[0] || words[0] || null;
}

// Interface simplificada do YouTube Player API
type YTPlayer = {
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  getPlayerState: () => number; // 1 = playing, 2 = paused
  destroy: () => void;
};

// --- COMPONENTE PRINCIPAL ---

export const MusicNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  const raw: MusicAttrs = node.attrs;
  const attrs: MusicAttrs = {
    ...raw,
    music:
      typeof raw?.music === "string"
        ? JSON.parse(raw.music)
        : raw?.music || null,
  };
  const musicData = attrs.music || {};

  // --- ESTADOS ---
  const [videoUrl, setVideoUrl] = useState(musicData.videoUrl || "");
  const [track, setTrack] = useState(musicData.track || "");
  const [artist, setArtist] = useState(musicData.artist || "");
  const [pauseEvery] = useState(musicData.pauseEvery || 1);
  const [synced, setSynced] = useState<LrcLine[]>(
    musicData.synced || (musicData.lrc ? parseLrc(musicData.lrc) : [])
  );
  
  // Configs
  const [gapMode] = useState<"auto" | "manual">(musicData.gapMode || "auto");
  const [customGaps] = useState<CustomGapMap>(musicData.customGaps || {});
  const [offsetMs, setOffsetMs] = useState(musicData.offsetMs || 0);

  // Jogo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [blankWord, setBlankWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Player Controls
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Gamificação
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  // Refs
  const playerRef = useRef<YTPlayer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const reqAnimRef = useRef<number | null>(null);
  
  // Ref de Estado para o Loop (Evita closures antigas)
  const stateRef = useRef({
    currentIndex,
    waitingInput,
    blankWord,
    synced,
    pauseEvery,
    offsetMs,
    gapMode,
    customGaps,
  });

  useEffect(() => {
    stateRef.current = {
      currentIndex,
      waitingInput,
      blankWord,
      synced,
      pauseEvery,
      offsetMs,
      gapMode,
      customGaps,
    };
  }, [
    currentIndex,
    waitingInput,
    blankWord,
    synced,
    pauseEvery,
    offsetMs,
    gapMode,
    customGaps,
  ]);

  const embedUrl = useMemo(
    () => (videoUrl ? buildEmbedUrl(videoUrl) : null),
    [videoUrl]
  );

  // --- LÓGICA DE LACUNAS CORRIGIDA ---
  const getGapForLine = useCallback(
    (lineIdx: number, lineText: string): string | null => {
      // Prioridade total para o modo manual
      if (gapMode === "manual") {
        // Tenta acessar via numero OU string (JSON safe)
        const gapIndex = customGaps[lineIdx] ?? customGaps[String(lineIdx)];
        
        if (typeof gapIndex === "number") {
          const words = lineText.split(" ");
          if (words[gapIndex]) {
             // Retorna a palavra limpa
             return words[gapIndex].replace(/[^\p{L}\p{N}']/gu, "");
          }
        }
        // SE FOR MANUAL E NÃO TIVER GAP SELECIONADO, RETORNA NULL (Texto completo)
        return null; 
      }

      // Modo Auto
      return chooseAutoGap(lineText);
    },
    [gapMode, customGaps]
  );

  // --- PLAYER INIT (ROBUSTO) ---
  useEffect(() => {
    if (!embedUrl) return;

    // Callback para quando a API estiver pronta
    const onPlayerReady = (event: any) => {
      // FIX CRÍTICO: Atribui o target do evento ao ref
      playerRef.current = event.target;
      setIsPlayerReady(true);
      event.target.setVolume(100);
      setVolume(100);
    };

    const onPlayerStateChange = (event: any) => {
      // 1 = Playing, 2 = Paused
      setIsPlaying(event.data === 1);
    };

    const init = () => {
      const YT = (window as any).YT;
      if (YT?.Player && iframeRef.current) {
        // Cria novo player
        new YT.Player(iframeRef.current, {
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
      (window as any).onYouTubeIframeAPIReady = init;
    }

    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, [embedUrl]);

  // --- CONTROLES DE PLAYER ---
  const safePlayerCall = (fn: (p: YTPlayer) => void) => {
    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      fn(playerRef.current);
    }
  };

  const togglePlay = () => {
    safePlayerCall((p) => {
      // Verificamos o estado interno do componente React, ou perguntamos ao player
      if (isPlaying) {
        p.pauseVideo();
      } else {
        p.playVideo();
      }
    });
  };

  const handleVolumeChange = (vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    if (v > 0) setIsMuted(false);
    safePlayerCall((p) => p.setVolume(v));
  };

  const toggleMute = () => {
    safePlayerCall((p) => {
      if (isMuted) {
        p.setVolume(volume);
        setIsMuted(false);
      } else {
        p.setVolume(0);
        setIsMuted(true);
      }
    });
  };

  // --- REPLAY CORRIGIDO ---
  const handleReplay = () => {
    if (!synced[currentIndex]) return;
    
    // 1. Desbloqueia input para evitar pausa imediata
    setWaitingInput(false);
    
    const startSeconds = synced[currentIndex].ms / 1000;
    
    safePlayerCall((p) => {
      p.seekTo(startSeconds, true);
      // Timeout mínimo para garantir que o seek aconteceu antes do play
      setTimeout(() => {
        p.playVideo();
      }, 50);
    });
  };

  // --- GAME LOOP ---
  const startGame = () => {
    if (!synced.length) return;
    if (!isPlayerReady) {
      toast.error("O player ainda está carregando...");
      return;
    }

    setStarted(true);
    setScore(0);
    setStreak(0);
    setWaitingInput(false);
    setFeedback(null);
    setCurrentIndex(0);

    setBlankWord(getGapForLine(0, synced[0].text));

    safePlayerCall((p) => {
      p.seekTo(0, true);
      p.playVideo();
    });
    
    startLoop();
  };

  const startLoop = () => {
    const loop = () => {
      gameLoopStep();
      reqAnimRef.current = requestAnimationFrame(loop);
    };
    reqAnimRef.current = requestAnimationFrame(loop);
  };

  const gameLoopStep = () => {
    // Verificação de segurança
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== "function") return;

    const {
      currentIndex,
      waitingInput,
      blankWord,
      synced,
      pauseEvery,
      offsetMs,
    } = stateRef.current;
    
    const currentTimeMs =
      playerRef.current.getCurrentTime() * 1000 + offsetMs;

    // 1. Avanço de Linha (Trigger de Início)
    if (!waitingInput && !blankWord) {
      const nextIdx = currentIndex + 1;
      if (nextIdx < synced.length) {
        if (currentTimeMs >= synced[nextIdx].ms) {
          setCurrentIndex(nextIdx);
          setBlankWord(getGapForLine(nextIdx, synced[nextIdx].text));
          setInputValue("");
          setHintLevel(0);
        }
      }
    }

    // 2. Pausa (Fim da Frase com Lacuna)
    if (blankWord && !waitingInput) {
      const nextMs =
        synced[currentIndex + 1]?.ms ?? synced[currentIndex].ms + 3000;
      const shouldPause = (currentIndex + 1) % pauseEvery === 0;

      // Pausa 200ms antes da próxima linha
      if (shouldPause && currentTimeMs >= nextMs - 200) {
        safePlayerCall((p) => p.pauseVideo());
        setWaitingInput(true);
      }
    }
  };

  const submitAnswer = () => {
    if (!blankWord) return;
    const v = normalizeWord(inputValue);
    const b = normalizeWord(blankWord);
    
    if (v && b && v === b) {
      setFeedback("correct");
      let pts = 100 + streak * 10;
      if (hintLevel > 0) pts = Math.max(10, pts - hintLevel * 25);
      setScore((s) => s + pts);
      setStreak((s) => s + 1);
      setWaitingInput(false);
      setInputValue("");
      setBlankWord(null);
      
      safePlayerCall((p) => p.playVideo());
      
      setTimeout(() => setFeedback(null), 1000);
    } else {
      setFeedback("incorrect");
      setStreak(0);
      
      // Feedback visual
      const el = document.getElementById("music-input-box");
      if(el) {
         el.classList.add("animate-shake"); 
         setTimeout(() => el.classList.remove("animate-shake"), 500);
      }
      
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getPlaceholder = () => {
    if (!blankWord) return "";
    if (hintLevel === 0) return "Digite a resposta...";
    if (hintLevel === 1) return blankWord.replace(/./g, "_ ");
    return (
      blankWord[0] +
      blankWord.slice(1, -1).replace(/./g, "_ ") +
      blankWord.slice(-1)
    );
  };

  const handleSetup = async () => {
    setLoading(true);
    const data = await fetchLrc(track, artist);
    setLoading(false);
    if (data) {
      setSynced(data.synced);
      updateAttributes?.({
        music: {
          ...musicData,
          videoUrl,
          track,
          artist,
          lrc: data.lrc,
          synced: data.synced,
        },
      });
      toast.success("Letra carregada!");
    } else {
      toast.error("Letra não encontrada.");
    }
  };

  const renderSetup = () => (
    <Card className="max-w-xl mx-auto bg-muted/20 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" /> Configuração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="YouTube URL"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Música"
          />
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artista"
          />
        </div>
        <Button onClick={handleSetup} disabled={loading} className="w-full">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Carregar"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPlayer = () => (
    <Card className="max-w-3xl mx-auto shadow-lg overflow-hidden border-muted bg-background">
      {/* HEADER */}
      <div className="bg-muted/40 p-3 flex justify-between items-center border-b text-sm">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-1 rounded-full font-bold">
            <Trophy className="w-4 h-4" /> {score}
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-orange-500 font-bold animate-pulse">
              <Flame className="w-4 h-4" /> x{streak}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setOffsetMs((o) => o - 500);
              updateAttributes?.({
                music: { ...musicData, offsetMs: offsetMs - 500 },
              });
            }}
            title="Atrasar 0.5s"
          >
            <Rewind className="w-3 h-3" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground font-mono">
            {offsetMs > 0 ? "+" : ""}{offsetMs / 1000}s
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setOffsetMs((o) => o + 500);
              updateAttributes?.({
                music: { ...musicData, offsetMs: offsetMs + 500 },
              });
            }}
            title="Adiantar 0.5s"
          >
            <FastForward className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* VIDEO CONTAINER */}
      <div className="relative aspect-video bg-black group">
        {embedUrl && (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
            src={embedUrl}
            allow="autoplay"
          />
        )}
        {!started && (
          <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center text-white space-y-4">
            <h2 className="text-2xl font-bold">{track}</h2>
            <p>{artist}</p>
            <Button
              size="lg"
              onClick={startGame}
              className="rounded-full px-8 py-6 text-lg gap-2"
            >
              <Play className="fill-current w-5 h-5" /> Iniciar
            </Button>
          </div>
        )}
      </div>

      {/* BARRA DE CONTROLE DO PLAYER (NOVA) */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/20 border-b">
         <Button variant="ghost" size="icon" onClick={togglePlay} disabled={!isPlayerReady}>
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
         </Button>
         
         <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
               {isMuted || volume === 0 ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
            </button>
            <Slider 
              value={[isMuted ? 0 : volume]} 
              min={0} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange}
              className="w-full cursor-pointer"
            />
         </div>
      </div>

      <div className="p-6 space-y-6 bg-gradient-to-b from-background to-muted/10">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / synced.length) * 100}%` }}
          />
        </div>

        {/* ÁREA DA LETRA */}
        <div className="min-h-[100px] flex items-center justify-center text-center text-xl md:text-2xl font-medium">
          {started && synced[currentIndex] ? (
            
            <div className="animate-in fade-in slide-in-from-bottom-2 w-full">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">
                Linha {currentIndex + 1} de {synced.length}
              </p>
              {(() => {
                const text = synced[currentIndex].text;
                if (!blankWord)
                  return (
                    <span className="text-green-600 dark:text-green-400">
                      {text}
                    </span>
                  );

                const words = text.split(" ");
                const lowerBlank = blankWord.toLowerCase();

                return (
                  <span className="flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                    {words.map((w, i) => {
                      let isGap = false;

                      // Lógica de Gap: Manual ou Auto
                      if (gapMode === "manual") {
                        const targetIdx = customGaps[currentIndex] ?? customGaps[String(currentIndex)];
                        if (i === targetIdx) isGap = true;
                      } 
                      else if (gapMode === "auto") {
                        const cleanW = w.replace(/[^\p{L}\p{N}']/gu, "").toLowerCase();
                        if (cleanW === lowerBlank) isGap = true;
                      }

                      if (isGap) {
                        return (
                          <span
                            key={i}
                            className="border-b-2 border-primary min-w-[3ch] w-auto px-2 animate-pulse bg-primary/5 rounded mx-1 inline-block align-baseline text-transparent select-none relative"
                          >
                             {w}
                             <span className="absolute inset-0 bg-primary/10 rounded" />
                          </span>
                        );
                      }
                      return <span key={i}>{w}</span>;
                    })}
                  </span>
                );
              })()}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <Volume2 className="w-4 h-4" />{" "}
              {started ? "Fim!" : "Aguardando..."}
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="h-20 flex justify-center items-center">
          {waitingInput && blankWord && (
            <div id="music-input-box" className="flex gap-2 w-full max-w-sm animate-in zoom-in-95">
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                  className={cn(
                    "text-center h-12 text-lg",
                    feedback === "correct" && "border-green-500 bg-green-50",
                    feedback === "incorrect" && "border-red-500 bg-red-50"
                  )}
                  placeholder={getPlaceholder()}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 text-muted-foreground hover:text-amber-500"
                  onClick={() => setHintLevel((h) => Math.min(h + 1, 2))}
                  disabled={hintLevel >= 2}
                >
                  <Lightbulb
                    className={cn(
                      "w-4 h-4",
                      hintLevel > 0 && "fill-amber-500 text-amber-500"
                    )}
                  />
                </Button>
              </div>
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12",
                  feedback === "correct"
                    ? "bg-green-600"
                    : feedback === "incorrect"
                    ? "bg-red-600"
                    : ""
                )}
                onClick={submitAnswer}
              >
                {feedback === "correct" ? (
                  <Check />
                ) : feedback === "incorrect" ? (
                  <X />
                ) : (
                  <Check />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplay}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Replay
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prev = Math.max(0, currentIndex - 1);
              setCurrentIndex(prev);
              setBlankWord(getGapForLine(prev, synced[prev].text));
              setWaitingInput(false);
              safePlayerCall((p) => {
                 p.seekTo(synced[prev].ms / 1000, true);
                 p.playVideo();
              });
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <NodeViewWrapper className="my-6">
      {synced.length && embedUrl ? renderPlayer() : renderSetup()}
    </NodeViewWrapper>
  );
};

// --- NODE DEF ---
export const MusicNode = Node.create({
  name: "music",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { music: { default: null } };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-music]",
        getAttrs: (el) => {
          try {
            return { music: JSON.parse(el.getAttribute("data-music") || "") };
          } catch {
            return { music: null };
          }
        },
      },
      {
        tag: "music-node",
        getAttrs: (el) => {
          try {
            return { music: JSON.parse(el.getAttribute("music") || "") };
          } catch {
            return { music: null };
          }
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "music-node",
      mergeAttributes(HTMLAttributes, {
        music: JSON.stringify(HTMLAttributes.music),
      }),
    ];
  },
  addCommands() {
    return {
      insertMusic:
        (p) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({ type: this.name, attrs: { music: p } })
            .run(),
      setMusicAttrs:
        (a) =>
        ({ chain }) =>
          chain()
            .focus()
            .updateAttributes(this.name, { music: a })
            .run(),
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MusicNodeView);
  },
});

export default MusicNode;