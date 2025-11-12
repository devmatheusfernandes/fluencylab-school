import { PopulatedStudentClass, ClassStatus } from "@/types/classes/class";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import Image from "next/image";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: PopulatedStudentClass | null;
  onSlotConverted?: () => void; // Callback para atualizar a lista após conversão
}

export default function ClassDetailsModal({
  isOpen,
  onClose,
  classData,
  onSlotConverted,
}: ClassDetailsModalProps) {
  const [isConverting, setIsConverting] = useState(false);
  if (!classData) return null;

  // Verificar se a aula pode ser convertida em slot livre
  const canConvertToSlot =
    (classData.status === ClassStatus.CANCELED_STUDENT ||
      classData.status === ClassStatus.CANCELED_TEACHER ||
      classData.status === ClassStatus.CANCELED_TEACHER_MAKEUP ||
      classData.status === ClassStatus.CANCELED_CREDIT ||
      classData.status === ClassStatus.RESCHEDULED) &&
    !classData.convertedToAvailableSlot;

  const handleConvertToSlot = async () => {
    if (!classData.id) return;

    setIsConverting(true);
    try {
      const response = await fetch(
        `/api/classes/${classData.id}/convert-to-slot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erro ao converter aula em slot livre"
        );
      }

      toast.success("Aula convertida em slot disponível com sucesso!");
      onSlotConverted?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao converter aula:", error);
      toast.error(error.message || "Erro ao converter aula em slot livre");
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusText = (status: ClassStatus) => {
    switch (status) {
      case ClassStatus.SCHEDULED:
        return "Agendada";
      case ClassStatus.COMPLETED:
        return "Concluída";
      case ClassStatus.CANCELED_STUDENT:
        return "Cancelada pelo aluno";
      case ClassStatus.CANCELED_TEACHER:
        return "Cancelada pelo professor";
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
        return "Cancelada pelo professor (reposição)";
      case ClassStatus.CANCELED_CREDIT:
        return "Cancelada";
      case ClassStatus.NO_SHOW:
        return "Falta";
      case ClassStatus.RESCHEDULED:
        return "Reagendada";
      case ClassStatus.TEACHER_VACATION:
        return "Férias do professor";
      case ClassStatus.OVERDUE:
        return "Vencida";
      default:
        return status;
    }
  };

  const getStatusColor = (status: ClassStatus) => {
    switch (status) {
      case ClassStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      case ClassStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case ClassStatus.CANCELED_STUDENT:
      case ClassStatus.CANCELED_TEACHER:
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
      case ClassStatus.CANCELED_CREDIT:
        return "bg-red-100 text-red-800";
      case ClassStatus.NO_SHOW:
        return "bg-yellow-100 text-yellow-800";
      case ClassStatus.RESCHEDULED:
        return "bg-purple-100 text-purple-800";
      case ClassStatus.TEACHER_VACATION:
        return "bg-indigo-100 text-indigo-800";
      case ClassStatus.OVERDUE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Detalhes da Aula</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Text variant="title" size="lg">
                  {classData.studentName}
                </Text>
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
                    alt={"Imagem do aluno"}
                    className="w-12 h-12 rounded-full object-cover"
                    width={12}
                    height={12}
                  />
                </div>
              )}
            </Card>

            <Card className="p-4">
              <Text variant="title" className="mb-3">
                Informações da Aula
              </Text>

              <div className="space-y-2">
                <div>
                  <Text className="text-subtitle font-medium">Data e Hora</Text>
                  <Text>
                    {format(new Date(classData.scheduledAt), "PPP 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">Duração</Text>
                  <Text>{classData.durationMinutes} minutos</Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">
                    Tipo de Aula
                  </Text>
                  <Text>
                    {classData.classType === "regular" ? "Regular" : "Avulsa"}
                  </Text>
                </div>

                {classData.notes && (
                  <div>
                    <Text className="text-subtitle font-medium">Notas</Text>
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
