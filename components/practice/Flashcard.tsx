import { motion } from "framer-motion";
import { Flashcard as FlashcardType } from "@/types/srs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  data: FlashcardType;
  isFlipped: boolean;
  onFlip: () => void;
  disabled?: boolean;
}

export function Flashcard({ data, isFlipped, onFlip, disabled }: FlashcardProps) {
  return (
    <div 
      className={cn("w-full max-w-2xl h-[400px] cursor-pointer group perspective-[1000px]", disabled && "cursor-default")} 
      onClick={() => !disabled && onFlip()}
    >
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <Card className="absolute w-full h-full [backface-visibility:hidden] flex flex-col items-center justify-center p-8 text-center shadow-xl border-2 hover:border-primary/50 transition-colors">
          <div className="flex-1 flex items-center justify-center text-3xl font-medium">
            {data.front}
          </div>
          <div className="mt-4 text-sm text-muted-foreground font-normal opacity-50">
            Clique ou [Espaço] para virar
          </div>
        </Card>

        {/* Back */}
        <Card 
          className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-8 text-center text-3xl font-medium shadow-xl border-2 bg-muted/10"
          style={{ transform: "rotateY(180deg)" }}
        >
          {data.back}
        </Card>
      </motion.div>
    </div>
  );
}
