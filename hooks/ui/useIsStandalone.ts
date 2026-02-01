// hooks/use-is-standalone.ts
import { useState, useEffect } from "react";

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Garante que só roda no cliente (evita erro de window is undefined no SSR)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const checkStandalone = () => {
      const isStandaloneMode =
        mediaQuery.matches ||
        (window.navigator as any).standalone === true; // Fallback para iOS antigo

      setIsStandalone(isStandaloneMode);
    };

    // Verificação inicial
    checkStandalone();

    // Escuta mudanças (caso o usuário instale o app enquanto navega)
    mediaQuery.addEventListener("change", checkStandalone);

    // Cleanup ao desmontar
    return () => mediaQuery.removeEventListener("change", checkStandalone);
  }, []);

  return isStandalone;
}