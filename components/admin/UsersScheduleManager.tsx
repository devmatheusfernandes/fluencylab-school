"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { useState, useEffect } from "react";
import { FullUserDetails } from "@/types/users/user-details";
import { User } from "@/types/users/users";
import { ClassTemplateDay } from "@/types/classes/class";
import { AvailabilitySlot } from "@/types/time/availability";
import { daysOfWeek } from "@/types/time/times";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Text } from "../ui/text";
import { Spinner } from "../ui/spinner";
import { ArrowLeft, Book, Calendar, Trash } from "lucide-react";

interface UserScheduleManagerProps {
  user: FullUserDetails;
  allTeachers: User[];
}

const initialNewEntryState = {
  day: "",
  hour: "",
  teacherId: "",
  language: "",
  id: "",
};

const languageOptions = ["Inglês", "Espanhol", "Libras", "Português"];

// Novo tipo para representar horários únicos do professor
type UniqueScheduleSlot = {
  day: string;
  startTime: string;
  slotId: string;
  teacherId: string;
  language?: string;
};

// Tipo para a resposta da API de disponibilidade do professor
type TeacherAvailabilitySlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  title: string;
  originalSlot: AvailabilitySlot;
};

export default function UserScheduleManager({
  user,
  allTeachers,
}: UserScheduleManagerProps) {
  const [schedule, setSchedule] = useState<ClassTemplateDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Novos estados para o fluxo de seleção
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<UniqueScheduleSlot[]>(
    []
  );
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showScheduleSelection, setShowScheduleSelection] = useState(false);

  // Estados para modal de exclusão (mantidos do código original)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<
    "all" | "date-range" | "from-date"
  >("all");
  const [deleteFromDate, setDeleteFromDate] = useState("");
  const [deleteToDate, setDeleteToDate] = useState("");
  const [selectedTemplateEntries, setSelectedTemplateEntries] = useState<
    ClassTemplateDay[]
  >([]);

  // Efeito para buscar o horário do aluno
  useEffect(() => {
    // Only fetch if user has contract details
    if (!user.contractStartDate || !user.contractLengthMonths) {
      setIsLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/class-templates/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSchedule(data.days || []);
        }
      } catch (error) {
        toast.error("Erro ao carregar o horário do aluno.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [user.id, user.contractStartDate, user.contractLengthMonths]);

  // Validação de pré-requisito
  if (!user.contractStartDate || !user.contractLengthMonths) {
    return (
      <Card className="p-6 text-center">
        <Text variant="subtitle">
          Por favor, defina a <b>Data de Início</b> e a{" "}
          <b>Duração do Contrato</b> na aba Visão Geral antes de configurar o
          horário.
        </Text>
      </Card>
    );
  }



  // Função para buscar horários disponíveis do professor
  const fetchTeacherAvailability = async () => {
    if (!selectedTeacherId || !selectedLanguage) return;

    setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/admin/teacher-availability/${selectedTeacherId}`
      );
      if (response.ok) {
        const data = await response.json();

        // Agrupa os slots únicos por dia e horário
        const uniqueSlots: UniqueScheduleSlot[] = [];
        const seenSlots = new Set<string>();

        data.slots.forEach((slot: TeacherAvailabilitySlot) => {
          const key = `${slot.day}-${slot.startTime}`;
          if (!seenSlots.has(key)) {
            seenSlots.add(key);
            uniqueSlots.push({
              day: slot.day,
              startTime: slot.startTime,
              slotId: slot.id,
              teacherId: selectedTeacherId,
              language: selectedLanguage,
            });
          }
        });

        setAvailableSlots(uniqueSlots);
        setShowScheduleSelection(true);
      } else {
        toast.error("Erro ao carregar horários do professor.");
      }
    } catch (error) {
      toast.error("Erro ao buscar horários disponíveis.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Função para selecionar um horário e atribuir ao aluno
  const handleSelectSchedule = async (slot: UniqueScheduleSlot) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/assign-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          teacherId: slot.teacherId,
          slotId: slot.slotId,
          language: slot.language,
          day: slot.day,
          startTime: slot.startTime,
        }),
      });

      if (response.ok) {
        toast.success("Horário atribuído com sucesso!");

        // Atualiza a lista de horários do aluno
        const newEntry: ClassTemplateDay = {
          id: `temp-${Date.now()}`,
          day: slot.day,
          hour: slot.startTime,
          teacherId: slot.teacherId,
          language: slot.language!,
        };

        setSchedule((prev) => [...prev, newEntry]);

        // Remove o slot da lista de disponíveis
        setAvailableSlots((prev) =>
          prev.filter((s) => s.slotId !== slot.slotId)
        );

        // Volta para a tela inicial
        setShowScheduleSelection(false);
        setSelectedTeacherId("");
        setSelectedLanguage("");
      } else {
        const error = await response.json();
        toast.error(`Erro ao atribuir horário: ${error.error}`);
      }
    } catch (error) {
      toast.error("Erro ao atribuir horário.");
    } finally {
      setIsSaving(false);
    }
  };

  const getTeacherName = (teacherId: string) => {
    return (
      allTeachers.find((t) => t.id === teacherId)?.name ||
      "Professor não encontrado"
    );
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/class-templates/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: schedule }),
      });
      if (response.ok) {
        toast.success("Horário salvo com sucesso!");
      } else {
        throw new Error("Falha ao salvar o horário.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar o horário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateClasses = async () => {
    if (
      !confirm(
        "Tem certeza que deseja gerar todas as aulas para este aluno? Esta ação criará o cronograma para todo o período do contrato."
      )
    )
      return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/classes/generate-classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(`Erro ao gerar aulas: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEntry = (idToRemove: string) => {
    setSchedule((currentSchedule) =>
      currentSchedule.filter((entry) => entry.id !== idToRemove)
    );
    toast.info("Horário removido da lista. Clique em 'Salvar' para confirmar.");
  };

  const handleDeleteSchedule = async () => {
    setIsDeleteModalOpen(true);
  };

  const executeDeleteSchedule = async () => {
    setIsSaving(true);
    setIsDeleteModalOpen(false);

    try {
      let response;

      // Determine which deletion API to call based on selected option
      if (deleteOption === "all") {
        response = await fetch(`/api/class-templates/${user.id}`, {
          method: "DELETE",
        });
      } else {
        // For date-based deletions, we need to call a different API
        response = await fetch(
          `/api/class-templates/${user.id}/delete-classes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              option: deleteOption,
              fromDate: deleteFromDate,
              toDate: deleteOption === "date-range" ? deleteToDate : undefined,
              templateEntries:
                selectedTemplateEntries.length > 0
                  ? selectedTemplateEntries
                  : undefined,
            }),
          }
        );
      }

      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        if (deleteOption === "all") {
          setSchedule([]); // Limpa o horário na tela only if deleting everything
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(`Erro ao deletar horário: ${error.message}`);
    } finally {
      setIsSaving(false);
      // Reset delete options
      setDeleteOption("all");
      setDeleteFromDate("");
      setDeleteToDate("");
      setSelectedTemplateEntries([]);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    // Reset delete options
    setDeleteOption("all");
    setDeleteFromDate("");
    setDeleteToDate("");
    setSelectedTemplateEntries([]);
  };

  // Função para voltar à seleção de professor/idioma
  const handleBackToSelection = () => {
    setShowScheduleSelection(false);
    setAvailableSlots([]);
  };

  return (
    <Card>
      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Opções de Exclusão de Aulas</ModalTitle>
            <ModalDescription>
              Escolha como deseja excluir as aulas do aluno. O histórico não
              será afetado.
            </ModalDescription>
          </ModalHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="delete-all"
                name="delete-option"
                checked={deleteOption === "all"}
                onChange={() => setDeleteOption("all")}
                className="mr-2"
              />
              <label htmlFor="delete-all">
                <Text weight="medium">Excluir tudo</Text>
                <Text variant="subtitle" className="block">
                  Remove o template e todas as aulas futuras
                </Text>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="delete-from-date"
                name="delete-option"
                checked={deleteOption === "from-date"}
                onChange={() => setDeleteOption("from-date")}
                className="mr-2"
              />
              <label htmlFor="delete-from-date">
                <Text weight="medium">Excluir a partir de uma data</Text>
                <Text variant="subtitle" className="block">
                  Remove aulas futuras a partir de uma data específica
                </Text>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="delete-date-range"
                name="delete-option"
                checked={deleteOption === "date-range"}
                onChange={() => setDeleteOption("date-range")}
                className="mr-2"
              />
              <label htmlFor="delete-date-range">
                <Text weight="medium">Excluir em um período</Text>
                <Text variant="subtitle" className="block">
                  Remove aulas futuras dentro de um intervalo de datas
                </Text>
              </label>
            </div>

            {(deleteOption === "from-date" ||
              deleteOption === "date-range") && (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data inicial
                  </label>
                  <Input
                    type="date"
                    value={deleteFromDate}
                    onChange={(e) => setDeleteFromDate(e.target.value)}
                  />
                </div>

                {deleteOption === "date-range" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Data final
                    </label>
                    <Input
                      type="date"
                      value={deleteToDate}
                      onChange={(e) => setDeleteToDate(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Templates (opcional):
                  </label>
                  <Text variant="subtitle" className="text-xs mb-2">
                    Se nenhum for selecionado, todas as aulas serão excluídas
                  </Text>
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {schedule.map((entry) => (
                      <div key={entry.id} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`template-${entry.id}`}
                          checked={selectedTemplateEntries.some(
                            (e) => e.id === entry.id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTemplateEntries((prev) => [
                                ...prev,
                                entry,
                              ]);
                            } else {
                              setSelectedTemplateEntries((prev) =>
                                prev.filter((e) => e.id !== entry.id)
                              );
                            }
                          }}
                          className="mr-2"
                        />
                        <label
                          htmlFor={`template-${entry.id}`}
                          className="text-sm"
                        >
                          {entry.day} {entry.hour} -{" "}
                          {getTeacherName(entry.teacherId)} ({entry.language})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary" onClick={handleCancelDelete}>
                Cancelar
              </Button>
            </ModalClose>
            <Button
              onClick={executeDeleteSchedule}
              disabled={
                (deleteOption === "from-date" && !deleteFromDate) ||
                (deleteOption === "date-range" &&
                  (!deleteFromDate || !deleteToDate))
              }
            >
              Confirmar Exclusão
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* <Header
        heading="Gestão de Horário Fixo"
        icon={
          <Calendar weight="BoldDuotone" className="w-8 h-8 text-primary" />
        }
      /> */}
      <div className="p-6 space-y-6">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {!showScheduleSelection ? (
              <>
                {/* --- SELEÇÃO DE PROFESSOR E IDIOMA --- */}
                <div className="p-4 border border-surface-2 rounded-lg space-y-4">
                  <Text weight="semibold">Adicionar Novo Horário</Text>
                  <Text variant="subtitle">
                    Primeiro, selecione o professor e o idioma para ver os
                    horários disponíveis.
                  </Text>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      value={selectedTeacherId}
                      onValueChange={setSelectedTeacherId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeachers.map((teacher, index) => {
                          const teacherValue =
                            teacher.id && teacher.id.trim() !== ""
                              ? teacher.id
                              : `teacher-${index}`;

                          return (
                            <SelectItem
                              key={teacherValue}
                              value={teacherValue}
                            >
                              {teacher.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={fetchTeacherAvailability}
                    disabled={
                      !selectedTeacherId || !selectedLanguage || isLoadingSlots
                    }
                    className="w-full"
                  >
                    {isLoadingSlots ? (
                      <Spinner className="mr-2" />
                    ) : (
                      <Calendar className="mr-2" />
                    )}
                    Ver Horários Disponíveis
                  </Button>
                </div>

                {/* --- LISTA DE HORÁRIOS ATUAIS --- */}
                <div className="space-y-3">
                  <Text weight="semibold">Horário Semanal Atual</Text>
                  {schedule.length === 0 ? (
                    <Text variant="placeholder" className="text-center py-4">
                      Nenhum horário definido.
                    </Text>
                  ) : (
                    schedule.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-surface-1 rounded-md border border-surface-2"
                      >
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <Text weight="medium" className="min-w-[80px]">
                            {entry.day}
                          </Text>
                          <Text variant="subtitle">{entry.hour}</Text>
                          <Text variant="subtitle">
                            {getTeacherName(entry.teacherId)}
                          </Text>
                          <Text variant="subtitle">({entry.language})</Text>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* --- SELEÇÃO DE HORÁRIOS DISPONÍVEIS --- */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToSelection}
                    >
                      <ArrowLeft />
                    </Button>
                    <div>
                      <Text weight="semibold">
                        Horários Disponíveis -{" "}
                        {getTeacherName(selectedTeacherId)}
                      </Text>
                      <Text variant="subtitle">Idioma: {selectedLanguage}</Text>
                    </div>
                  </div>

                  {availableSlots.length === 0 ? (
                    <Text variant="placeholder" className="text-center py-8">
                      Nenhum horário disponível para este professor e idioma.
                    </Text>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableSlots.map((slot) => (
                        <Card
                          key={`${slot.day}-${slot.startTime}`}
                          className="p-4 hover:bg-surface-1 cursor-pointer transition-colors"
                          onClick={() => handleSelectSchedule(slot)}
                        >
                          <div className="text-center space-y-2">
                            <Text weight="medium">{slot.day}</Text>
                            <Text variant="subtitle" className="text-lg">
                              {slot.startTime}
                            </Text>
                            <Button size="sm" className="w-full">
                              Selecionar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* --- BOTÕES DE AÇÃO PRINCIPAIS --- */}
        {!showScheduleSelection && (
          <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-surface-2">
            <Button
              onClick={handleDeleteSchedule}
              disabled={isSaving || isLoading}
            >
              <Trash className="mr-2" />
              Excluir Aulas
            </Button>

            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={handleGenerateClasses}
                disabled={isSaving || isLoading}
              >
                <Book className="mr-2" />
                Gerar Aulas
              </Button>

              <Button
                onClick={handleSaveSchedule}
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Calendar className="mr-2" />
                )}
                Salvar Horário
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
