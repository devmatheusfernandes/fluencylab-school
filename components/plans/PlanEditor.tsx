"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  GripVertical,
  Search,
  Lock,
  AlertCircle,
} from "lucide-react";
import { CEFRLevel } from "@/types/learning/lesson";
import { Plan, PlanType } from "@/types/financial/plan";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { searchLessons } from "@/actions/lessonSearch";
import { cn } from "@/lib/utils";
interface PlanEditorProps {
  initialPlan?: Partial<Plan>;
  mode: "create" | "edit";
  type: PlanType;
  studentId?: string;
  onSave: (plan: Partial<Plan>) => Promise<void>;
  onCancel: () => void;
}

export function PlanEditor({
  initialPlan,
  mode,
  type,
  studentId,
  onSave,
  onCancel,
}: PlanEditorProps) {
  const t = useTranslations("Plans.editor");
  const [name, setName] = useState(initialPlan?.name || "");
  const [level, setLevel] = useState<CEFRLevel>(
    (initialPlan?.level as CEFRLevel) || "A1",
  );
  const [goal, setGoal] = useState(initialPlan?.goal || "");
  const [lessons, setLessons] = useState<Plan["lessons"]>(
    initialPlan?.lessons || [],
  );
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      title: string;
      relatedLearningItemIds?: string[];
      relatedLearningStructureIds?: string[];
    }>
  >([]);
  const [searching, setSearching] = useState(false);

  const isPast = (dateStr?: string | Date) => {
    if (!dateStr) return false;
    // Handle both Date objects and strings
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    // Check if valid date
    if (isNaN(date.getTime())) return false;

    // Compare with end of today to be safe, or just current time?
    // User wants "past" lessons. Usually implies lessons from yesterday or before,
    // OR lessons that have already happened today.
    return date < new Date();
  };

  // Find the index of the last past/completed lesson
  // Lessons cannot be moved above this index
  const lastPastIndex = lessons.reduce((acc, lesson, idx) => {
    return isPast(lesson.scheduledDate) ? idx : acc;
  }, -1);

  // Handle Lesson Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // In a real implementation, call a Server Action here
      const results = await searchLessons(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error(t("toasts.searchError"));
    } finally {
      setSearching(false);
    }
  };

  const addLesson = (lesson: {
    id: string;
    title: string;
    relatedLearningItemIds?: string[];
    relatedLearningStructureIds?: string[];
  }) => {
    if (lessons.find((l) => l.id === lesson.id)) {
      toast.warning(t("toasts.lessonAlreadyAdded"));
      return;
    }
    // Create a new PlanLesson object
    const newLesson: Plan["lessons"][0] = {
      id: lesson.id,
      title: lesson.title,
      order: lessons.length,
      learningItemsIds:
        lesson.relatedLearningItemIds?.map((id) => ({
          id,
          updatedAt: new Date(),
        })) || [],
      learningStructureIds:
        lesson.relatedLearningStructureIds?.map((id) => ({
          id,
          updatedAt: new Date(),
        })) || [],
    };
    setLessons([...lessons, newLesson]);
    setSearchResults([]); // Clear search after adding
    setSearchQuery("");
  };

  const removeLesson = (index: number) => {
    if (index <= lastPastIndex) {
      toast.error(t("lockedLesson"));
      return;
    }
    const newLessons = lessons.filter((_, i) => i !== index);
    // Reorder
    const reordered = newLessons.map((l, i) => ({ ...l, order: i }));
    setLessons(reordered);
  };

  const handleMoveLesson = (index: number, direction: "up" | "down") => {
    // Prevent moving past lessons
    if (index <= lastPastIndex) {
      return;
    }

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === lessons.length - 1)
    ) {
      return;
    }

    // Prevent moving a future lesson into the past zone
    // i.e., if direction is up, new index would be index - 1.
    // If index - 1 <= lastPastIndex, forbid.
    if (direction === "up" && index - 1 <= lastPastIndex) {
      toast.warning(t("lockedLesson"));
      return;
    }

    const newLessons = [...lessons];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap
    [newLessons[index], newLessons[targetIndex]] = [
      newLessons[targetIndex],
      newLessons[index],
    ];

    // Reassign order
    const reordered = newLessons.map((l, i) => ({ ...l, order: i }));
    setLessons(reordered);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("toasts.nameRequired"));
      return;
    }
    if (lessons.length === 0) {
      toast.error(t("toasts.minLessons"));
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name,
        level,
        goal,
        lessons,
        type,
        studentId,
        status: initialPlan?.status || "draft",
      });
      toast.success(t("toasts.saveSuccess"));
    } catch (error) {
      toast.error(t("toasts.saveError"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("nameLabel")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("levelLabel")}</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as CEFRLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-full space-y-2">
          <Label>{t("goalLabel")}</Label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t("goalPlaceholder")}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">{t("lessonsTitle")}</h3>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            variant="secondary"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? t("searching") : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 p-2 bg-muted rounded-md space-y-2 max-h-40 overflow-y-auto">
            <p className="text-xs text-muted-foreground font-semibold px-2">
              {t("searchResults")}
            </p>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 bg-background rounded border text-sm hover:bg-accent cursor-pointer"
                onClick={() => addLesson(result)}
              >
                <span>{result.title}</span>
                <Plus className="w-4 h-4 text-primary" />
              </div>
            ))}
          </div>
        )}

        {/* Lesson List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              {t("noLessonsAdded")}
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const isLocked = isPast(lesson.scheduledDate);

              return (
                <Card
                  key={lesson.id}
                  className={cn(
                    "p-3 flex items-center gap-3 transition-colors",
                    isLocked ? "bg-muted/50 border-muted" : "bg-card",
                  )}
                >
                  <div className="flex flex-col gap-1 text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveLesson(index, "up")}
                      disabled={
                        index === 0 || isLocked || index - 1 <= lastPastIndex
                      }
                    >
                      ▲
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveLesson(index, "down")}
                      disabled={index === lessons.length - 1 || isLocked}
                    >
                      ▼
                    </Button>
                  </div>
                  <div
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-full font-bold text-sm",
                      isLocked
                        ? "bg-muted-foreground/20 text-muted-foreground"
                        : "bg-muted",
                    )}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : index + 1}
                  </div>
                  <div
                    className={cn(
                      "flex-1 font-medium",
                      isLocked &&
                        "text-muted-foreground line-through decoration-border",
                    )}
                  >
                    {lesson.title}
                    {isLocked && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground no-underline inline-flex items-center gap-1">
                        ({t("pastLesson")})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-destructive hover:bg-destructive/10",
                      isLocked &&
                        "opacity-50 cursor-not-allowed hover:bg-transparent text-muted-foreground",
                    )}
                    onClick={() => removeLesson(index)}
                    disabled={isLocked}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
