"use client";

import Link from "next/link";
import { CheckCircle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, Lesson } from "@/types/quiz/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LessonSidebarProps {
  courseId: string;
  sections: Section[];
  currentLessonId: string;
  completedLessonIds: string[]; // List of IDs from enrollment.progress
  onMarkComplete: (lessonId: string) => void;
}

export function LessonSidebar({
  courseId,
  sections,
  currentLessonId,
  completedLessonIds,
  onMarkComplete,
}: LessonSidebarProps) {
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
    <div className="space-y-6 h-full flex flex-col">
      {/* 1. Study Progress Widget */}
      <Card className="bg-neutral-900 border-neutral-800 text-white shadow-lg shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Your Study Progress
            </CardTitle>
            <span className="text-sm font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
              {progressPercentage}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative pt-2 pb-6">
            {/* Custom Progress Bar Track */}
            <div className="relative h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {/* Nodes */}
            <div className="absolute top-2 left-0 w-full flex justify-between px-[1px]">
              {[0, 25, 50, 75, 100].map((node) => (
                <div
                  key={node}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 text-[8px] flex items-center justify-center -mt-1 z-10 bg-neutral-900",
                    progressPercentage >= node
                      ? "border-indigo-500 text-indigo-500"
                      : "border-neutral-700 text-neutral-700",
                  )}
                ></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            {progressPercentage === 100
              ? "Congratulations! Course Completed!"
              : "Great job! Keep going."}
          </p>
        </CardContent>
      </Card>

      {/* 2. Course Playlist */}
      <Card className="flex-1 bg-neutral-900 border-neutral-800 text-white shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-sm">Course Completion</h3>
          <span className="text-xs text-neutral-500 font-mono">
            {currentLessonNumber}/{totalLessons}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {sections.map((section, sIndex) => (
              <div key={section.id || sIndex}>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">
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
                              ? "bg-white/5 border-white/20 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-white/5",
                            isLocked &&
                              "opacity-50 cursor-not-allowed hover:bg-transparent",
                          )}
                          onClick={(e) => isLocked && e.preventDefault()}
                        >
                          {/* Hover Action Button - Show only if unlocked and incomplete */}
                          {!isCompleted && !isLocked && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMarkComplete(lesson.id);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-500 p-1.5 rounded-full border border-neutral-800 hover:border-emerald-500/50 shadow-md z-20"
                              title="Marcar como concluída"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : isActive ? (
                              <div className="w-5 h-5 rounded-full border border-indigo-500 flex items-center justify-center">
                                <Play className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                              </div>
                            ) : isLocked ? (
                              <Lock className="w-5 h-5 text-neutral-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-neutral-600 flex items-center justify-center">
                                <Play className="w-2.5 h-2.5 fill-neutral-600 text-neutral-600 ml-0.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium leading-tight mb-1 truncate",
                                isActive
                                  ? "text-white"
                                  : isCompleted
                                    ? "text-neutral-400"
                                    : "text-neutral-300",
                              )}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
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
      </Card>
    </div>
  );
}
