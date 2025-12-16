"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Music,
  User,
  Youtube,
  Play,
  RotateCcw,
  ChevronLeft,
  Check,
  X,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TIPAGENS E FUNÇÕES AUXILIARES ---

type LrcLine = { ms: number; text: string };

// Declaração de módulo para evitar erro de tipagem no Tiptap
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
async function fetchLrc(
  track: string,
  artist: string
): Promise<{ lrc?: string; synced?: LrcLine[] } | null> {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr: unknown = await r.json();
    if (!Array.isArray(arr)) return null;
    const item = (arr as LrcLibItem[]).find(
      (x) =>
        typeof x?.syncedLyrics === "string" ||
        typeof x?.plainLyrics === "string"
    );
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
export const MusicNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
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

  const [videoUrl, setVideoUrl] = useState<string>(
    () => attrs.music?.videoUrl || ""
  );
  const [track, setTrack] = useState<string>(() => attrs.music?.track || "");
  const [artist, setArtist] = useState<string>(() => attrs.music?.artist || "");
  const [pauseEvery, setPauseEvery] = useState<1 | 2>(
    () => (attrs.music?.pauseEvery as 1 | 2) || 1
  );
  const [synced, setSynced] = useState<LrcLine[]>(
    () => attrs.music?.synced || []
  );
  const [loading, setLoading] = useState(false);

  // Estados do Jogo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [blankWord, setBlankWord] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [playerReady, setPlayerReady] = useState(false);

  // Refs para acesso síncrono dentro do setInterval
  const playerRef = useRef<YTPlayer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const currentIndexRef = useRef<number>(0);
  const waitingInputRef = useRef<boolean>(false);
  const blankWordRef = useRef<string | null>(null); // Novo ref para controlar o gap no loop
  const startPendingRef = useRef<boolean>(false);

  // --- HELPERS DE TEMPO ---
  const getLineStartMs = (idx: number) => synced[idx]?.ms ?? 0;
  const getLineEndMs = (idx: number) => {
    const next = synced[idx + 1];
    // Se houver próxima linha, o fim é o início dela (menos um buffer) ou + duraçao fixa
    if (next && typeof next.ms === "number") return next.ms - 100;
    return (synced[idx]?.ms ?? 0) + 3000; // Fallback para última linha
  };

  const embedUrl = useMemo(
    () => (videoUrl ? buildEmbedUrl(videoUrl) : null),
    [videoUrl]
  );

  // Sincroniza Refs com Estados
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    waitingInputRef.current = waitingInput;
  }, [waitingInput]);
  useEffect(() => {
    blankWordRef.current = blankWord;
  }, [blankWord]);

  // Inicialização do Player (YouTube API)
  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;

    const initPlayer = () => {
      const yt = window.YT;
      if (yt?.Player && iframeRef.current) {
        playerRef.current = new yt.Player(iframeRef.current, {
          events: {
            onReady: (e: any) => {
              playerRef.current = e.target;
              setPlayerReady(true);
              if (startPendingRef.current) {
                startGame(); // Inicia se o usuário clicou antes de carregar
              }
            },
            onStateChange: (e: any) => {
              // Lógica extra de estado se necessário
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [embedUrl]);

  const saveAttrs = (next: Partial<MusicAttrs["music"]>) => {
    const base = attrs.music || {};
    updateAttributes?.({ music: { ...base, ...next } });
  };

  const handleSetup = async () => {
    if (!videoUrl || !track || !artist) return;
    setLoading(true);
    try {
      const data = await fetchLrc(track, artist);
      const s = data?.synced || [];

      if (s.length === 0) {
        toast.error("Nenhuma letra disponível para esta música.");
      }

      setSynced(s);
      saveAttrs({
        videoUrl,
        track,
        artist,
        lrc: data?.lrc || "",
        synced: s,
        pauseEvery,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INICIAR O JOGO ---
  const startGame = () => {
    if (!playerReady) {
      startPendingRef.current = true;
      return;
    }
    if (!synced.length) return;

    setStarted(true);
    setWaitingInput(false);
    setInputValue("");
    setFeedback(null);

    // Configura primeira linha
    const firstIdx = 0;
    const firstWord = chooseBlankWord(synced[firstIdx]?.text || "");

    setCurrentIndex(firstIdx);
    setBlankWord(firstWord);

    // Play imediato
    try {
      playerRef.current?.seekTo?.(0, true);
      playerRef.current?.playVideo?.();
    } catch {}

    // Inicia Loop de Monitoramento
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(gameLoop, 100);
  };

  // --- LOOP PRINCIPAL (HEARTBEAT) ---
  const gameLoop = () => {
    if (!playerRef.current?.getCurrentTime) return;

    const currentTimeMs = (playerRef.current.getCurrentTime() || 0) * 1000;
    const idx = currentIndexRef.current;

    // 1. CHECAGEM DE AVANÇO (TRIGGER DE INÍCIO DA PRÓXIMA FRASE)
    // Se a palavra atual já foi descoberta (blankWordRef é null) e não estamos esperando input
    if (!blankWordRef.current && !waitingInputRef.current) {
      const nextIdx = idx + 1;
      if (nextIdx < synced.length) {
        const nextLineStart = getLineStartMs(nextIdx);

        // Se o vídeo passou do ponto de início da próxima linha
        if (currentTimeMs >= nextLineStart) {
          const nextWord = chooseBlankWord(synced[nextIdx]?.text || "");
          setCurrentIndex(nextIdx);
          setBlankWord(nextWord);
          // O vídeo continua tocando, apenas atualizamos a UI para o novo desafio
        }
      }
    }

    // 2. CHECAGEM DE PAUSA (TRIGGER DE FIM DA FRASE ATUAL)
    // Se temos uma palavra oculta (blankWordRef existe) e ainda não pausamos
    if (blankWordRef.current && !waitingInputRef.current) {
      const lineEnd = getLineEndMs(idx);

      // Verifica se devemos pausar nesta linha baseado na config 'pauseEvery'
      const shouldPauseLine = (idx + 1) % pauseEvery === 0;
      if (currentTimeMs >= lineEnd && shouldPauseLine) {
        try {
          // Adicione as interrogações aqui:
          playerRef.current?.pauseVideo?.();
        } catch {}

        setWaitingInput(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // --- SUBMETER RESPOSTA ---
  const submitAnswer = () => {
    const target = synced[currentIndex];
    if (!target || !blankWord) return;

    const v = normalizeWord(inputValue);
    const b = normalizeWord(blankWord);

    if (v && b && v === b) {
      // CORRETO
      setFeedback("correct");

      // Salva progresso (opcional)
      const nextAns = {
        ...(attrs.music?.useranswers || {}),
        [String(currentIndex)]: inputValue.trim(),
      };
      saveAttrs({ useranswers: nextAns });

      // LÓGICA DE CONTINUAÇÃO
      // 1. Oculta o input
      setWaitingInput(false);
      setInputValue("");

      // 2. Revela a palavra (Visualmente preenche o gap)
      setBlankWord(null);

      // 3. Retoma o vídeo do ponto onde parou
      try {
        playerRef.current?.playVideo?.();
      } catch {}

      // NOTA: Não avançamos o currentIndex aqui.
      // O gameLoop vai detectar quando o vídeo chegar no tempo da próxima linha e fará o avanço.

      setTimeout(() => setFeedback(null), 800);
    } else {
      // INCORRETO
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
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Pausar a cada:
              </span>
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
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando
                Letra...
              </>
            ) : (
              "Criar Exercício"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };
  const renderPlayer = () => {
    return (
      <Card className="max-w-2xl mx-auto overflow-hidden shadow-md border-muted">
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
            <div className="flex items-center justify-center h-full text-white/50">
              Vídeo indisponível
            </div>
          )}
        </div>

        <CardContent className="p-4 md:p-6 space-y-6">
          {!started ? (
            <div className="text-center py-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">
                  {track || "Música Desconhecida"}
                </h3>
                <p className="text-muted-foreground">
                  {artist || "Artista Desconhecido"}
                </p>
              </div>
              <Button size="lg" onClick={startGame} className="gap-2 px-8">
                <Play className="w-5 h-5 fill-current" /> Iniciar Prática
              </Button>
            </div>
          ) : (
            <>
              {/* Lyrics Display Area */}
              <div className="min-h-[140px] flex flex-col justify-center items-center text-center space-y-2 p-6 rounded-xl bg-muted/30 border border-muted transition-all duration-500">
                {(() => {
                  const line = synced[currentIndex];
                  if (!line)
                    return (
                      <span className="text-muted-foreground italic">
                        Fim da música!
                      </span>
                    );

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
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                      <Badge
                        variant="outline"
                        className="mb-2 text-xs font-normal text-muted-foreground"
                      >
                        {ts}
                      </Badge>
                      <div className="text-lg md:text-2xl font-medium leading-relaxed max-w-lg">
                        {!blankWord ? (
                          // Mostra texto completo se blankWord for null (usuário acertou)
                          <span className="text-green-600 dark:text-green-400 transition-colors duration-300">
                            {text}
                          </span>
                        ) : (
                          // Mostra com Gap
                          <span className="inline-flex flex-wrap justify-center gap-1 items-baseline">
                            <span>{before}</span>
                            <span className="border-b-2 border-primary w-24 inline-block mx-1 animate-pulse bg-primary/5 rounded-sm h-6 align-middle relative top-1"></span>
                            <span>{after}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Input Control - Só aparece quando waitingInput é true */}
              <div className="h-[80px] flex items-center justify-center">
                {waitingInput && blankWord ? (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <Input
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          if (feedback) setFeedback(null);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          inputValue.trim() &&
                          submitAnswer()
                        }
                        placeholder="Digite a palavra..."
                        className={cn(
                          "h-12 text-lg text-center bg-background shadow-sm",
                          feedback === "correct" &&
                            "border-green-500 ring-1 ring-green-500",
                          feedback === "incorrect" &&
                            "border-red-500 ring-1 ring-red-500"
                        )}
                        autoFocus
                        autoComplete="off"
                      />
                      <Button
                        size="icon"
                        className={cn(
                          "h-12 w-12 shrink-0 shadow-sm",
                          feedback === "correct" &&
                            "bg-green-600 hover:bg-green-700",
                          feedback === "incorrect" &&
                            "bg-red-600 hover:bg-red-700"
                        )}
                        onClick={submitAnswer}
                        disabled={!inputValue.trim()}
                      >
                        {feedback === "correct" ? (
                          <Check className="w-6 h-6" />
                        ) : feedback === "incorrect" ? (
                          <X className="w-6 h-6" />
                        ) : (
                          <Check className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Estado de "Tocando" ou "Aguardando próxima linha"
                  <div className="flex justify-center items-center gap-2 text-muted-foreground text-sm animate-pulse">
                    <Music className="w-4 h-4" />
                    {blankWord ? "Ouvindo..." : "Aguardando próxima frase..."}
                  </div>
                )}
              </div>

              {/* Botões de Controle Inferiores */}
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    // Replay da linha ATUAL
                    const idx = currentIndexRef.current;
                    const start = getLineStartMs(idx) / 1000;
                    setWaitingInput(false);
                    try {
                      playerRef.current?.seekTo?.(start, true);
                      playerRef.current?.playVideo?.();
                    } catch {}
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Replay Trecho
                </Button>

                <Separator orientation="vertical" className="h-8" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    // Voltar para linha anterior
                    const prev = Math.max(currentIndexRef.current - 1, 0);
                    const prevWord = chooseBlankWord(synced[prev]?.text || "");

                    setCurrentIndex(prev);
                    setBlankWord(prevWord);
                    setWaitingInput(false);
                    setInputValue("");

                    const start = getLineStartMs(prev) / 1000;
                    try {
                      playerRef.current?.seekTo?.(start, true);
                      playerRef.current?.playVideo?.();
                    } catch {}
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Voltar Anterior
                </Button>
              </div>
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
          return chain()
            .focus()
            .updateAttributes(this.name, { music: attrs })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MusicNodeView);
  },
});

export default MusicNode;
