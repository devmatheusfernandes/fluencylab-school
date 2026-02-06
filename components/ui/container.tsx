import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: ContainerProps) => {
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();

  return (
    <div
      className={cn(
        "container-base w-full p-2 sm:p-2 rounded-b-lg transition-colors duration-300 overflow-y-scroll no-scrollbar gap-2",
        isMobile && "",
        isStandalone && "bg-[rgba(187, 187, 187, 0.08)]!",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface ContainerCardProps {
  children: ReactNode;
  className?: string;
}

export const ContainerCard = ({
  children,
  className = "",
}: ContainerCardProps) => {
  return (
    <div
      className={cn(
        "w-full rounded-b-lg overflow-y-auto transition-colors duration-300 no-scrollbar gap-2 p-1 sm:p-2",
        className,
      )}
    >
      {children}
    </div>
  );
};
