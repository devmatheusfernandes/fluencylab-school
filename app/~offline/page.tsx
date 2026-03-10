"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, RefreshCcw, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const Icon = isOnline ? Wifi : WifiOff;
  const title = isOnline ? "Conexão restaurada" : "Você está offline";
  const description = isOnline
    ? "Sua internet voltou. Você pode recarregar para tentar novamente."
    : "Parece que você perdeu a conexão com a internet. Algumas telas podem continuar disponíveis se já foram abertas antes.";

  return (
    <main className="container-padding min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="w-full max-w-xl space-y-4">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

          <CardHeader className="relative space-y-2">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-muted p-3">
                <Icon className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="max-w-[60ch]">
                  {description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li>Verifique seu Wi‑Fi/dados móveis e o modo avião.</li>
              <li>Se você instalou o app, ele pode abrir mais rápido offline.</li>
              <li>Algumas ações (salvar/atualizar) podem falhar sem internet.</li>
            </ul>
          </CardContent>

          <CardFooter className="relative flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full sm:w-auto"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {isOnline ? "Recarregar" : "Tentar novamente"}
            </Button>

            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Link href="/hub">
                <Home className="mr-2 h-4 w-4" />
                Ir para o hub
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Se a conexão voltar, basta recarregar esta página.
        </p>
      </div>
    </main>
  );
}
