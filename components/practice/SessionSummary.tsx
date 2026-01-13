import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, ArrowRight, RotateCw } from "lucide-react";
import { ContributionHeatmap } from "./ContributionHeatmap";

interface SessionSummaryProps {
  stats: {
    correct: number;
    incorrect: number;
    xpEarned: number;
  };
  heatmapData: Record<string, number>;
  onRestart: () => void;
  onExit: () => void;
}

export function SessionSummary({ stats, heatmapData, onRestart, onExit }: SessionSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 animate-in fade-in zoom-in-95 duration-500 w-full">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
          <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Sessão Concluída!</h2>
        <p className="text-muted-foreground">Você mandou bem hoje!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <Card className="p-4 flex flex-col items-center justify-center gap-1 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.correct}</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Acertos</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-1 border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <span className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.incorrect}</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Erros</span>
        </Card>
        <Card className="col-span-2 p-4 flex flex-col items-center justify-center gap-1 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">+{stats.xpEarned} XP</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Experiência Ganha</span>
        </Card>
      </div>

      <div className="w-full max-w-md p-4 bg-muted/30 rounded-lg flex justify-center">
        <ContributionHeatmap data={heatmapData} />
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRestart}>
          <RotateCw className="w-4 h-4 mr-1" />
          Revisar Novamente
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={onExit}>
          <ArrowRight className="w-4 h-4 mr-1" />
          Sair
        </Button>
      </div>
    </div>
  );
}
