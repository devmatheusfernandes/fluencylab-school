"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Trash,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils"; 

interface UserScheduleManagerProps {
  user: FullUserDetails;
  allTeachers: User[];
}

const languageOptions = ["Inglês", "Espanhol", "Libras", "Português"];

type UniqueScheduleSlot = {
  day: string;
  startTime: string;
  slotId: string;
  teacherId: string;
  language?: string;
};

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

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<UniqueScheduleSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showScheduleSelection, setShowScheduleSelection] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Estados para modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"all" | "date-range" | "from-date">("all");
  const [deleteFromDate, setDeleteFromDate] = useState("");
  const [deleteToDate, setDeleteToDate] = useState("");
  const [selectedTemplateEntries, setSelectedTemplateEntries] = useState<ClassTemplateDay[]>([]);

  // ... (Manteve-se todos os useEffects e lógicas de fetch/save idênticos) ...
  // Apenas replicando a lógica para contexto, o foco é o return do JSX abaixo.

  useEffect(() => {
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

  if (!user.contractStartDate || !user.contractLengthMonths) {
    return (
      <Card className="p-6 text-center border-dashed">
        <div className="flex justify-center mb-4 text-muted-foreground">
          <AlertCircle className="w-10 h-10" />
        </div>
        <Text variant="subtitle" dangerouslySetInnerHTML={{ __html: t.raw("missingContractInfo") }} />
      </Card>
    );
  }

  const fetchTeacherAvailability = async () => {
    if (!selectedTeacherId || !selectedLanguage) return;
    setIsLoadingSlots(true);
    try {
      const response = await fetch(`/api/admin/teacher-availability/${selectedTeacherId}`);
      if (response.ok) {
        const data = await response.json();
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
        const newEntry: ClassTemplateDay = {
          id: `temp-${Date.now()}`,
          day: slot.day,
          hour: slot.startTime,
          teacherId: slot.teacherId,
          language: slot.language!,
        };
        setSchedule((prev) => [...prev, newEntry]);
        setAvailableSlots((prev) => prev.filter((s) => s.slotId !== slot.slotId));
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
    return allTeachers.find((t) => t.id === teacherId)?.name || t("teacherNotFound");
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
    toast.info(t("info.undo"));
  };

  const handleGenerateClasses = () => setIsGenerateModalOpen(true);

  const executeGenerateClasses = async () => {
    setIsGenerateModalOpen(false);
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
    setSchedule((currentSchedule) => currentSchedule.filter((entry) => entry.id !== idToRemove));
    toast.info(t("success.removed"));
  };

  const handleDeleteSchedule = async () => setIsDeleteModalOpen(true);

  const executeDeleteSchedule = async () => {
    setIsSaving(true);
    setIsDeleteModalOpen(false);
    try {
      let response;
      if (deleteOption === "all") {
        response = await fetch(`/api/class-templates/${user.id}`, { method: "DELETE" });
      } else {
        response = await fetch(`/api/class-templates/${user.id}/delete-classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            option: deleteOption,
            fromDate: deleteFromDate,
            toDate: deleteOption === "date-range" ? deleteToDate : undefined,
            templateEntries: selectedTemplateEntries.length > 0 ? selectedTemplateEntries : undefined,
          }),
        });
      }
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        if (deleteOption === "all") setSchedule([]);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(t("errors.delete", { error: error.message }));
    } finally {
      setIsSaving(false);
      setDeleteOption("all");
      setDeleteFromDate("");
      setDeleteToDate("");
      setSelectedTemplateEntries([]);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteOption("all");
    setDeleteFromDate("");
    setDeleteToDate("");
    setSelectedTemplateEntries([]);
  };

  const handleBackToSelection = () => {
    setShowScheduleSelection(false);
    setAvailableSlots([]);
  };

  return (
    <Card className="overflow-hidden">
      <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent className="max-w-[90vw] sm:max-w-lg">
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>{t("deleteModal.title")}</ModalTitle>
            <ModalDescription>{t("deleteModal.description")}</ModalDescription>
          </ModalHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
             {/* Opções de rádio melhoradas para toque */}
            <div className="space-y-3">
              {[
                { id: "all", label: t("deleteModal.all"), desc: t("deleteModal.allDesc") },
                { id: "from-date", label: t("deleteModal.fromDate"), desc: t("deleteModal.fromDateDesc") },
                { id: "date-range", label: t("deleteModal.range"), desc: t("deleteModal.rangeDesc") }
              ].map((opt) => (
                <label key={opt.id} className={cn(
                  "flex items-start p-3 border rounded-lg cursor-pointer transition-colors hover:bg-surface-1",
                  deleteOption === opt.id ? "border-primary bg-primary/5" : "border-border"
                )}>
                  <input
                    type="radio"
                    name="delete-option"
                    checked={deleteOption === opt.id}
                    onChange={() => setDeleteOption(opt.id as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <Text weight="medium" className="block">{opt.label}</Text>
                    <Text   className="text-muted-foreground">{opt.desc}</Text>
                  </div>
                </label>
              ))}
            </div>

            {(deleteOption === "from-date" || deleteOption === "date-range") && (
              <div className="space-y-4 p-4 bg-surface-1 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
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
                     <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                       {t("deleteModal.endDate")}
                     </label>
                     <Input
                       type="date"
                       value={deleteToDate}
                       onChange={(e) => setDeleteToDate(e.target.value)}
                     />
                   </div>
                  )}
                </div>
                
                {/* Lista de templates com checkbox */}
                <div>
                   <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                      {t("deleteModal.templates")}
                   </label>
                   <div className="max-h-32 overflow-y-auto border rounded bg-background p-2 space-y-1">
                      {schedule.map((entry) => (
                        <label key={entry.id} className="flex items-center p-2 hover:bg-surface-1 rounded cursor-pointer">
                           <input
                              type="checkbox"
                              checked={selectedTemplateEntries.some((e) => e.id === entry.id)}
                              onChange={(e) => {
                                 if (e.target.checked) setSelectedTemplateEntries((prev) => [...prev, entry]);
                                 else setSelectedTemplateEntries((prev) => prev.filter((el) => el.id !== entry.id));
                              }}
                              className="mr-3 h-4 w-4"
                           />
                           <span className="text-sm">
                              {entry.day} • {entry.hour} • {getTeacherName(entry.teacherId)}
                           </span>
                        </label>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>

          <ModalFooter className="flex-col sm:flex-row gap-2">
            <ModalSecondaryButton onClick={handleCancelDelete} className="w-full sm:w-auto">
              {t("deleteModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={executeDeleteSchedule}
              className="w-full sm:w-auto"
              disabled={
                (deleteOption === "from-date" && !deleteFromDate) ||
                (deleteOption === "date-range" && (!deleteFromDate || !deleteToDate))
              }
            >
              {t("deleteModal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <ModalContent className="max-w-[90vw] sm:max-w-md">
          <ModalIcon type="calendar" />
          <ModalHeader>
            <ModalTitle>{t("generateClasses")}</ModalTitle>
            <ModalDescription>{t("confirmGenerate")}</ModalDescription>
          </ModalHeader>
          <ModalFooter className="flex-col sm:flex-row gap-2">
            <ModalSecondaryButton onClick={() => setIsGenerateModalOpen(false)} className="w-full sm:w-auto">
              {t("deleteModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={executeGenerateClasses} className="w-full sm:w-auto">
              {t("confirmGenerateClasses")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
             <Spinner />
          </div>
        ) : (
          <>
            {!showScheduleSelection ? (
              <>
                {/* --- SELEÇÃO DE PROFESSOR E IDIOMA --- */}
                <div className="bg-surface-1/50 p-4 sm:p-5 rounded-xl border space-y-4">
                  <div className="space-y-1">
                     <Text weight="semibold" variant="subtitle">{t("addNew")}</Text>
                     <Text   className="text-muted-foreground">{t("selectInstructions")}</Text>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder={t("teacherPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allTeachers.map((teacher, index) => {
                          const teacherValue = teacher.id && teacher.id.trim() !== "" ? teacher.id : `teacher-${index}`;
                          return (
                            <SelectItem key={teacherValue} value={teacherValue}>
                              {teacher.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full h-11">
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
                  </div>

                  <Button
                    onClick={fetchTeacherAvailability}
                    disabled={!selectedTeacherId || !selectedLanguage || isLoadingSlots}
                    className="w-full h-11 sm:w-auto sm:min-w-[200px]"
                    size="lg"
                  >
                    {isLoadingSlots ? <Spinner className="mr-2" /> : <Calendar className="mr-2 w-4 h-4" />}
                    {t("checkAvailability")}
                  </Button>
                </div>

                {/* --- LISTA DE HORÁRIOS ATUAIS --- */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <Text weight="semibold">{t("currentSchedule")}</Text>
                     <span className="text-xs text-muted-foreground bg-surface-2 px-2 py-1 rounded-full">
                        {schedule.length} {schedule.length === 1 ? 'item' : 'items'}
                     </span>
                  </div>

                  {schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl bg-surface-1/30">
                       <Calendar className="w-10 h-10 text-muted-foreground/50 mb-3" />
                       <Text variant="placeholder">{t("noSchedule")}</Text>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {schedule.map((entry) => (
                        <div
                          key={entry.id}
                          className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 card-base rounded-lg border shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                        >
                          <div className="flex-1 space-y-3 sm:space-y-1">
                            {/* Dia e Hora - Destaque */}
                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                               <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  {entry.day}
                               </div>
                               <div className="text-lg font-semibold flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  {entry.hour}
                               </div>
                            </div>
                            
                            {/* Detalhes Secundários */}
                            <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-muted-foreground pl-1">
                              <div className="flex items-center gap-1.5">
                                 <UserIcon className="w-3.5 h-3.5" />
                                 <span className="truncate max-w-[150px]">{getTeacherName(entry.teacherId)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <Globe className="w-3.5 h-3.5" />
                                 <span>{entry.language}</span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10"
                              onClick={() => handleRemoveEntry(entry.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* --- SELEÇÃO DE HORÁRIOS DISPONÍVEIS --- */
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-4 bg-surface-1 p-4 rounded-lg border">
                   <div className="flex items-start gap-4">
                      <Button variant="outline" size="icon" onClick={handleBackToSelection} className="shrink-0">
                         <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div>
                         <Text weight="semibold" className="text-lg leading-tight">
                            {t("availableSlotsTitle", { teacher: getTeacherName(selectedTeacherId) })}
                         </Text>
                         <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Globe className="w-3 h-3" />
                            <Text  >{t("languageLabel", { language: selectedLanguage })}</Text>
                         </div>
                      </div>
                   </div>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="text-center py-12 bg-surface-1/30 rounded-xl border-dashed border">
                     <Text variant="placeholder">{t("noSlotsFound")}</Text>
                     <Button variant="link" onClick={handleBackToSelection} className="mt-2">
                        {t("goBack")}
                     </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={`${slot.day}-${slot.startTime}`}
                        onClick={() => handleSelectSchedule(slot)}
                        disabled={isSaving}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all active:scale-95 text-center gap-2 group"
                      >
                         <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-primary/80">
                            {slot.day}
                         </span>
                         <span className="text-xl font-bold text-foreground group-hover:text-primary">
                            {slot.startTime}
                         </span>
                         <CheckCircle2 className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* --- BOTÕES DE AÇÃO PRINCIPAIS (Sticky Mobile Friendly) --- */}
        {!showScheduleSelection && (
          <div className="pt-6 border-t mt-8">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
               
               {/* Grupo Secundário (Deletar/Gerar) */}
               <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
                  <Button
                     variant="glass"
                     onClick={handleDeleteSchedule}
                     disabled={isSaving || isLoading || schedule.length === 0}
                  >
                     <Trash className="mr-2 h-4 w-4" />
                     <span className="truncate">{t("delete")}</span>
                  </Button>
                  <Button
                     variant="glass"
                     className="w-full sm:w-auto"
                     onClick={handleGenerateClasses}
                     disabled={isSaving || isLoading || schedule.length === 0}
                  >
                     <Calendar className="mr-2 h-4 w-4" />
                     <span className="truncate">{t("generateClasses")}</span>
                  </Button>
               </div>

               {/* Grupo Primário (Salvar/Desfazer) */}
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {hasChanges && (
                     <Button
                        variant="ghost"
                        className="w-full sm:w-auto text-muted-foreground"
                        disabled={isSaving || isLoading}
                        onClick={handleUndoChanges}
                     >
                        {t("undo")}
                     </Button>
                  )}
                  <Button
                     onClick={handleSaveSchedule}
                     disabled={isSaving || isLoading || !hasChanges}
                     className={cn("w-full sm:w-auto min-w-[140px]", hasChanges && "animate-pulse")}
                  >
                     {isSaving ? <Spinner className="mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                     {t("save")}
                  </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}