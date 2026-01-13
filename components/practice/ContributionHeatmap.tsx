import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionHeatmapProps {
  data: Record<string, number>; // "YYYY-MM-DD": count
}

export function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  // Generate last 28 days (4 weeks) for grid
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i));
    return d;
  });

  const getIntensity = (count: number) => {
    if (!count) return "bg-muted";
    if (count < 5) return "bg-green-200 dark:bg-green-900";
    if (count < 10) return "bg-green-400 dark:bg-green-700";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">Atividade (30 dias)</h3>
      <div className="grid grid-cols-7 gap-1 w-fit">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const count = data[dateStr] || 0;
          return (
            <Tooltip key={dateStr}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-4 h-4 rounded-sm transition-colors cursor-help", 
                    getIntensity(count)
                  )} 
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{date.toLocaleDateString()}: {count} estudos</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
