"use client";

import { useState } from "react";
import { Lesson } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  analyzeLessonContent,
  processLessonBatch,
  generateLessonQuiz,
  generateLessonTranscript,
  createLesson,
} from "@/actions/lesson-processing";
import { approveLesson } from "@/actions/lesson-updating";
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
import {
  Loader2,
  Play,
  Trash2,
  Wand2,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Progress } from "../ui/progress";

interface LessonOperationsProps {
  lesson: Lesson;
}

export default function LessonOperations({ lesson }: LessonOperationsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isDeleteAudioOpen, setIsDeleteAudioOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("LessonOperations");
  const tStatus = useTranslations("MaterialManager");

  // Helper: Strip HTML
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // 1. Analyze
  const handleAnalyze = async () => {
    if (!lesson.content) {
      toast.error(t("toastAddContent"));
      return;
    }
    setLoading("analyze");
    try {
      const text = stripHtml(lesson.content);
      const res = await analyzeLessonContent(lesson.id, text);
      if (res.success) {
        toast.success(
          t("toastAnalyzeSuccess", {
            vocabCount: res.vocabCount ?? 0,
            structCount: res.structCount ?? 0,
          })
        );
      } else {
        toast.error(t("toastAnalyzeError"));
      }
    } catch (e) {
      toast.error(t("toastServerError"));
    } finally {
      setLoading(null);
    }
  };

  // 2. Process Batch
  const handleProcess = async () => {
    setLoading("process");
    try {
      const res = await processLessonBatch(lesson.id);
      if (res.completed) {
        toast.success(t("toastProcessDone"));
      } else {
        toast.success(
          t("toastProcessPartial", {
            remainingVocab: res.remainingVocab ?? 0,
            remainingStruct: res.remainingStruct ?? 0,
          })
        );
      }
    } catch (e) {
      toast.error(t("toastProcessError"));
    } finally {
      setLoading(null);
    }
  };

  // 3. Generate Quiz
  const handleQuiz = async () => {
    setLoading("quiz");
    try {
      const res = await generateLessonQuiz(lesson.id);
      if (res.success) {
        toast.success(t("toastQuizSuccess"));
      } else {
        toast.error(t("toastQuizError"));
      }
    } catch (e) {
      toast.error(t("toastUnknownError"));
    } finally {
      setLoading(null);
    }
  };

  // 4. Generate Transcript
  const handleTranscript = async () => {
    if (!lesson.audioUrl) {
      toast.error(t("toastNoAudio"));
      return;
    }
    setLoading("transcript");
    try {
      const res = await generateLessonTranscript(lesson.id);
      if (res.success) {
        toast.success(
          t("toastTranscriptSuccess", {
            count: res.count ?? 0,
          })
        );
      } else {
        toast.error(t("toastTranscriptError"));
      }
    } catch (e) {
      toast.error(t("toastUnknownError"));
    } finally {
      setLoading(null);
    }
  };

  // 5. Upload Audio
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading("upload");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lessonId", lesson.id);

    try {
      const res = await fetch("/api/lesson/upload-audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        await updateDoc(doc(db, "lessons", lesson.id), {
           audioUrl: data.url
        });
        toast.success(t("toastUploadSuccess"));
      } else {
        toast.error(data.error || t("toastUploadError"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toastUploadSendError"));
    } finally {
      setLoading(null);
    }
  };

  // 6. Delete Audio
  const handleDeleteAudio = async () => {
    setLoading("delete-audio");
    try {
       const res = await fetch("/api/lesson/delete-audio", {
         method: "POST", // or DELETE
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ lessonId: lesson.id, fileUrl: lesson.audioUrl })
       });
       
       if (res.ok) {
         await updateDoc(doc(db, "lessons", lesson.id), { audioUrl: null, transcriptSegments: null });
         toast.success(t("toastDeleteSuccess"));
         setIsDeleteAudioOpen(false);
       } else {
         toast.error(t("toastDeleteError"));
       }
    } catch (e) {
      toast.error(t("toastDeleteRequestError"));
    } finally {
      setLoading(null);
    }
  };

  // 7. Approve Lesson
  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await approveLesson(lesson.id);
      if (res.success) {
        toast.success(t("toastApproveSuccess"));
      } else {
        toast.error(t("toastApproveError"));
      }
    } catch (e) {
      toast.error(t("toastUnknownError"));
    } finally {
      setLoading(null);
    }
  };

  // Status Badge Helper
  const getStatusColor = (s: string) => {
    switch (s) {
      case "ready":
        return "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200";
      case "processing_items":
        return "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200";
      case "analyzing":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
      case "reviewing":
        return "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200";
      case "error":
        return "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  const queueVocab = lesson.learningItensQueue?.length || 0;
  const queueStruct = lesson.learningStructuresQueue?.length || 0;
  const totalQueue = queueVocab + queueStruct;

  const relatedVocab = lesson.relatedLearningItemIds?.length || 0;
  const relatedStruct = lesson.relatedLearningStructureIds?.length || 0;
  const totalProcessed = relatedVocab + relatedStruct;

  const totalAll = totalQueue + totalProcessed;
  const progress = totalAll > 0 ? (totalProcessed / totalAll) * 100 : 0;
  const hasAnalyzed = totalAll > 0 || lesson.status !== 'draft';

  const getStatusLabel = (status: string) => {
    // @ts-ignore
    return tStatus(`status.${status}`) || status;
  };

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
           <h2 className="text-xl font-bold">{lesson.title}</h2>
           <div className="flex flex-row gap-2">
           <span className={`px-2 py-1 rounded text-xs font-medium uppercase bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
            {lesson.language}
           </span>
           <span className={`px-2 py-1 rounded text-xs font-medium uppercase bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
            {lesson.level}
           </span>
           <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getStatusColor(lesson.status)}`}>
             {getStatusLabel(lesson.status)}
           </span>
           </div>
        </div>
        
        {/* Approve Action */}
        {lesson.status === "reviewing" && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
            <Eye className="w-4 h-4" />
            <AlertTitle>{t("reviewBadgeTitle")}</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400 mt-2">
              <p className="mb-3">{t("reviewBadgeDescription")}</p>
              <Button 
                size="sm" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0"
                onClick={handleApprove}
                disabled={!!loading}
              >
                {loading === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                {t("approvePublish")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/hub/material-manager/lessons/${lesson.id}/components`)}
          >
            {t("navComponents")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/hub/material-manager/lessons/${lesson.id}/quiz`)}
          >
            {t("navQuiz")}
          </Button>
        </div>
      </div>

      <hr />

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="w-4 h-4" /> {t("analyzeTitle")}
        </h3>
        
        {totalAll > 0 && (
          <div className="space-y-2">
             <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{Math.round(progress)}%</span>
                <span>{totalProcessed}/{totalAll}</span>
             </div>
             <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted/40 p-2 rounded">
          <div>
            {t("queueVocab", {
              count: queueVocab,
            })}
          </div>
          <div>
            {t("queueStruct", {
              count: queueStruct,
            })}
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleAnalyze}
          disabled={!!loading}
        >
          {loading === 'analyze' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          {hasAnalyzed ? t("analyzeAgainButton") : t("analyzeButton")}
        </Button>

        <Button 
          className="w-full justify-start" 
          onClick={handleProcess}
          disabled={!!loading || totalQueue === 0}
        >
          {loading === 'process' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {t("processButton")}
        </Button>
      </div>

      <hr />

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {t("quizSectionTitle")}
        </h3>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleQuiz}
          disabled={!!loading || !!lesson.quiz?.quiz_metadata.dateGenerated}
        >
          {loading === 'quiz' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {t("quizGenerate")}
        </Button>
        {lesson.quiz && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              {t("quizAvailable", {
                date: new Date(
                  lesson.quiz?.quiz_metadata.dateGenerated as any
                ).toLocaleDateString(),
              })}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <hr />

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Play className="w-4 h-4" /> {t("audioSectionTitle")}
        </h3>
        
        {!lesson.audioUrl ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              {t("uploadLabel")}
            </label>
            <input 
              type="file" 
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={!!loading}
              className="text-xs"
            />
            {loading === "upload" && (
              <span className="text-xs text-indigo-500">
                {t("uploadSending")}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <audio controls src={lesson.audioUrl} className="w-full h-8" />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTranscript}
              disabled={!!loading}
            >
              {loading === "transcript" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("transcriptButton")
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => setIsDeleteAudioOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> {t("removeAudioButton")}
            </Button>
          </div>
        )}
      </div>

      <Modal open={isDeleteAudioOpen} onOpenChange={setIsDeleteAudioOpen}>
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>{t("modalDeleteTitle")}</ModalTitle>
            <ModalDescription>
              {t("modalDeleteDescription")}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter className="flex justify-end gap-3">
            <ModalSecondaryButton
              type="button"
              onClick={() => setIsDeleteAudioOpen(false)}
              disabled={!!loading}
            >
              {t("modalCancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={handleDeleteAudio}
              disabled={!!loading}
            >
              {loading === "delete-audio" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("modalConfirmDelete")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
