import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface GamificationHeaderProps {
  currentXP: number;
  level: number;
  streak: number;
  nextLevelXP: number;
  prevLevelXP: number;
  onExit: () => void;
}

export function GamificationHeader({
  currentXP,
  level,
  streak,
  nextLevelXP,
  prevLevelXP,
  onExit,
}: GamificationHeaderProps) {
  // Calculate progress within current level
  const currentLevelProgress =
    ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

  return (
    <div className="w-full flex items-center justify-between gap-4 p-4 bg-card/60 backdrop-blur-sm sticky top-0 z-10 border-b rounded-md">
      <Button variant="ghost" size="sm" onClick={onExit}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Level & XP */}
      <div className="flex-1  flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          <span className="absolute text-[10px] font-bold text-white pt-0.5">
            {level}
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Nível {level}</span>
            <span>
              {Math.floor(currentXP)} / {nextLevelXP} XP
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, currentLevelProgress))}
            className="h-2"
          />
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
        <Flame
          className={cn(
            "w-5 h-5 text-orange-500",
            streak > 0 && "fill-orange-500 animate-pulse"
          )}
        />
        <span className="font-bold text-orange-700 dark:text-orange-400">
          {streak} dias
        </span>
      </div>
    </div>
  );
}
