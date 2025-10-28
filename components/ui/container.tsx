import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div
      className={`container-base w-full rounded-b-lg transition-colors duration-300 overflow-y-scroll no-scrollbar gap-2 p-1 sm:p-2 no-scrollbar ${className}`}
    >
      {children}
    </div>
  );
};
