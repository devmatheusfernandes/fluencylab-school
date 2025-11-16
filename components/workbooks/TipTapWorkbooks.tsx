"use client";
import React from 'react';

//Other imports
import { useSession } from 'next-auth/react';
import "@/components/editor/style.scss";

//TipTap Imports
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Document from '@tiptap/extension-document'
import Image from '@tiptap/extension-image'
import { EditorContent, Extension, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Color from '@tiptap/extension-color'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import BulletList from '@tiptap/extension-bullet-list'
import Typography from '@tiptap/extension-typography'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import History from '@tiptap/extension-history'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'

//Extensions
import TextStudentExtension from '@/components/editor/extensions/TextStudent/TextStudentExtension';
import TextTeacherExtension from '@/components/editor/extensions/TextTeacher/TextTeacherExtension';
import TextTipExtension from '@/components/editor/extensions/TextTip/TextTipExtension';
import BandImageExtension from '@/components/editor/extensions/BandImage/BandImageExtension';
import BandVideoExtension from '@/components/editor/extensions/BandVideo/BandVideoExtension';
import SentencesExtension from '@/components/editor/extensions/Sentences/SentencesExtension';
import TranslationExtension from '@/components/editor/extensions/Translation/TranslationExtension';
import MultipleChoiceExtension from '@/components/editor/extensions/MultipleChoice/MultipleChoiceExtension';
import QuestionsExtension from '@/components/editor/extensions/Question/QuestionsExtension';
import AudioExtension from '@/components/editor/extensions/Audio/AudioExtension';
import PronounceExtension from '@/components/editor/extensions/Pronounce/PronounceExtension';
import ReviewExtension from '@/components/editor/extensions/Review/ReviewExtension';
import GoalExtension from '@/components/editor/extensions/Goal/GoalExtension';
import VocabulabExtension from '@/components/editor/extensions/Vocabulab/VocabulabExtension';
import DownloadExtension from '@/components/editor/extensions/Download/DownloadExtension';
import FlashcardExtension from '@/components/editor/extensions/Flashcards/FlashcardExtension';
import QuizExtenstion from "@/components/editor/extensions/Quiz/QuizExtension";

//Style

//Tools
import ToolbarToolsSheet from '@/components/editor/toolbar/tools';
import BottomToolbar from '@/components/editor/toolbar/bottom-toolbar';
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
import FloatingToolbar from '../editor/toolbar/floating-toolbar';

const Tiptap = ({ onChange, content, isEditable, isTeacherNotebook }: any) => {
  const { data: session } = useSession();
  const [openModalId, setOpenModalId] = React.useState<string | null>(null);

  const TabInsertExtension = Extension.create({
    name: "customTab",

    addKeyboardShortcuts() {
      return {
        Tab: () => {
          const { state, dispatch } = this.editor.view;
          const { tr, selection } = state;
          const tabSpaces = "    "; // 4 spaces

          dispatch(tr.insertText(tabSpaces, selection.from, selection.to));
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    editable: isEditable,
    extensions: [
      QuizExtenstion,
      TextStudentExtension,
      TextTeacherExtension,
      TextTipExtension,
      BandImageExtension,
      BandVideoExtension,
      SentencesExtension,
      TranslationExtension,
      MultipleChoiceExtension,
      QuestionsExtension,
      AudioExtension,
      PronounceExtension,
      ReviewExtension,
      GoalExtension,
      VocabulabExtension,
      DownloadExtension,
      FlashcardExtension,
      Document,
      Image,
      History,
      TextStyle, 
      FontFamily,
      Typography,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TabInsertExtension,
      Link.configure({
        openOnClick: true,
      }),
      StarterKit.configure({
        document: false,
        undoRedo: false
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Color,

      Placeholder.configure({
        placeholder: ({ node }) => {
          const headingPlaceholders: { [key: number]: string } = {
            1: "Coloque um título...",
            2: "Coloque um subtítulo...",
            3: '/',
          };
          if (node.type.name === "heading") {
            return headingPlaceholders[node.attrs.level];
          }
          if (node.type.name === 'paragraph') {
            return "..."
          }
          return '/'
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "h-full p-6 outline-none bg-background",
      },
    },
    immediatelyRender: false,
    autofocus: true,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  }) 

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
  const ActiveModal = openModalId ? modalComponents[openModalId] : null;

  return (
    <div className='flex flex-col min-w-full min-h-full gap-8 justify-center items-center text-black dark:text-white'>
      <EditorContent editor={editor} />
      <div className='fixed bottom-[5rem] right-5 z-[999] rounded-md bg-gray-400 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'>
        <ToolbarToolsSheet onOpenDialog={(id) => setOpenModalId(id)} modalTools={Object.keys(modalComponents)} />
      </div>
      {isEditable && <BottomToolbar editor={editor} />}
    </div>
  );
};

export default Tiptap;