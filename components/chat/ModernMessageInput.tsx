import React, { useCallback, useState, useRef } from "react";
import { 
  Paperclip, 
  Send, 
  Smile, 
  Mic, 
  X
} from "lucide-react";
import { 
  useMessageInputContext,
  MessageInputProps,
  AudioRecorder // Importante estar importado direto
} from "stream-chat-react";
import { cn } from "@/lib/utils"; 
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"; 
import { TextareaComposer } from "stream-chat-react";

interface StreamContextType {
  text: string;
  handleChange: (e: any) => void;
  handleSubmit: (e: React.BaseSyntheticEvent) => void;
  isUploadEnabled: boolean;
  uploadNewFiles: (files: FileList | null) => void;
  attachments: any[];
  removeAttachment: (id: string) => void;
}

export const ModernMessageInput = (props: MessageInputProps) => {
  const {
    text,
    handleChange,
    handleSubmit,
    isUploadEnabled,
    uploadNewFiles,
    attachments = [],
    removeAttachment,
  } = useMessageInputContext() as unknown as StreamContextType;

  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAttachClick = () => {
    document.getElementById("hidden-file-input")?.click();
  };

  const onSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
    setShowEmojiPicker(false);
  }, [handleSubmit]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const currentText = text || "";
    const newText = currentText + emojiData.emoji;
    if (handleChange) {
      handleChange({ target: { value: newText } });
    }
  };

  const hasContent = (text && text.trim().length > 0) || (attachments && attachments.length > 0);

  // --- MODO GRAVAÇÃO ---
if (isRecording) {
    return (
      <div className="p-3 w-full flex items-center justify-center bg-background border-t border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="w-full max-w-4xl relative flex items-center gap-2">
          
          {/* CONTAINER DO GRAVADOR 
              Removemos 'pointer-events-none' ou overlays.
              Adicionamos z-index alto.
          */}
          <div className="flex-1 bg-secondary/40 rounded-[26px] pl-3 pr-2 py-1 border border-transparent shadow-inner flex items-center h-[52px] relative z-10">
            <AudioRecorder />
          </div>
          
          {/* Botão Cancelar (X) Externo */}
          <button 
            onClick={() => setIsRecording(false)}
            className="p-3 bg-secondary/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-full transition-all active:scale-95 flex-shrink-0 z-20"
            title="Cancelar gravação"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // --- MODO TEXTO ---
  return (
    <div className="pb-4 pt-2 px-4 w-full bg-background border-t border-border/30 relative">
      
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-6 z-50 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-2 border border-border/50 overflow-hidden">
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
            <EmojiPicker 
                theme={Theme.AUTO} 
                onEmojiClick={onEmojiClick}
                width={320}
                height={400}
                previewConfig={{ showPreview: false }}
            />
        </div>
      )}

      {attachments && attachments.length > 0 && (
        <div className="flex gap-3 mb-4 overflow-x-auto px-1 scrollbar-hide pt-2">
          {attachments.map((file: any, i: number) => (
            <div key={file.id || i} className="relative group shrink-0 animate-in zoom-in-90 duration-200">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-border/50 bg-secondary/30 shadow-sm">
                {file.type === 'image' && (file.image_url || file.file) ? (
                  <img 
                    src={file.image_url || (file.file ? URL.createObjectURL(file.file) : "")} 
                    className="w-full h-full object-cover" 
                    alt="preview" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-medium p-2 text-center break-words">
                    {file.name || file.type}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(file.id || "")}
                className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md backdrop-blur-sm"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {isUploadEnabled && (
          <button 
            onClick={handleAttachClick}
            className="mb-[6px] text-muted-foreground/80 hover:text-foreground hover:bg-secondary/40 p-2 -ml-2 rounded-full transition-all active:scale-95"
          >
            <Paperclip size={24} strokeWidth={1.5} />
            <input
              type="file"
              id="hidden-file-input"
              multiple
              className="hidden"
              onChange={(e) => uploadNewFiles(e.target.files)}
            />
          </button>
        )}

        <div 
          ref={containerRef}
          className="flex-1 bg-secondary/40 hover:bg-secondary/60 focus-within:bg-secondary/60 transition-colors rounded-[24px] px-4 py-2 relative min-h-[44px] flex items-center border border-transparent focus-within:border-border/30"
        >
          <div className="w-full mr-8 py-1">
            <TextareaComposer 
              placeholder="Inicie uma conversa..."
            />
          </div>

          <div className="absolute right-3 bottom-[11px]">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "transition-transform active:scale-90",
                showEmojiPicker ? "text-primary scale-110" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              <Smile size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="mb-[2px]">
          {hasContent ? (
            <button
              onClick={onSend}
              className="p-3 text-primary hover:bg-primary/10 rounded-full transition-all animate-in zoom-in spin-in-3 active:scale-95"
            >
              <Send size={24} strokeWidth={2} fill="currentColor" className="opacity-90" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(true)}
              className="p-3 text-muted-foreground/80 hover:text-foreground hover:bg-secondary/40 rounded-full transition-all active:scale-95"
            >
              <Mic size={24} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};