import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div
      className={`container-base w-full p-2 sm:p-3 rounded-b-lg transition-colors duration-300 overflow-y-scroll no-scrollbar gap-2 ${className}`}
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
      className={`w-full rounded-b-lg overflow-y-auto transition-colors duration-300 no-scrollbar gap-2 p-1 sm:p-2 ${className}`}
    >
      {children}
    </div>
  );
};