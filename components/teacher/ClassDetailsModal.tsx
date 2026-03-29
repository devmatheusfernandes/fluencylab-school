import { PopulatedStudentClass, ClassStatus } from "@/types/classes/class";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import Image from "next/image";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: PopulatedStudentClass | null;
  onSlotConverted?: () => void;
}

export default function ClassDetailsModal({
  isOpen,
  onClose,
  classData,
}: ClassDetailsModalProps) {
  const t = useTranslations("TeacherSchedule.ClassDetails");
  if (!classData) return null;

  const getStatusText = (status: ClassStatus | string) => {
    const s = typeof status === "string" ? status : (status as string);
    switch (s) {
      case "scheduled":
      case ClassStatus.SCHEDULED:
        return "Agendada";
      case "completed":
      case ClassStatus.COMPLETED:
        return "Concluída";
      case "cancelled":
        return "Cancelada";
      case ClassStatus.CANCELED_STUDENT:
        return "Cancelada pelo aluno";
      case ClassStatus.CANCELED_TEACHER:
        return "Cancelada pelo professor";
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
        return "Cancelada pelo professor (reposição)";
      case ClassStatus.CANCELED_CREDIT:
        return "Cancelada";
      case "no_show":
      case ClassStatus.NO_SHOW:
        return "Aluno faltou";
      case ClassStatus.RESCHEDULED:
        return "Reagendada";
      case ClassStatus.TEACHER_VACATION:
        return "Férias do professor";
      case ClassStatus.OVERDUE:
        return "Vencida";
      default:
        return s;
    }
  };

  const getStatusColor = (status: ClassStatus | string) => {
    const s = typeof status === "string" ? status : (status as string);
    switch (s) {
      case "scheduled":
      case ClassStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
      case ClassStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
      case ClassStatus.CANCELED_STUDENT:
      case ClassStatus.CANCELED_TEACHER:
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
      case ClassStatus.CANCELED_CREDIT:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "no_show":
      case ClassStatus.NO_SHOW:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case ClassStatus.RESCHEDULED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case ClassStatus.TEACHER_VACATION:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case ClassStatus.OVERDUE:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-md text-primary">
                  {classData.studentName}
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classData.status)}`}
                >
                  {getStatusText(classData.status)}
                </span>
              </div>

              {classData.studentAvatarUrl && (
                <div className="mt-3">
                  <Image
                    src={classData.studentAvatarUrl}
                    alt={t("studentInfo")}
                    className="w-12 h-12 rounded-full object-cover"
                    width={12}
                    height={12}
                  />
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="font-bold text-md text-primary mb-3">
                {t("classInfo")}
              </p>

              <div className="space-y-2">
                <div>
                  <Text className="text-subtitle font-medium">
                    {t("dateAndTime")}
                  </Text>
                  <Text>
                    {format(new Date(classData.scheduledAt), "PPP 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">
                    {t("duration")}
                  </Text>
                  <Text>
                    {classData.durationMinutes} {t("minutes")}
                  </Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">
                    {t("classType")}
                  </Text>
                  <Text>
                    {classData.classType === "regular"
                      ? t("regular")
                      : t("single")}
                  </Text>
                </div>

                {classData.notes && (
                  <div>
                    <Text className="text-subtitle font-medium">
                      {t("notes")}
                    </Text>
                    <Text>{classData.notes}</Text>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
