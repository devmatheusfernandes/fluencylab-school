"use client";

import { Vacation } from "@/types/time/vacation";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { useState } from "react";
import { Text } from "../ui/text";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";

interface TeacherVacationListProps {
  vacations: Vacation[];
  onDelete: () => void; // Função para recarregar a lista após a exclusão
}

export default function TeacherVacationList({
  vacations,
  onDelete,
}: TeacherVacationListProps) {
  const t = useTranslations("TeacherSchedule.Vacation.List");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vacationToDelete, setVacationToDelete] = useState<string | null>(null);

  const openDeleteModal = (vacationId: string) => {
    setVacationToDelete(vacationId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setVacationToDelete(null);
  };

  const handleDelete = async () => {
    if (!vacationToDelete) return;

    try {
      const response = await fetch(`/api/vacations?id=${vacationToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao cancelar período de férias");
      }

      toast.success(t("toasts.success"));
      onDelete(); // Recarrega a lista
      closeDeleteModal();
    } catch (error: any) {
      console.error("Erro ao cancelar período de férias:", error);
      toast.error(t("toasts.error", { error: error.message }));
    }
  };

  if (vacations.length === 0) {
    return <Text>{t("empty")}</Text>;
  }

  return (
    <>
      <div className="space-y-4">
        <Text weight="semibold">{t("title")}</Text>
        {vacations.map((vac) => (
          <Card
            key={vac.id}
            className="p-4 flex justify-between items-center bg-surface-1"
          >
            <div>
              <Text>
                <span className="font-medium">{t("from")}</span>{" "}
                {new Date(vac.startDate).toLocaleDateString("pt-BR")}
              </Text>
              <Text>
                <span className="font-medium">{t("to")}</span>{" "}
                {new Date(vac.endDate).toLocaleDateString("pt-BR")}
              </Text>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => openDeleteModal(vac.id!)}
            >
              <Trash />
            </Button>
          </Card>
        ))}
      </div>

      <Modal open={isModalOpen} onOpenChange={closeDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("deleteModal.title")}</ModalTitle>
            <ModalDescription>
              {t("deleteModal.description")}
            </ModalDescription>
            <ModalClose />
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={closeDeleteModal}>
              {t("deleteModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleDelete}>
              {t("deleteModal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
