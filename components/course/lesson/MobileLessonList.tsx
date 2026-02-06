"use client";

import Link from "next/link";
import { CheckCircle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, Lesson } from "@/types/quiz/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleCheckIcon } from "@/public/animated/circle-check";

interface MobileLessonListProps {
  courseId: string;
  sections: Section[];
  currentLessonId: string;
  completedLessonIds: string[];
  onMarkComplete: (lessonId: string) => void;
  onLessonClick?: () => void; // Optional: to close drawer on click
}

export function MobileLessonList({
  courseId,
  sections,
  currentLessonId,
  completedLessonIds,
  onMarkComplete,
  onLessonClick,
}: MobileLessonListProps) {
  // Flatten all lessons to calculate global progress and index
  const allLessons = sections.flatMap((s) => s.lessons || []);
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Find index of current lesson to determine "1/25"
  const currentLessonIndex = allLessons.findIndex(
    (l) => l.id === currentLessonId,
  );
  const currentLessonNumber =
    currentLessonIndex !== -1 ? currentLessonIndex + 1 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* 1. Study Progress Widget - Simplified for Mobile */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Seu Progresso
          </span>
          <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {progressPercentage}%
          </span>
        </div>
        
        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
            {progressPercentage === 100
              ? "Parabéns! Curso Concluído!"
              : `${currentLessonNumber} de ${totalLessons} aulas concluídas`}
        </p>
      </div>

      {/* 2. Course Playlist */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {sections.map((section, sIndex) => (
            <div key={section.id || sIndex}>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h4>
              <div className="space-y-1">
                {(section.lessons || []).map(
                  (lesson: Lesson, lIndex: number) => {
                    const isCompleted = completedLessonIds.includes(
                      lesson.id,
                    );
                    const isActive = lesson.id === currentLessonId;
                    const globalIndex = allLessons.findIndex(
                      (l) => l.id === lesson.id,
                    );
                    const isLocked =
                      globalIndex > 0 &&
                      !completedLessonIds.includes(
                        allLessons[globalIndex - 1].id,
                      ) &&
                      !isCompleted &&
                      !isActive;

                    return (
                      <Link
                        key={lesson.id}
                        href={
                          !isLocked
                            ? `/hub/student/my-courses/course/lesson?courseId=${courseId}&lessonId=${lesson.id}`
                            : "#"
                        }
                        className={cn(
                          "group relative flex items-start gap-3 p-3 rounded-lg transition-all border",
                          isActive
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "bg-transparent border-transparent hover:bg-muted/50",
                          isLocked &&
                            "opacity-50 cursor-not-allowed hover:bg-transparent",
                        )}
                        onClick={(e) => {
                            if (isLocked) {
                                e.preventDefault();
                            } else {
                                onLessonClick?.();
                            }
                        }}
                      >
                        {/* Hover Action Button - Show only if unlocked and incomplete */}
                        {!isCompleted && !isLocked && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onMarkComplete(lesson.id);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 p-1.5 rounded-full z-20 shadow-sm border border-border"
                            title="Marcar como concluída"
                          >
                            <CircleCheckIcon size={20} />
                          </button>
                        )}

                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center">
                              <Play className="w-2.5 h-2.5 fill-primary text-primary" />
                            </div>
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-muted-foreground flex items-center justify-center">
                              <Play className="w-2.5 h-2.5 fill-muted-foreground text-muted-foreground ml-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium leading-tight mb-1 truncate",
                              isActive
                                ? "text-primary"
                                : isCompleted
                                  ? "text-muted-foreground"
                                  : "text-foreground",
                            )}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {lesson.duration || "Não definida"}
                            </span>{" "}
                          </div>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
