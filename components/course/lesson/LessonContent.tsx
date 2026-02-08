"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lesson, QuizResult } from "@/types/quiz/types";
import LessonDisplay from "@/components/course/LessonDisplay";
import QuizComponent from "@/components/course/QuizComponent";
import { toast } from "sonner";

interface LessonContentProps {
  lesson: Lesson;
  savedQuizData: QuizResult | null;
  onQuizSubmit: (results: any) => Promise<void>;
}

export function LessonContent({
  lesson,
  savedQuizData,
  onQuizSubmit,
}: LessonContentProps) {
  const [isContentExpanded, setIsContentExpanded] = useState(true);

  // Filter out the first video block because it's displayed in the Hero player
  // If there are multiple videos, subsequent ones remain in the content flow.
  const firstVideoIndex = lesson.contentBlocks.findIndex(
    (b) => b.type === "video",
  );
  const filteredBlocks = lesson.contentBlocks.filter(
    (_, index) => index !== firstVideoIndex,
  );

  const modifiedLesson = {
    ...lesson,
    contentBlocks: filteredBlocks,
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleBookmark = () => {
    toast("Bookmarked lesson (Mock)");
  };

  return (
    <div className="space-y-4">
      {/* 1. Information Bar */}
      <div className="card-base rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {lesson.title}
          </h1>
          <p className="text-neutral-400 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lesson Details
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className="flex-1 sm:flex-none text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* 2. Course Details (Collapsible) */}
      <div className="space-y-4 px-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Content</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsContentExpanded(!isContentExpanded)}
            className="text-neutral-400 hover:text-white"
          >
            {isContentExpanded ? (
              <>
                Less <ChevronUp className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                More <ChevronDown className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {isContentExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <LessonDisplay lesson={modifiedLesson} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Quiz Section */}
      {lesson.quiz && lesson.quiz.length > 0 && (
        <div className="pt-4">
          <Separator className="bg-neutral-800 mb-8" />
          <QuizComponent
            quiz={lesson.quiz}
            onQuizSubmit={onQuizSubmit}
            savedQuizData={savedQuizData}
          />
        </div>
      )}
    </div>
  );
}
