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
import { useState, useEffect, useMemo } from "react";
import { FullUserDetails } from "@/types/users/user-details";
import { User } from "@/types/users/users";
import { ClassTemplateDay } from "@/types/classes/class";
import { AvailabilitySlot } from "@/types/time/availability";
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
import { ButtonGroup } from "../ui/button-group";
import { Header } from "../ui/header";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("UserDetails.schedule");
  const [schedule, setSchedule] = useState<ClassTemplateDay[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<ClassTemplateDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = useMemo(() => {
    const enc = (arr: ClassTemplateDay[]) =>
      arr
        .map((e) => `${e.day}|${e.hour}|${e.teacherId}|${e.language}`)
        .sort()
        .join(";");
    return enc(schedule) !== enc(savedSchedule);
  }, [schedule, savedSchedule]);

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
          const loaded = (data.days || []) as ClassTemplateDay[];
          setSchedule(loaded);
          setSavedSchedule(loaded.map((e: ClassTemplateDay) => ({ ...e })));
        }
      } catch (error) {
        toast.error(t("errors.loadSchedule"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [user.id, user.contractStartDate, user.contractLengthMonths, t]);

  // Validação de pré-requisito
  if (!user.contractStartDate || !user.contractLengthMonths) {
    return (
      <Card className="p-6 text-center">
        <Text variant="subtitle" dangerouslySetInnerHTML={{ __html: t.raw("missingContractInfo") }} />
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
        toast.error(t("errors.loadTeacherSchedule"));
      }
    } catch (error) {
      toast.error(t("errors.fetchSlots"));
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
        toast.success(t("success.assigned"));

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
        toast.error(t("errors.assignWithMsg", { error: error.error }));
      }
    } catch (error) {
      toast.error(t("errors.assign"));
    } finally {
      setIsSaving(false);
    }
  };

  const getTeacherName = (teacherId: string) => {
    return (
      allTeachers.find((t) => t.id === teacherId)?.name ||
      t("teacherNotFound")
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
        toast.success(t("success.saved"));
        setSavedSchedule(schedule.map((e) => ({ ...e })));
      } else {
        throw new Error(t("errors.save"));
      }
    } catch (error) {
      toast.error(t("errors.saveGeneric"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndoChanges = () => {
    setSchedule(savedSchedule.map((e) => ({ ...e })));
    setShowScheduleSelection(false);
    setSelectedTeacherId("");
    setSelectedLanguage("");
    setAvailableSlots([]);
    toast.info(
      t("info.undo")
    );
  };

  const handleGenerateClasses = async () => {
    if (
      !confirm(
        t("confirmGenerate")
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
      toast.error(t("errors.generate", { error: error.message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEntry = (idToRemove: string) => {
    setSchedule((currentSchedule) =>
      currentSchedule.filter((entry) => entry.id !== idToRemove)
    );
    toast.info(t("success.removed"));
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
      toast.error(t("errors.delete", { error: error.message }));
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
            <ModalTitle>{t("deleteModal.title")}</ModalTitle>
            <ModalDescription>
              {t("deleteModal.description")}
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
                <Text weight="medium">{t("deleteModal.all")}</Text>
                <Text variant="subtitle" className="block">
                  {t("deleteModal.allDesc")}
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
                <Text weight="medium">{t("deleteModal.fromDate")}</Text>
                <Text variant="subtitle" className="block">
                  {t("deleteModal.fromDateDesc")}
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
                <Text weight="medium">{t("deleteModal.range")}</Text>
                <Text variant="subtitle" className="block">
                  {t("deleteModal.rangeDesc")}
                </Text>
              </label>
            </div>

            {(deleteOption === "from-date" ||
              deleteOption === "date-range") && (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("deleteModal.startDate")}
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
                      {t("deleteModal.endDate")}
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
                    {t("deleteModal.templates")}
                  </label>
                  <Text variant="subtitle" className="text-xs mb-2">
                    {t("deleteModal.templatesDesc")}
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
                {t("deleteModal.cancel")}
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
              {t("deleteModal.confirm")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {!showScheduleSelection ? (
              <>
                {/* --- SELEÇÃO DE PROFESSOR E IDIOMA --- */}
                <div className="p-4 border border-surface-2 rounded-lg space-y-4">
                  <Text weight="semibold" variant="subtitle">
                    {t("addNew")}
                  </Text>
                  <Text variant="paragraph">
                    {t("selectInstructions")}
                  </Text>

                  <ButtonGroup>
                    <Select
                      value={selectedTeacherId}
                      onValueChange={setSelectedTeacherId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("teacherPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeachers.map((teacher, index) => {
                          const teacherValue =
                            teacher.id && teacher.id.trim() !== ""
                              ? teacher.id
                              : `teacher-${index}`;

                          return (
                            <SelectItem key={teacherValue} value={teacherValue}>
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
                        <SelectValue placeholder={t("languagePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {t(`languages.${lang}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </ButtonGroup>

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
                    {t("checkAvailability")}
                  </Button>
                </div>

                {/* --- LISTA DE HORÁRIOS ATUAIS --- */}
                <div className="space-y-3">
                  <Text weight="semibold">{t("currentSchedule")}</Text>
                  {schedule.length === 0 ? (
                    <Text variant="placeholder" className="text-center py-4">
                      {t("noSchedule")}
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
                          <Text>{entry.hour}</Text>
                          <Text className="capitalize">
                            {getTeacherName(entry.teacherId)}
                          </Text>
                          <Text>{entry.language}</Text>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveEntry(entry.id)}
                          >
                            <Trash className="h-4 w-4" />
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
                        {t("availableSlotsTitle", {
                          teacher: getTeacherName(selectedTeacherId),
                        })}
                      </Text>
                      <Text variant="subtitle">
                        {t("languageLabel", { language: selectedLanguage })}
                      </Text>
                    </div>
                  </div>

                  {availableSlots.length === 0 ? (
                    <Text variant="placeholder" className="text-center py-8">
                      {t("noSlotsFound")}
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
                              {t("select")}
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
          <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-6 border-t border-surface-2">
            <ButtonGroup>
              <Button
                onClick={handleDeleteSchedule}
                disabled={isSaving || isLoading}
              >
                <Trash className="mr-2" />
                {t("delete")}
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerateClasses}
                disabled={isSaving || isLoading}
              >
                {t("generateClasses")}
              </Button>
            </ButtonGroup>
            <div>
              <ButtonGroup>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <Calendar className="mr-2" />
                  )}
                  {t("save")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={isSaving || isLoading || !hasChanges}
                  onClick={handleUndoChanges}
                >
                  {t("undo")}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
