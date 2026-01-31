import React, { useCallback, useRef, useState } from "react";
import {
  useMessageInputContext,
  TextareaComposer,
  useMessageComposer,
  useAttachmentManagerState,
} from "stream-chat-react";
import { Paperclip, Send, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomAudioRecorder } from "./CustomAudioRecorder";
import { AnimatePresence, motion } from "framer-motion";
import { ModalContent, ModalHeader, ModalIcon, ModalTitle, ModalDescription, ModalFooter, ModalSecondaryButton, ModalPrimaryButton, Modal } from "../ui/modal";

export const PillMessageInput = () => {
  const { handleSubmit, recordingController } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const {
    isUploadEnabled,
    attachments,
    uploadsInProgressCount,
  } = useAttachmentManagerState();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAttachments = attachments.length > 0;

  const { recorder, recordingState } = recordingController;
  const recordingEnabled = !!(recorder && navigator.mediaDevices);
  
  const isRecordingMode = !!recordingState;
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleSend = useCallback(
    (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      handleSubmit(e);
    },
    [handleSubmit],
  );

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      recorder?.start();
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setShowPermissionModal(true);
    }
  }, [recorder]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        messageComposer.attachmentManager.uploadFiles(Array.from(files));
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [messageComposer],
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      messageComposer.attachmentManager.removeAttachments([attachmentId]);
    },
    [messageComposer],
  );

  const variants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.15 } },
  };

  return (
    <div className="w-full px-4 pb-4 pt-2 bg-background/80 backdrop-blur-sm z-20">
      
      {!isRecordingMode && hasAttachments && (
        <div className="mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
          {attachments.map((attachment) => (
            <div key={attachment.localMetadata?.id} className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary border border-border">
                {attachment.type === "image" && attachment.image_url && (
                  <img
                    src={attachment.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                {attachment.type === "file" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Paperclip size={24} />
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  handleRemoveAttachment(attachment.localMetadata?.id)
                }
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative w-full">
        <AnimatePresence mode="wait" initial={false}>
          {isRecordingMode ? (
            <motion.div
              key="audio-recorder"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full"
            >
              <CustomAudioRecorder />
            </motion.div>
          ) : (
            <motion.div
              key="text-input"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full"
            >
              <div
                className={cn(
                  // MUDANÇA: h-auto permite crescer, items-end alinha botões em baixo
                  "flex items-end gap-2 px-2 bg-secondary/30 border border-border/50",
                  "rounded-[26px] shadow-sm transition-all duration-200 min-h-[54px]"
                )}
              >
                {/* LADO ESQUERDO: ANEXO */}
                <div className="flex flex-col justify-end h-full pb-[9px]"> {/* Padding ajustado para alinhar com texto */}
                  {isUploadEnabled && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,application/pdf"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadsInProgressCount > 0}
                        className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                          "text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
                          uploadsInProgressCount > 0 && "opacity-50 cursor-not-allowed",
                        )}
                        type="button"
                      >
                        <Paperclip size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* CENTRO: ÁREA DE TEXTO */}
                <div className="flex-1 min-w-0 py-[14px]"> {/* Padding vertical consistente */}
                  <TextareaComposer
                    className={cn(
                      "w-full bg-transparent resize-none outline-none align-bottom",
                      "text-sm placeholder:text-muted-foreground leading-relaxed",
                      // Scrollbar sutil se o texto for muito grande
                      "scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20",
                      "max-h-[150px] overflow-y-auto" 
                    )}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    // Importante para o auto-grow funcionar corretamente na Stream
                    maxRows={10} 
                  />
                </div>

                {/* LADO DIREITO: MIC / ENVIAR */}
                <div className="flex flex-col justify-end h-full pb-[9px]">
                  <div className="flex items-center gap-1 shrink-0">
                    {recordingEnabled ? (
                      <button
                        onClick={handleStartRecording}
                        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        type="button"
                      >
                        <Mic size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:brightness-110 shadow-sm transition-all"
                        type="button"
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <ModalContent>
          <ModalHeader>
            <ModalIcon type="warning" />
            <ModalTitle>Permissão de Microfone Necessária</ModalTitle>
            <ModalDescription>
              Para enviar mensagens de voz, você precisa permitir o acesso ao
              microfone. Verifique as configurações do seu navegador e tente
              novamente.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setShowPermissionModal(false)}>
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleStartRecording}>
              Tentar Novamente
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};