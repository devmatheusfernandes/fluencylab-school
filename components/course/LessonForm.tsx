import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Paperclip,
  Video,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  Lesson,
  TextContentBlock,
  VideoContentBlock,
  Attachment,
  LessonContentBlock,
} from "@/types/quiz/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CourseEditor from "./CourseEditor"; // Assumindo que existe
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalClose,
} from "@/components/ui/modal";

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

export default function LessonForm({
  initialData,
  sectionId,
  onSave,
  onCancel,
  courseId,
  lessonId,
  onAttachmentsUpdated,
  onSwitchToQuiz,
}: {
  initialData: Lesson | null;
  sectionId: string;
  onSave: (data: Omit<Lesson, "id" | "order">) => void;
  onCancel: () => void;
  courseId: string;
  lessonId: string | null;
  onAttachmentsUpdated: (updatedLesson: Lesson) => void;
  onSwitchToQuiz: () => void;
}) {
  const t = useTranslations("CourseComponents.LessonForm");
  const [title, setTitle] = useState(initialData?.title || "");
  const [contentBlocks, setContentBlocks] = useState<LessonContentBlock[]>(
    initialData?.contentBlocks || [],
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialData?.attachments || [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estado para Modal de Confirmação (Genérico)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  // Funções de Gerenciamento de Blocos
  const handleAddBlock = (type: "text" | "video") => {
    const newBlock =
      type === "text"
        ? { id: generateUniqueId(), type: "text", content: "" }
        : { id: generateUniqueId(), type: "video", url: "" };
    setContentBlocks([...contentBlocks, newBlock as LessonContentBlock]);
  };

  const handleBlockChange = (
    id: string,
    field: "content" | "url",
    value: string,
  ) => {
    setContentBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        if (block.type === "text" && field === "content")
          return { ...block, content: value } as TextContentBlock;
        if (block.type === "video" && field === "url")
          return { ...block, url: value } as VideoContentBlock;
        return block;
      }),
    );
  };

  const requestDeleteBlock = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Bloco",
      message: t("messages.confirmDeleteBlock"),
      onConfirm: () => {
        setContentBlocks((prev) => prev.filter((b) => b.id !== id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        toast.success("Bloco removido");
      },
    });
  };

  const handleMoveBlock = (id: string, direction: "up" | "down") => {
    const index = contentBlocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const newBlocks = [...contentBlocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [
        newBlocks[targetIndex],
        newBlocks[index],
      ];
      setContentBlocks(newBlocks);
    }
  };

  // Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lessonId) return toast.error(t("saveFirst"));
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10); // Fake start
    const toastId = toast.loading("Enviando arquivo...");

    try {
      const form = new FormData();
      form.append("file", file);
      // Simulação de delay progress
      const interval = setInterval(
        () => setUploadProgress((p) => (p < 90 ? p + 10 : p)),
        200,
      );

      const res = await fetch(
        `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/attachments`,
        {
          method: "POST",
          body: form,
        },
      );

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) throw new Error(t("apiError"));

      const newAttachment = (await res.json()) as Attachment;
      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);

      // Atualiza pai
      onAttachmentsUpdated({
        ...initialData,
        attachments: updatedAttachments,
      } as Lesson);

      toast.success(t("attachmentUploaded"), { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(t("uploadError"), { id: toastId });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const requestDeleteAttachment = (att: Attachment) => {
    setConfirmModal({
      isOpen: true,
      title: "Remover Anexo",
      message: t("confirmDeleteAttachment", { name: att.name }),
      onConfirm: async () => {
        const toastId = toast.loading(t("removingAttachment"));
        try {
          const res = await fetch(
            `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/attachments`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ attachment: att }),
            },
          );
          if (!res.ok) throw new Error(t("apiError"));

          const updated = attachments.filter((a) => a.id !== att.id);
          setAttachments(updated);
          onAttachmentsUpdated({
            ...initialData,
            attachments: updated,
          } as Lesson);

          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          toast.success(t("attachmentRemoved"), { id: toastId });
        } catch (e) {
          toast.error(t("removeError"), { id: toastId });
        }
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error(t("emptyTitle"));

    const lessonData: Omit<Lesson, "id" | "order"> = {
      sectionId,
      title,
      contentBlocks: contentBlocks.map((block) => ({
        ...block,
        content: block.type === "text" ? block.content || null : undefined,
        url: block.type === "video" ? block.url || null : undefined,
      })) as LessonContentBlock[],
      quiz: initialData?.quiz || [],
    };
    onSave(lessonData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <Label
          htmlFor="lessonTitle"
          className="text-base font-semibold text-gray-700 dark:text-gray-300"
        >
          {t("labels.title")}
        </Label>
        <Input
          id="lessonTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Introdução ao React"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            {t("labels.contentBlocks")}
          </h3>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAddBlock("text")}
            >
              <FileText className="w-4 h-4 mr-2" /> Texto
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAddBlock("video")}
            >
              <Video className="w-4 h-4 mr-2" /> Vídeo
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {contentBlocks.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center text-gray-400">
              <p>Nenhum conteúdo adicionado.</p>
            </div>
          )}

          {contentBlocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="pr-12">
                {block.type === "text" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveBlock(block.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveBlock(block.id, "down")}
                        disabled={index === contentBlocks.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => requestDeleteBlock(block.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CourseEditor
                      content={(block as TextContentBlock).content || ""}
                      onChange={(val) =>
                        handleBlockChange(block.id, "content", val)
                      }
                      placeholder={t("placeholders.markdown")}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">
                      URL do Vídeo
                    </Label>
                    <Input
                      type="url"
                      value={(block as VideoContentBlock).url || ""}
                      onChange={(e) =>
                        handleBlockChange(block.id, "url", e.target.value)
                      }
                      placeholder="https://vimeo.com/..."
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
          {t("labels.attachments")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-md">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{att.name}</p>
                  <p className="text-xs text-gray-500">
                    {(att.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-red-500"
                onClick={() => requestDeleteAttachment(att)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative overflow-hidden">
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !lessonId}
            >
              {uploading ? "Enviando..." : t("labels.newAttachment")}
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading || !lessonId}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          {uploading && (
            <div className="flex-1 max-w-xs h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        {!lessonId && (
          <p className="text-xs text-amber-600 mt-2">
            {t("messages.saveFirstNote")}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("buttons.cancel")}
        </Button>
        <div className="flex items-center gap-3">
          {lessonId && (
            <Button type="button" variant="secondary" onClick={onSwitchToQuiz}>
              Editar Quiz <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </div>

      {/* Modal de Confirmação Reutilizável */}
      <Modal
        open={confirmModal.isOpen}
        onOpenChange={(open) =>
          setConfirmModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{confirmModal.title}</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300">
              {confirmModal.message}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <ModalSecondaryButton
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton
              onClick={confirmModal.onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar
            </ModalPrimaryButton>
          </div>
        </ModalContent>
      </Modal>
    </form>
  );
}
