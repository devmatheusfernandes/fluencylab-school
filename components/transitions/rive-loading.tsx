"use client";

import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

interface RiveLoadingProps {
  /** * Caminho para o arquivo .riv (ex: "/animations/loader.riv") 
   * O arquivo deve estar na pasta /public
   */
  src: string;
  
  /** Largura em pixels ou porcentagem (padrão: h-32 w-32 do tailwind) */
  width?: number | string;
  height?: number | string;
  
  /** Classes CSS adicionais */
  className?: string;

  /** Nome da State Machine (se houver) no arquivo Rive */
  stateMachine?: string;

  /** Nome da animação específica (caso não use State Machine) */
  animationName?: string;
}

export const RiveLoading = ({
  src,
  stateMachine,
  animationName,
}: RiveLoadingProps) => {
  
  const { RiveComponent } = useRive({
    src: src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    animations: animationName ? [animationName] : undefined,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain, // Garante que a animação não seja cortada
      alignment: Alignment.Center,
    }),
  });

  return (
    <div className={`w-screen h-full flex items-center justify-center relative w-[88px] h-[88px]`} aria-label="Loading">
      <RiveComponent />
    </div>
  );
};