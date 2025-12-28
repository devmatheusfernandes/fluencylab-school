import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface StudentInfodivProps {
  isMobile: boolean;
  student: any;
}

export default function StudentInfodiv({
  isMobile
}: StudentInfodivProps) {
  const t = useTranslations("StudentInfoCard");

  return (
    <div className="flex flex-row w-full justify-between gap-2 h-32">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/placement.png" 
              alt={t("placement")} 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("placement")}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/report.png" 
              alt={t("report")} 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("report")}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="subcontainer-base flex items-center justify-center w-full h-full rounded-xl relative cursor-pointer overflow-hidden">
            <Image 
              src="/images/icons/badges.png" 
              alt={t("badges")} 
              fill
              className="object-contain p-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("badges")}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
