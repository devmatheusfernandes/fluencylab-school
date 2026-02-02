"use client";

import React, { useEffect, useRef } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Mic, Square, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "../ui/empty";

export default function ConversationLeveling() {
  const { connect, startRecording, stop, state } = useGeminiLive();
  const hasStartedRef = useRef(false);

  // Auto-start recording when connected
  useEffect(() => {
    if (state.isConnected && !state.isRecording && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startRecording();
    }
  }, [state.isConnected, state.isRecording, startRecording]);

  // Save result when available
  useEffect(() => {
    if (state.result) {
      saveResult(state.result);
    }
  }, [state.result]);

  const saveResult = (result: any) => {
    try {
      const stored = localStorage.getItem("fluencylab-placement-history");
      const history = stored ? JSON.parse(stored) : [];
      history.push({
        date: new Date().toISOString(),
        level: result.level,
        feedback: result.feedback,
      });
      localStorage.setItem(
        "fluencylab-placement-history",
        JSON.stringify(history),
      );
    } catch (e) {
      console.error("Failed to save result", e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Result View
  if (state.result) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl text-emerald-900">
                Avaliação Concluída!
              </CardTitle>
              <CardDescription>
                Aqui está o seu resultado detalhado.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-emerald-100">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Nível Estimado
            </span>
            <span className="text-6xl font-bold text-emerald-600 mt-2">
              {state.result.level}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-white rounded-lg border space-y-2">
              <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                Pontos Fortes
              </h4>
              <p className="text-sm text-gray-600">
                {state.result.feedback.strengths}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border space-y-2">
              <h4 className="font-semibold text-rose-800 flex items-center gap-2">
                Pontos a Melhorar
              </h4>
              <p className="text-sm text-gray-600">
                {state.result.feedback.weaknesses}
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-indigo-800 mb-2">
              Dicas de Estudo
            </h4>
            <p className="text-sm text-indigo-700">
              {state.result.feedback.tips}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <span className="text-xs text-muted-foreground">
            Resultado salvo no histórico.
          </span>
          <Button onClick={() => window.location.reload()} variant="outline">
            Nova Avaliação
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Active View
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader>
        <CardTitle>Simulador de Nivelamento</CardTitle>
        <CardDescription>
          Converse com a IA para descobrir seu nível de inglês.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-8 relative">
        {state.error && (
          <div className="absolute top-0 w-full px-4 z-20">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Erro</EmptyTitle>
                <EmptyDescription>{state.error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        {/* Status Indicator & Visuals */}
        <div className="relative">
          {/* Animated Rings when Active */}
          {(state.isConnected || state.isConnecting) && (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-indigo-500/20"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full bg-indigo-500/10"
              />
            </>
          )}

          {/* Center Icon */}
          <div
            className={cn(
              "h-32 w-32 rounded-full flex items-center justify-center transition-all duration-500 z-10 relative",
              state.isConnected
                ? "bg-indigo-600 shadow-xl shadow-indigo-500/30"
                : "bg-gray-100",
            )}
          >
            {state.isConnecting ? (
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            ) : state.isConnected ? (
              <Mic className="h-12 w-12 text-white" />
            ) : (
              <Mic className="h-12 w-12 text-gray-400" />
            )}
          </div>
        </div>

        {/* Volume Visualizer Bars */}
        {state.isConnected && (
          <div className="flex items-end justify-center gap-1 h-8 w-full px-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-2 bg-indigo-400 rounded-t-full"
                animate={{
                  height: Math.max(
                    8,
                    state.volume * 200 * (0.5 + Math.random() * 0.5),
                  ),
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            ))}
          </div>
        )}

        {/* Timer & Status Text */}
        <div className="text-center space-y-1">
          {state.isConnected ? (
            <>
              <p className="text-3xl font-mono font-medium text-slate-700">
                {formatTime(state.timeLeft)}
              </p>
              <p className="text-sm text-muted-foreground animate-pulse">
                {state.volume > 0.05 ? "Ouvindo..." : "Falando..."}
                {/* Note: Ideally we should differentiate user speaking vs AI speaking. 
                            The hook has isPlayingRef but not exposed in state. 
                            For now, volume > 0.05 means user is likely speaking. */}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Clique em iniciar para começar a entrevista de nivelamento (aprox.
              5 min).
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-center pb-8">
        {!state.isConnected ? (
          <Button
            size="lg"
            className="w-full max-w-xs text-lg h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={connect}
            disabled={state.isConnecting}
          >
            {state.isConnecting ? "Conectando..." : "Iniciar Avaliação"}
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="lg"
            className="w-full max-w-xs text-lg h-12 rounded-full"
            onClick={stop}
          >
            <Square className="mr-2 h-5 w-5 fill-current" /> Parar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
