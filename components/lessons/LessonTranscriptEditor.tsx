"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lesson, TranscriptSegment } from "@/types/learning/lesson";
import { updateLessonTranscript } from "@/actions/lessonUpdating";
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
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Play,
  Square,
  Clock,
  User,
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

// Helper to format seconds to MM:SS.ms
const formatTime = (seconds: number) => {
  if (typeof seconds !== "number" || isNaN(seconds)) return "0:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(2, "0")}`;
};

// Helper to parse MM:SS.ms to seconds
const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  // Replace comma with dot for international support
  const normalized = timeStr.replace(",", ".");
  const parts = normalized.split(":");

  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return 0;
    return mins * 60 + secs;
  }

  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
};

interface TimeInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  onGetCurrentTime?: () => number | null;
  buttonTitle?: string;
}

const TimeInput = ({
  value,
  onChange,
  className,
  onGetCurrentTime,
  buttonTitle,
}: TimeInputProps) => {
  const [localValue, setLocalValue] = useState(formatTime(value));
  const [isEditing, setIsEditing] = useState(false);

  // Sync with prop value when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(formatTime(value));
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const seconds = parseTime(localValue);
    onChange(seconds);
    setLocalValue(formatTime(seconds));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        className={className}
        value={localValue}
        onChange={(e) => {
          setIsEditing(true);
          setLocalValue(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0:00.00"
      />
      {onGetCurrentTime && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 h-6 w-6 text-muted-foreground hover:text-primary z-10 bg-background/50 backdrop-blur-sm"
          title={buttonTitle || "Use current audio time"}
          onClick={() => {
            const time = onGetCurrentTime();
            if (time !== null) {
              onChange(time);
            }
          }}
        >
          <Clock className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

interface LessonTranscriptEditorProps {
  lesson: Lesson;
}

export function LessonTranscriptEditor({
  lesson,
}: LessonTranscriptEditorProps) {
  const router = useRouter();
  const t = useTranslations("LessonTranscriptEditor");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    index: number;
  } | null>(null);

  const [segments, setSegments] = useState<TranscriptSegment[]>(
    lesson.transcriptSegments || [],
  );

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!lesson.transcriptSegments) {
      setSegments([]);
    } else {
      setSegments(lesson.transcriptSegments);
    }
  }, [lesson.transcriptSegments]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await updateLessonTranscript(lesson.id, segments);

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

  const handleUpdateSegment = (
    index: number,
    field: keyof TranscriptSegment,
    value: any,
  ) => {
    setSegments((prev) => {
      const newSegments = [...prev];
      newSegments[index] = { ...newSegments[index], [field]: value };
      return newSegments;
    });
  };

  const handleAddSegment = () => {
    setSegments((prev) => [
      ...prev,
      {
        start: 0,
        end: 0,
        text: "",
        speaker: "Speaker 1",
      },
    ]);
  };

  const handleRemoveSegment = (index: number) => {
    setDeleteConfirmation({ isOpen: true, index });
  };

  const confirmDeleteSegment = () => {
    if (!deleteConfirmation) return;
    const { index } = deleteConfirmation;

    setSegments((prev) => prev.filter((_, i) => i !== index));
    setDeleteConfirmation(null);
  };

  const handlePlaySegment = (index: number, start: number, end: number) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = start;
        audioRef.current.play();
        setPlayingIndex(index);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && playingIndex !== null) {
      const currentSegment = segments[playingIndex];
      if (
        currentSegment &&
        audioRef.current.currentTime >= currentSegment.end
      ) {
        audioRef.current.pause();
        setPlayingIndex(null);
      }
    }
  };

  if (!segments.length && !lesson.audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <NoResults customMessage={{ withoutSearch: t("emptyStateNoAudio") }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("saveButton")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("segmentsTitle")}</CardTitle>
          <CardDescription>{t("segmentsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <TimeInput
                      className="w-28 h-8 text-xs font-mono pr-8"
                      value={segment.start}
                      onChange={(val) =>
                        handleUpdateSegment(index, "start", val)
                      }
                      onGetCurrentTime={() =>
                        audioRef.current?.currentTime || null
                      }
                      buttonTitle={t("useCurrentTime")}
                    />
                    <span className="text-muted-foreground">-</span>
                    <TimeInput
                      className="w-28 h-8 text-xs font-mono pr-8"
                      value={segment.end}
                      onChange={(val) => handleUpdateSegment(index, "end", val)}
                      onGetCurrentTime={() =>
                        audioRef.current?.currentTime || null
                      }
                      buttonTitle={t("useCurrentTime")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    className="h-8 text-xs"
                    value={segment.speaker || ""}
                    onChange={(e) =>
                      handleUpdateSegment(index, "speaker", e.target.value)
                    }
                    placeholder={t("speakerPlaceholder")}
                  />
                </div>

                <div className="flex items-center gap-1">
                  {lesson.audioUrl && (
                    <Button
                      variant={
                        playingIndex === index ? "destructive" : "outline"
                      }
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handlePlaySegment(index, segment.start, segment.end)
                      }
                    >
                      {playingIndex === index ? (
                        <Square className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveSegment(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={segment.text}
                onChange={(e) =>
                  handleUpdateSegment(index, "text", e.target.value)
                }
                placeholder={t("textPlaceholder")}
                className="resize-y min-h-[80px]"
              />
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={handleAddSegment}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addSegment")}
          </Button>
        </CardContent>
      </Card>

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
              onClick={confirmDeleteSegment}
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
          onEnded={() => setPlayingIndex(null)}
        />
      )}
    </div>
  );
}
