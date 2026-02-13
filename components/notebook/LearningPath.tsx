"use client";

import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Ear,
  Shuffle,
  Brain,
  FileQuestion,
  Headphones,
  Lock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { CoffeeIcon } from "@/public/animated/coffee";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { purchaseReplaySession } from "@/actions/srsActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// --- Interfaces ---
interface DayNode {
  day: number;
  status: "locked" | "current" | "completed" | "atrasado";
  type: string;
}

interface LearningPathProps {
  currentDay: number;
  daysSinceClass?: number;
  hasActiveLesson?: boolean;
  userXP?: number;
  planId?: string;
}

// Configurações visuais (Fáceis de ajustar)
const CONFIG = {
  desktopItemHeight: 120, // Distância vertical entre bolinhas
  desktopAmplitude: 70, // O quanto ela vai para esquerda/direita (zigue-zague)
  desktopCenter: 150, // O centro do container (largura 300px / 2)
};

export function LearningPath({
  currentDay,
  daysSinceClass,
  hasActiveLesson = true,
  userXP = 0,
  planId,
}: LearningPathProps) {
  const t = useTranslations("LearningPath");
  const isStandalone = useIsStandalone();
  const router = useRouter();

  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [selectedReplayDay, setSelectedReplayDay] = useState<number | null>(
    null,
  );
  const [replayCost, setReplayCost] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleDayClick = (day: DayNode) => {
    // If it's a completed day, we trigger replay logic
    if (day.status === "completed") {
      const diff = Math.max(0, currentDay - day.day);
      const cost = 50 + diff * 10;
      setReplayCost(cost);
      setSelectedReplayDay(day.day);
      setReplayModalOpen(true);
      return;
    }

    // If it's locked, do nothing
    if (day.status === "locked") return;

    // If it's current/atrasado, navigate normally
    router.push("/hub/student/my-practice");
  };

  const handleConfirmReplay = async () => {
    if (!planId || selectedReplayDay === null) return;

    if (userXP < replayCost) {
      toast.error("Insufficient XP points for this replay.");
      return;
    }

    setIsPurchasing(true);
    try {
      await purchaseReplaySession(planId, selectedReplayDay, currentDay);
      toast.success("Session unlocked! Starting replay...");
      setReplayModalOpen(false);
      router.push(
        `/hub/student/my-practice?day=${selectedReplayDay}&replay=true`,
      );
    } catch (error) {
      console.error("purchaseReplaySession error", error);
      toast.error("Failed to purchase replay session.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!hasActiveLesson) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
          <CoffeeIcon size={48} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">
          {t("noLessonsTitle")}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-[250px]">
          {t("noLessonsMessage")}
        </p>
      </div>
    );
  }

  // 1. Gerar exatamente 6 dias
  const allDays: DayNode[] = Array.from({ length: 6 }, (_, i) => {
    const dayNum = i + 1;
    let status: DayNode["status"] = "locked";
    if (currentDay > dayNum) status = "completed";
    else if (currentDay === dayNum) {
      status =
        daysSinceClass !== undefined && dayNum < daysSinceClass
          ? "atrasado"
          : "current";
    }

    // Tipos de ícones variados
    const types = [
      "flashcard_visual",
      "gap_fill_listening",
      "sentence_unscramble",
      "flashcard_recall",
      "quiz_comprehensive",
      "listening_choice",
    ];
    return { day: dayNum, type: types[i], status };
  });

  // Filtro para Mobile (Mostra janela de 3 dias: Anterior, Atual, Próximo)
  let mobileStartIndex = currentDay - 2;
  if (mobileStartIndex < 0) mobileStartIndex = 0;
  if (mobileStartIndex > 3) mobileStartIndex = 3; // Trava para não sobrar espaço vazio no fim
  const mobileDays = allDays.slice(mobileStartIndex, mobileStartIndex + 3);

  return (
    <div className="w-full relative flex justify-center items-center">
      {/* Replay Confirmation Modal */}
      <Dialog open={replayModalOpen} onOpenChange={setReplayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replay Day {selectedReplayDay}</DialogTitle>
            <DialogDescription>
              Do you want to replay this session?
              <br />
              <br />
              <span className="font-bold text-foreground">
                Cost: {replayCost} XP
              </span>
              <br />
              <span className="text-muted-foreground">
                Your Balance: {userXP} XP
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReplay}
              disabled={isPurchasing || userXP < replayCost || !planId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPurchasing
                ? "Unlocking..."
                : !planId
                  ? "Loading..."
                  : "Confirm & Play"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "flex lg:hidden flex-col items-center w-full py-8",
          isStandalone && "hidden",
        )}
      >
        <div className="relative flex items-center justify-center gap-6 md:gap-12">
          {/* Linha de Fundo Mobile */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full" />

          {mobileDays.map((day) => (
            <NodeItem
              key={day.day}
              day={day}
              isMobile={true}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-400">
          Swipe or complete lessons to advance
        </p>
      </div>

      {/* ================= DESKTOP VIEW (Vertical ZigZag) ================= */}
      <div
        className={cn(
          "hidden lg:block relative w-[300px]",
          isStandalone && "block",
        )}
        style={{ height: allDays.length * CONFIG.desktopItemHeight + 50 }}
      >
        <SnakePathSVG days={allDays} />

        {allDays.map((day, index) => {
          const pos = getPosition(index); // Pega X e Y exatos
          return (
            <div
              key={day.day}
              className="absolute top-0 left-0 transition-all duration-500"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                marginLeft: -40,
                marginTop: -40,
              }}
            >
              <NodeItem
                day={day}
                isMobile={false}
                onClick={() => handleDayClick(day)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Lógica Matemática do Posicionamento ---
// Retorna {x, y} do centro de cada bolinha
function getPosition(index: number) {
  const y = index * CONFIG.desktopItemHeight + 60; // +60 para dar margem no topo

  // Padrão de Zigue-Zague: Centro -> Esquerda -> Centro -> Direita
  // Index % 4 define o ciclo: 0(Meio), 1(Esq), 2(Meio), 3(Dir)
  let x = CONFIG.desktopCenter;

  const cycle = index % 4;
  if (cycle === 1) x = CONFIG.desktopCenter - CONFIG.desktopAmplitude; // Esquerda
  if (cycle === 3) x = CONFIG.desktopCenter + CONFIG.desktopAmplitude; // Direita

  return { x, y };
}

// --- Componente da Linha Curva (SVG) ---
function SnakePathSVG({ days }: { days: DayNode[] }) {
  // Constrói o "path" do SVG conectando os pontos
  let pathD = "";

  days.forEach((_, index) => {
    if (index === days.length - 1) return; // Não desenha linha a partir do último

    const current = getPosition(index);
    const next = getPosition(index + 1);

    // Ponto Inicial
    if (index === 0) pathD += `M ${current.x} ${current.y} `;

    // Lógica da Curva de Bézier (C)
    // Control Point 1: Sai verticalmente para baixo (Y + metade do caminho)
    // Control Point 2: Chega verticalmente de cima (Y - metade do caminho)
    const midY = (current.y + next.y) / 2;

    pathD += `C ${current.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y} `;
  });

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
      {/* Linha de Fundo (Cinza escuro/tracejado) */}
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="20 20"
        className="text-slate-200 dark:text-slate-700"
      />
    </svg>
  );
}

// --- Componente Visual do Botão (Node) ---
function NodeItem({
  day,
  isMobile,
  onClick,
}: {
  day: DayNode;
  isMobile: boolean;
  onClick: () => void;
}) {
  const Icon = getIconForType(day.type);
  const isCurrent = day.status === "current" || day.status === "atrasado";

  return (
    <div className="flex flex-col items-center relative group z-10">
      <div
        onClick={onClick}
        className={
          day.status === "locked" ? "cursor-default" : "cursor-pointer"
        }
      >
        <motion.div
          whileHover={
            day.status !== "locked" ? { scale: 1.1, translateY: -5 } : {}
          }
          whileTap={day.status !== "locked" ? { scale: 0.95 } : {}}
          className={cn(
            "rounded-[35px] flex items-center justify-center shadow-lg transition-all relative border-b-[6px]",
            isMobile ? "w-20 h-20" : "w-24 h-24", // Botões grandes e clicáveis

            // Cores
            day.status === "completed"
              ? "bg-yellow-400 border-yellow-600 text-white"
              : day.status === "atrasado"
                ? "bg-rose-500 border-rose-700 text-white"
                : day.status === "current"
                  ? "bg-indigo-500 border-indigo-700 text-white ring-8 ring-indigo-500/20"
                  : "bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-700 dark:border-slate-900 dark:text-slate-900",
          )}
        >
          {day.status === "completed" ? (
            <div className="relative">
              <Star size={32} fill="currentColor" className="text-yellow-100" />
            </div>
          ) : day.status === "locked" ? (
            <Lock size={28} />
          ) : (
            <Icon size={32} strokeWidth={2.5} className="fill-transparent" />
          )}

          {/* Balão "START" */}
          {isCurrent && (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -10 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 0.8,
              }}
              className="absolute -top-12 bg-white dark:bg-slate-200 text-indigo-600 px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl border-2 border-indigo-100 z-20 whitespace-nowrap"
            >
              {day.status === "atrasado" ? "LATE!" : "START"}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-200 border-b-2 border-r-2 border-indigo-100 rotate-45"></div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Texto do Dia */}
      <div
        className={cn(
          "mt-3 font-bold uppercase tracking-widest text-sm",
          isCurrent ? "text-indigo-400" : "text-slate-500 dark:text-slate-600",
        )}
      >
        Day {day.day}
      </div>
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case "flashcard_visual":
      return ImageIcon;
    case "gap_fill_listening":
      return Ear;
    case "sentence_unscramble":
      return Shuffle;
    case "flashcard_recall":
      return Brain;
    case "quiz_comprehensive":
      return FileQuestion;
    case "listening_choice":
      return Headphones;
    default:
      return FileQuestion;
  }
}
