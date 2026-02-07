"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function OfflinePage() {
  return (
    <Container className="flex h-[80vh] flex-col items-center justify-center space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-muted p-6 animate-pulse">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">
            Você está offline
          </h1>
          <p className="text-muted-foreground max-w-[300px] text-sm">
            Parece que você perdeu a conexão com a internet. Verifique seu sinal
            e tente novamente.
          </p>
        </div>
      </div>
      <Button
        onClick={() => window.location.reload()}
        size="lg"
        className="min-w-[140px]"
      >
        Tentar novamente
      </Button>
    </Container>
  );
}
