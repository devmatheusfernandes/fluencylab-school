"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Divider,
  HeadingSelector,
  TextFormattingGroup,
  AlignmentGroup,
  ListGroup,
  ColorPicker,
  LinkDrawer,
  HistoryGroup,
  CommentsButton,
} from "./components";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import ToolbarToolsSheet from "./tools";
import { BackButton } from "@/components/ui/back-button";

// Extension Modals
import AudioModal from "@/components/editor/extensions/Audio/AudioModal";
import BandImageModal from "@/components/editor/extensions/BandImage/BandImageModal";
import BandVideoModal from "@/components/editor/extensions/BandVideo/BandVideoModal";
import DownloadModal from "@/components/editor/extensions/Download/DownloadModal";
import FlashcardModal from "@/components/editor/extensions/Flashcards/FlashcardModal";
import GoalModal from "@/components/editor/extensions/Goal/GoalModal";
import MultipleChoiceModal from "@/components/editor/extensions/MultipleChoice/MultipleChoiceModal";
import PronounceModal from "@/components/editor/extensions/Pronounce/PronounceModal";
import QuestionsModal from "@/components/editor/extensions/Question/QuestionsModal";
import QuizModal from "@/components/editor/extensions/Quiz/QuizModal";
import ReviewModal from "@/components/editor/extensions/Review/ReviewModal";
import SentencesModal from "@/components/editor/extensions/Sentences/SentencesModal";
import TextStudentModal from "@/components/editor/extensions/TextStudent/TextStudentModal";
import TextTeacherModal from "@/components/editor/extensions/TextTeacher/TextTeacherModal";
import TextTipModal from "@/components/editor/extensions/TextTip/TextTipModal";
import TranslationModal from "@/components/editor/extensions/Translation/TranslationModal";
import VocabulabModal from "@/components/editor/extensions/Vocabulab/VocabulabModal";

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  if (!editor) {
    return null;
  }

  const modalComponents: Record<string, any> = {
    audio: AudioModal,
    "band-image": BandImageModal,
    "band-video": BandVideoModal,
    download: DownloadModal,
    flashcards: FlashcardModal,
    goal: GoalModal,
    "multiple-choice": MultipleChoiceModal,
    pronounce: PronounceModal,
    question: QuestionsModal,
    quiz: QuizModal,
    review: ReviewModal,
    sentences: SentencesModal,
    "text-student": TextStudentModal,
    "text-teacher": TextTeacherModal,
    "text-tip": TextTipModal,
    translation: TranslationModal,
    vocabulab: VocabulabModal,
  };

  const handleOpenDialog = (toolId: string) => {
    setOpenModalId(toolId);
  };

  const handleCloseDialog = () => setOpenModalId(null);

  const ActiveModal = openModalId ? modalComponents[openModalId] : null;
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background shadow-sm">
      <div className="p-2">
        <div className="flex items-center justify-between gap-4">
          {/* Espaço esquerdo - Placeholder para futuros botões */}
          <div className="flex items-center gap-1 min-w-0">
            <BackButton />
          </div>

          {/* Botões centralizados */}
          <div className="flex flex-wrap items-center justify-center gap-1 flex-1">
            <HeadingSelector editor={editor} />
            <Divider />
            <TextFormattingGroup editor={editor} />
            <Divider />
            <AlignmentGroup editor={editor} />
            <Divider />
            <ListGroup editor={editor} />
            <Divider />
            <ColorPicker editor={editor} />
            <ColorHighlightPopover
              editor={editor}
              hideWhenUnavailable={true}
              onApplied={({ color, label }) =>
                console.log(`Applied highlight: ${label} (${color})`)
              }
            />
            <Divider />
            {/* Comentários */}
            <CommentsButton editor={editor} />
            <Divider />
            <LinkDrawer editor={editor} />
            <Divider />
            <HistoryGroup editor={editor} />
            <ImageUploadButton editor={editor} />
          </div>

          {/* Espaço direito - Placeholder para futuros botões */}
          <div className="flex items-center gap-1 min-w-0">
            <ThemeSwitcher />
            <ToolbarToolsSheet
              onOpenDialog={handleOpenDialog}
              modalTools={Object.keys(modalComponents)}
            />
          </div>
        </div>
      </div>
      {ActiveModal && (
        <ActiveModal isOpen={true} onClose={handleCloseDialog} editor={editor} />
      )}
    </div>
  );
};

export default Toolbar;
