"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lesson, Quiz, QuizQuestion } from "@/types/learning/lesson";
import { updateLessonQuiz } from "@/actions/lessonUpdating";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Pause,
  Square,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";
import { NoResults } from "../ui/no-results";

interface LessonQuizEditorProps {
  lesson: Lesson;
}

export function LessonQuizEditor({ lesson }: LessonQuizEditorProps) {
  const router = useRouter();
  const t = useTranslations("LessonQuizEditor");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sectionIndex: number;
    questionIndex: number;
  } | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingSegment, setPlayingSegment] = useState<{
    sectionIndex: number;
    questionIndex: number;
    end: number;
  } | null>(null);

  const getTimestampFromText = (text: string) => {
    // Regex updated to handle seconds with decimals (e.g. 0:04.15)
    const match = text.match(
      /(\d+):(\d+(?:\.\d+)?)\s*-\s*(\d+):(\d+(?:\.\d+)?)/,
    );
    if (match) {
      const start = parseInt(match[1]) * 60 + parseFloat(match[2]);
      const end = parseInt(match[3]) * 60 + parseFloat(match[4]);
      return { start, end, label: match[0] };
    }
    return null;
  };

  const handlePlaySegment = (
    sectionIndex: number,
    questionIndex: number,
    start: number,
    end: number,
  ) => {
    if (
      playingSegment?.sectionIndex === sectionIndex &&
      playingSegment?.questionIndex === questionIndex
    ) {
      // Stop
      audioRef.current?.pause();
      setPlayingSegment(null);
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.currentTime = start;
        audioRef.current.play();
        setPlayingSegment({ sectionIndex, questionIndex, end });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && playingSegment) {
      if (audioRef.current.currentTime >= playingSegment.end) {
        audioRef.current.pause();
        setPlayingSegment(null);
      }
    }
  };

  // Local state for quiz data
  const [quizData, setQuizData] = useState<Quiz | undefined>(lesson.quiz);
  const [activeTab, setActiveTab] = useState<string>("vocabulary");

  // Initialize active tab on mount
  useEffect(() => {
    if (quizData?.quiz_sections?.[0]?.type) {
      setActiveTab(quizData.quiz_sections[0].type);
    }
  }, []);

  // If no quiz, initialize with default structure
  useEffect(() => {
    if (!lesson.quiz) {
      setQuizData({
        quiz_metadata: {
          title: `Quiz: ${lesson.title}`,
          level: (lesson.level || "B1") as string,
          dateGenerated: new Date().toISOString(),
        },
        quiz_sections: [],
      });
    }
  }, [lesson.quiz, lesson.title, lesson.level]);

  const handleSave = async () => {
    if (!quizData) return;

    try {
      setIsSaving(true);
      const result = await updateLessonQuiz(lesson.id, quizData);

      if (result.success) {
        toast.success(t("toastSuccess"));
        router.refresh();
      } else {
        toast.error(t("toastError"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toastUnknownError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    field: keyof QuizQuestion | "options",
    value: any,
    optionIndex?: number,
  ) => {
    setQuizData((prev) => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = [...newSections[sectionIndex].questions];
      const question = { ...newQuestions[questionIndex] };

      if (field === "options" && typeof optionIndex === "number") {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        question.options = newOptions;
      } else {
        (question as any)[field] = value;
      }

      newQuestions[questionIndex] = question;
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        questions: newQuestions,
      };
      return { ...prev, quiz_sections: newSections };
    });
  };

  const handleAddQuestion = (sectionIndex: number) => {
    setQuizData((prev) => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = [...newSections[sectionIndex].questions];

      newQuestions.push({
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      });

      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        questions: newQuestions,
      };
      return { ...prev, quiz_sections: newSections };
    });
  };

  const handleRemoveQuestion = (
    sectionIndex: number,
    questionIndex: number,
  ) => {
    setDeleteConfirmation({ isOpen: true, sectionIndex, questionIndex });
  };

  const confirmDeleteQuestion = () => {
    if (!deleteConfirmation) return;
    const { sectionIndex, questionIndex } = deleteConfirmation;

    setQuizData((prev) => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = newSections[sectionIndex].questions.filter(
        (_, i) => i !== questionIndex,
      );
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        questions: newQuestions,
      };
      return { ...prev, quiz_sections: newSections };
    });

    setDeleteConfirmation(null);
  };

  if (!quizData?.quiz_sections?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <NoResults customMessage={{ withoutSearch: t("emptyState") }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {t("saveButton")}
      </Button>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto justify-start h-auto p-1 mb-4 no-scrollbar">
          {quizData.quiz_sections.map((section) => (
            <TabsTrigger
              key={section.type}
              value={section.type}
              className="capitalize whitespace-nowrap"
            >
              {section.type}
              <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                {section.questions.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {quizData.quiz_sections.map((section, sectionIndex) => (
          <TabsContent key={section.type} value={section.type} className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  {t("sectionTitle", { type: section.type })}
                </CardTitle>
                <CardDescription>{t("sectionDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 mt-4">
                  <Accordion type="multiple" className="w-full space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <AccordionItem
                        key={questionIndex}
                        value={`item-${questionIndex}`}
                        className="border rounded-lg px-4 bg-card"
                      >
                        <div className="flex items-center gap-2 py-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          <AccordionTrigger className="hover:no-underline flex-1 py-2">
                            <span className="text-left font-medium line-clamp-1 mr-4">
                              {t("questionLabel", {
                                index: questionIndex + 1,
                                text: question.text || t("newQuestion"),
                              })}
                            </span>
                          </AccordionTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveQuestion(sectionIndex, questionIndex);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">
                                {t("questionPromptLabel")}
                              </label>
                              {["timestamp", "timestamps"].includes(
                                section.type.toLowerCase(),
                              ) &&
                                lesson.audioUrl &&
                                (() => {
                                  const timestamp = getTimestampFromText(
                                    question.text,
                                  );
                                  if (timestamp) {
                                    const isPlayingThis =
                                      playingSegment?.sectionIndex ===
                                        sectionIndex &&
                                      playingSegment?.questionIndex ===
                                        questionIndex;
                                    return (
                                      <Button
                                        size="sm"
                                        variant={
                                          isPlayingThis
                                            ? "destructive"
                                            : "outline"
                                        }
                                        onClick={() =>
                                          handlePlaySegment(
                                            sectionIndex,
                                            questionIndex,
                                            timestamp.start,
                                            timestamp.end,
                                          )
                                        }
                                        type="button"
                                        className="h-7 text-xs px-2"
                                      >
                                        {isPlayingThis ? (
                                          <Square className="w-3 h-3 mr-2 fill-current" />
                                        ) : (
                                          <Play className="w-3 h-3 mr-2 fill-current" />
                                        )}
                                        {isPlayingThis
                                          ? "Parar"
                                          : `Ouvir (${timestamp.label})`}
                                      </Button>
                                    );
                                  }
                                  return null;
                                })()}
                            </div>
                            <Textarea
                              value={question.text}
                              onChange={(e) =>
                                handleUpdateQuestion(
                                  sectionIndex,
                                  questionIndex,
                                  "text",
                                  e.target.value,
                                )
                              }
                              placeholder={t("questionPromptPlaceholder")}
                              className="resize-y"
                            />
                          </div>

                          {/* Audio Range Inputs (Only for Timestamp/Listening sections) */}
                          {/timestamp|listening|audio/i.test(section.type) && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                              <div className="col-span-2 text-sm font-medium flex items-center gap-2 mb-2">
                                <Play className="h-3.5 w-3.5" />
                                Audio Segment Control (seconds)
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">
                                  Start Time (s)
                                </label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={question.audioRange?.start ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                    const currentRange = question.audioRange || { start: 0, end: 0 };
                                    handleUpdateQuestion(
                                      sectionIndex,
                                      questionIndex,
                                      "audioRange",
                                      { ...currentRange, start: val ?? 0 }
                                    );
                                  }}
                                  placeholder="e.g. 15.5"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">
                                  End Time (s)
                                </label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={question.audioRange?.end ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                    const currentRange = question.audioRange || { start: 0, end: 0 };
                                    handleUpdateQuestion(
                                      sectionIndex,
                                      questionIndex,
                                      "audioRange",
                                      { ...currentRange, end: val ?? 0 }
                                    );
                                  }}
                                  placeholder="e.g. 20.0"
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    {t("optionLabel", {
                                      index: optionIndex + 1,
                                    })}
                                  </label>
                                  <input
                                    type="radio"
                                    name={`correct-${sectionIndex}-${questionIndex}`}
                                    checked={
                                      question.correctIndex === optionIndex
                                    }
                                    onChange={() =>
                                      handleUpdateQuestion(
                                        sectionIndex,
                                        questionIndex,
                                        "correctIndex",
                                        optionIndex,
                                      )
                                    }
                                    className="h-4 w-4 text-primary"
                                  />
                                </div>
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    handleUpdateQuestion(
                                      sectionIndex,
                                      questionIndex,
                                      "options",
                                      e.target.value,
                                      optionIndex,
                                    )
                                  }
                                  placeholder={t("optionPlaceholder", {
                                    index: optionIndex + 1,
                                  })}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t("explanationLabel")}
                            </label>
                            <Textarea
                              value={question.explanation || ""}
                              onChange={(e) =>
                                handleUpdateQuestion(
                                  sectionIndex,
                                  questionIndex,
                                  "explanation",
                                  e.target.value,
                                )
                              }
                              placeholder={t("explanationPlaceholder")}
                              className="h-20 resize-y"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => handleAddQuestion(sectionIndex)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Modal
        open={deleteConfirmation?.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <ModalContent>
          <ModalHeader>
            <ModalIcon type="delete" />
            <ModalTitle>{t("deleteModal.title")}</ModalTitle>
            <ModalDescription>{t("deleteModal.description")}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setDeleteConfirmation(null)}>
              {t("deleteModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={confirmDeleteQuestion}
            >
              {t("deleteModal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {lesson.audioUrl && (
        <audio
          ref={audioRef}
          src={lesson.audioUrl}
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlayingSegment(null)}
        />
      )}
    </div>
  );
}
