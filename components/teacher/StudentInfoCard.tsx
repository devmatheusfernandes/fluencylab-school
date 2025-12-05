import { FlaskConicalIcon, FilePlusIcon, BookmarkIcon, PhoneCallIcon } from "lucide-react";
interface StudentInfodivProps {
  isMobile: boolean;
  student: any;
}

export default function StudentInfodiv({
  isMobile,
  student,
}: StudentInfodivProps) {
  return (
    <div className="flex flex-row w-full justify-between gap-2">
      <div className="subcontainer-base flex flex-col items-center justify-center w-full h-full gap-1 p-4 rounded-xl">
        <FlaskConicalIcon className="w-8 h-8 text-secondary" />
        {!isMobile && <span className="text-secondary font-bold">Nivelamento</span>}
      </div>

      <div className="subcontainer-base flex flex-col items-center justify-center w-full h-full gap-1 p-4 rounded-xl">
        <FilePlusIcon className="w-8 h-8 text-success" />
        {!isMobile && <span className="text-success font-bold">Relatório</span>}
      </div>

      <div className="subcontainer-base flex flex-col items-center justify-center w-full h-full gap-1 p-4 rounded-xl">
        <BookmarkIcon className="w-8 h-8 text-info" />
        {!isMobile && <span className="text-info font-bold">Badges</span>}
      </div>

      <div className="subcontainer-base flex flex-col items-center justify-center w-full h-full gap-1 p-4 rounded-xl">
        <PhoneCallIcon className="w-8 h-8 text-primary" />
        {!isMobile && <span className="text-primary font-bold">Chamada</span>}
      </div>
    </div>
  );
}
