import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StudentInfodivProps {
  isMobile: boolean;
  student: any;
}

export default function StudentInfodiv({
  isMobile
}: StudentInfodivProps) {
  return (
    <div className="flex flex-row w-full justify-between gap-2 h-32">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/placement.png" 
              alt="Nivelamento" 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Nivelamento</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/report.png" 
              alt="Relatório" 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Relatório</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/badges.png" 
              alt="Badges" 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Badges</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
