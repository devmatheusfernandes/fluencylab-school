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

interface LessonOperationsProps {
  lesson: Lesson;
}

export default function LessonOperations({ lesson }: LessonOperationsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isDeleteAudioOpen, setIsDeleteAudioOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("LessonOperations");

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
        return "bg-emerald-100 text-emerald-800";
      case "processing_items":
        return "bg-indigo-100 text-indigo-800";
      case "analyzing":
        return "bg-purple-100 text-purple-800";
      case "reviewing":
        return "bg-amber-100 text-amber-800";
      case "error":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
           <h2 className="text-xl font-bold">{lesson.title}</h2>
           <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getStatusColor(lesson.status)}`}>
             {lesson.status}
           </span>
        </div>
        <div className="text-sm text-muted-foreground flex gap-4">
          <span>{lesson.language.toUpperCase()}</span>
          <span>{lesson.level || 'Nível n/a'}</span>
        </div>
        
        {/* Approve Action */}
        {lesson.status === "reviewing" && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
            <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" /> {t("reviewBadgeTitle")}
            </h4>
            <p className="text-xs text-amber-700 mb-3">
              {t("reviewBadgeDescription")}
            </p>
            <Button 
              size="sm" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleApprove}
              disabled={!!loading}
            >
              {loading === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
              {t("approvePublish")}
            </Button>
          </div>
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
        
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted/40 p-2 rounded">
          <div>
            {t("queueVocab", {
              count: lesson.learningItensQueue?.length || 0,
            })}
          </div>
          <div>
            {t("queueStruct", {
              count: lesson.learningStructuresQueue?.length || 0,
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
          {t("analyzeButton")}
        </Button>

        <Button 
          className="w-full justify-start" 
          onClick={handleProcess}
          disabled={!!loading || (lesson.learningItensQueue?.length === 0 && lesson.learningStructuresQueue?.length === 0)}
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
          disabled={!!loading}
        >
          {loading === 'quiz' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {t("quizGenerate")}
        </Button>
        {lesson.quiz && (
          <p className="text-xs text-emerald-600">
            {t("quizAvailable", {
              date: new Date(
                lesson.quiz?.quiz_metadata.dateGenerated as any
              ).toLocaleDateString(),
            })}
          </p>
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
