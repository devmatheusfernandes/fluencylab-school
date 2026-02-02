import { useState, useEffect, useRef, useCallback } from "react";

// Configuration
const MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// WebSocket URL - v1beta is required for Live API
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
const TIME_LIMIT_MS = 300000; // 5 minutes
const WARNING_TIME_MS = 270000; // 4.5 minutes

// Audio Worklet Code (Inline to avoid file serving issues)
// FIXED: Added buffering to avoid flooding the main thread/WS with tiny chunks
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetSampleRate = 16000;
    // Buffer size to send (~0.1s of audio at 16kHz = 1600 samples)
    this.CHUNK_SIZE = 1600; 
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    
    const inputChannel = input[0];
    const contextSampleRate = sampleRate;
    
    // Calculate Volume (RMS) for Visualization / VAD
    let sum = 0;
    for (let i = 0; i < inputChannel.length; i++) {
      sum += inputChannel[i] * inputChannel[i];
    }
    const rms = Math.sqrt(sum / inputChannel.length);
    // Send volume updates less frequently? Or every frame is okay for visualizer (128 samples is fast)
    // To save message passing, maybe only every 10th frame?
    // For now, let's keep it but maybe throttle in main thread
    this.port.postMessage({ type: 'volume', volume: rms });

    // Downsampling
    // Accumulate input
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer.push(inputChannel[i]);
    }

    // Check if we have enough data to produce a chunk
    const ratio = contextSampleRate / this.targetSampleRate;
    const requiredInput = Math.floor(this.CHUNK_SIZE * ratio);

    if (this.buffer.length >= requiredInput) {
      const outputLength = this.CHUNK_SIZE;
      const result = new Int16Array(outputLength);
      
      for (let i = 0; i < outputLength; i++) {
        const inputIndex = Math.floor(i * ratio);
        const nextIndex = Math.floor((i + 1) * ratio);
        
        // Simple averaging
        let sum = 0;
        let count = 0;
        for(let j = inputIndex; j < nextIndex && j < this.buffer.length; j++) {
            sum += this.buffer[j];
            count++;
        }
        const avg = count > 0 ? sum / count : this.buffer[inputIndex];
        
        const s = Math.max(-1, Math.min(1, avg));
        result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Remove processed samples
      this.buffer.splice(0, Math.floor(outputLength * ratio));
      
      this.port.postMessage({ type: 'audio', data: result.buffer }, [result.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
`;

export interface GeminiLiveState {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  error: string | null;
  volume: number;
  timeLeft: number; // in seconds
  result: any | null; // JSON result
}

export const useGeminiLive = () => {
  const [state, setState] = useState<GeminiLiveState>({
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    error: null,
    volume: 0,
    timeLeft: TIME_LIMIT_MS / 1000,
    result: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningSentRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const lastVolumeUpdateRef = useRef<number>(0);

  // Initialize Audio Context & Worklet
  const initAudio = useCallback(async () => {
    try {
      const context = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        latencyHint: "interactive",
      });

      if (context.state === "suspended") {
        await context.resume();
      }

      const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);

      await context.audioWorklet.addModule(workletUrl);

      audioContextRef.current = context;
      return context;
    } catch (err) {
      console.error("Audio init error:", err);
      setState((prev) => ({ ...prev, error: "Falha ao inicializar áudio." }));
      return null;
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(async () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      console.log("Connecting to Gemini Live...");
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // Initialize Audio Context immediately (requires user interaction via click)
      const context = await initAudio();
      if (!context) {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: "Falha ao iniciar áudio. Verifique permissões.",
        }));
        return;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
        }));

        // Setup Message
        const setupMsg = {
          setup: {
            model: MODEL,
            generationConfig: {
              responseModalities: ["AUDIO"], // UPPERCASE "AUDIO" for v1beta
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: `Você é um avaliador de idiomas especialista e bilíngue (Inglês/Português).
Objetivo: Avaliar o nível de proficiência (CEFR A1-C2) do aluno no idioma que ele deseja praticar.

Fase 1: Identificação
- Comece com uma saudação bilíngue amigável (ex: "Hello! Olá!").
- Identifique qual idioma o aluno quer praticar (Inglês ou Português). O outro será o "idioma de suporte" (ex: Se pratica Inglês, Português é suporte).

Fase 2: Avaliação Adaptativa
- Comece com perguntas simples no idioma alvo.
- Se o aluno responder bem, aumente a complexidade gramatical/vocabular.
- Se o aluno travar ou errar:
  1. Simplifique a pergunta.
  2. IMPORTANTE: Se o nível parecer baixo (A1/A2), você PODE usar o idioma de suporte para encorajar ou explicar brevemente ("Don't worry! Tente dizer..."). Isso ajuda a reduzir a ansiedade.
  3. Para níveis intermediários/avançados (B1+), evite o idioma de suporte.

Fase 3: Conclusão
- Após cerca de 10 turnos, dê um feedback falado construtivo e breve.
- IMEDIATAMENTE chame a função 'report_result' com os dados da avaliação.`,
                },
              ],
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "report_result",
                    description:
                      "Report the evaluation result with level and detailed feedback.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        level: {
                          type: "STRING",
                          description: "CEFR Level (A1, A2, B1, B2, C1, C2)",
                        },
                        feedback: {
                          type: "OBJECT",
                          properties: {
                            strengths: { type: "STRING" },
                            weaknesses: { type: "STRING" },
                            tips: { type: "STRING" },
                          },
                          required: ["strengths", "weaknesses", "tips"],
                        },
                      },
                      required: ["level", "feedback"],
                    },
                  },
                ],
              },
            ],
          },
        };
        console.log(
          "Sending Setup Message:",
          JSON.stringify(setupMsg, null, 2),
        );
        ws.send(JSON.stringify(setupMsg));
        startTimer();
      };

      ws.onmessage = async (event) => {
        let textData = event.data;
        if (event.data instanceof Blob) {
          textData = await event.data.text();
        }

        try {
          const data = JSON.parse(textData);
          // console.log("Received:", data); // Debug log (optional, noisy)

          // Handle Server Content
          if (data.serverContent) {
            const { modelTurn } = data.serverContent;
            if (modelTurn && modelTurn.parts) {
              for (const part of modelTurn.parts) {
                // Handle Audio
                if (
                  part.inlineData &&
                  part.inlineData.mimeType.startsWith("audio/pcm")
                ) {
                  const base64 = part.inlineData.data;
                  playAudioChunk(base64);
                }
              }
            }
          }

          // Handle Tool Call (Function Calling)
          if (data.toolCall) {
            console.log("Tool Call Received:", data.toolCall);
            const functionCalls = data.toolCall.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              const call = functionCalls[0];
              if (call.name === "report_result") {
                const args = call.args;
                console.log("Evaluation Result:", args);
                setState((prev) => ({ ...prev, result: args }));
                stop();
              }
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setState((prev) => ({
          ...prev,
          error: "Erro na conexão com IA.",
          isConnected: false,
        }));
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isRecording: false,
        }));
        stopAudio();
        stopTimer();
      };
    } catch (err) {
      console.error("Connection error:", err);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: "Falha ao conectar.",
      }));
    }
  }, []);

  // Timer Logic
  const startTimer = () => {
    startTimeRef.current = Date.now();
    warningSentRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
      setState((prev) => ({ ...prev, timeLeft: Math.ceil(remaining / 1000) }));

      // Warning at 4.5 mins
      if (elapsed >= WARNING_TIME_MS && !warningSentRef.current) {
        warningSentRef.current = true;
        // Optional: Send visual warning or inject audio prompt if possible
      }

      if (elapsed >= TIME_LIMIT_MS) {
        stop();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Stop everything
  const stop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudio();
    stopTimer();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isRecording: false,
      isConnecting: false,
    }));
  }, []);

  // Audio Playback
  const playAudioChunk = async (base64: string) => {
    try {
      if (!audioContextRef.current) {
        console.warn("Audio context not ready, dropping audio chunk");
        return;
      }

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);

      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = audioContextRef.current.createBuffer(
        1,
        float32.length,
        24000,
      ); // Gemini output is 24kHz
      buffer.getChannelData(0).set(float32);

      audioQueueRef.current.push(buffer);
      processAudioQueue();
    } catch (e) {
      console.error("Audio decode error:", e);
    }
  };

  const processAudioQueue = () => {
    if (
      isPlayingRef.current ||
      audioQueueRef.current.length === 0 ||
      !audioContextRef.current
    )
      return;

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    // Schedule just a bit ahead if queue was empty, or at nextPlayTime
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);

    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        // Reset nextPlayTime if queue is empty to avoid drift delay
        if (audioContextRef.current) {
          nextPlayTimeRef.current = audioContextRef.current.currentTime;
        }
      } else {
        isPlayingRef.current = false; // Trigger next loop
        processAudioQueue();
      }
    };
  };

  const stopAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .then(() => {
          audioContextRef.current = null;
        })
        .catch(() => {});
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
  };

  // Recording
  const startRecording = useCallback(async () => {
    if (!wsRef.current || state.isRecording) return;

    try {
      const context = await initAudio();
      if (!context) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Try to request 16kHz
        },
      });
      streamRef.current = stream;

      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, "pcm-processor");

      worklet.port.onmessage = (event) => {
        const { type, data, volume } = event.data;

        if (type === "volume") {
          // Throttle volume updates
          const now = Date.now();
          if (now - lastVolumeUpdateRef.current > 100) {
            // 100ms throttle
            setState((prev) => ({
              ...prev,
              volume: Math.min(100, volume * 100 * 5),
            })); // Boost visualization
            lastVolumeUpdateRef.current = now;
          }
        } else if (type === "audio") {
          // Send audio chunk
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));

            wsRef.current.send(
              JSON.stringify({
                realtimeInput: {
                  mediaChunks: [
                    {
                      mimeType: "audio/pcm;rate=16000",
                      data: base64,
                    },
                  ],
                },
              }),
            );
          }
        }
      };

      source.connect(worklet);
      worklet.connect(context.destination); // Connect to destination to keep it alive? Or strictly for processing?
      // Actually, connecting to destination might cause feedback if not careful, but Worklet output is empty/volume?
      // Our worklet doesn't output audio to speaker, so it's fine.

      audioWorkletNodeRef.current = worklet;
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (err) {
      console.error("Recording start error:", err);
      setState((prev) => ({ ...prev, error: "Erro ao acessar microfone." }));
    }
  }, [state.isRecording, initAudio]);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    // Don't close context here if we want to hear response?
    // Actually we should keep context for playback.
    setState((prev) => ({ ...prev, isRecording: false, volume: 0 }));
  }, []);

  return {
    state,
    connect,
    startRecording,
    stopRecording,
    stop,
  };
};
