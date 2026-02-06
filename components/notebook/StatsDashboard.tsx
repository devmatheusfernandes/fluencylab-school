"use client";

import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils"; // Certifique-se de ter essa lib ou use template literals padrão

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "success" | "warning" | "info";
}

function StatCard({ title, value, icon, variant }: StatCardProps) {
  // Mapa de cores para design "Flat" e "Cheio"
  const colorMap = {
    success: "bg-emerald-500 text-white", // Verde moderno
    warning: "bg-orange-500 text-white", // Laranja vibrante
    info: "bg-blue-600 text-white", // Azul sólido
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md p-3 lg:p-4 shadow-sm border-0 transition-all hover:contrast-[1.2] ease-in-out duration-300 cursor-pointer",
        colorMap[variant],
        // No desktop, queremos que o card ocupe a largura total da coluna
        "w-full flex flex-col justify-between min-h-[85px] lg:min-h-[100px]",
      )}
    >
      {/* Círculo decorativo translúcido no fundo (Toque Minimalista) */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white opacity-10 pointer-events-none" />

      {/* Topo: Ícone e Título */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-widest opacity-90">
          {title}
        </h3>
        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
          {icon}
        </div>
      </div>

      {/* Base: Valor */}
      <p className="text-xl lg:text-3xl font-black tracking-tight relative z-10">
        {value}
      </p>
    </div>
  );
}

interface StatsDashboardProps {
  reviewedToday: number;
  dueToday: number;
  totalLearned: number;
}

export function StatsDashboard({
  reviewedToday,
  dueToday,
  totalLearned,
}: StatsDashboardProps) {
  return (
    // LÓGICA DO LAYOUT:
    // Mobile (< lg): grid-cols-3 (Horizontal / Lado a lado)
    // Desktop (lg): flex-col (Vertical / Empilhado)
    <div className="w-full grid grid-cols-3 lg:flex lg:flex-col gap-3 lg:gap-4">
      <StatCard
        title="Reviewed"
        value={reviewedToday}
        icon={<CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        variant="success"
      />

      <StatCard
        title="Due Today"
        value={dueToday}
        icon={<Clock className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        variant="warning"
      />

      <StatCard
        title="Learned"
        value={totalLearned}
        icon={<BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        variant="info"
      />
    </div>
  );
}
