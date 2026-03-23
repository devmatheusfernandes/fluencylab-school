"use client";

import React, { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import * as Y from "yjs";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";
import { Image } from "@tiptap/extension-image";
import { MAX_FILE_SIZE, handleImageUpload } from "@/lib/ui/tiptapUtils";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./toolbar/toolbar";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import BottomToolbar from "./toolbar/bottom-toolbar";
import { CommentMark } from "@/components/tiptap/extensions/Comments/CommentsMark";
import { CommentsSheet } from "@/components/tiptap/extensions/Comments/CommentsSheet";
import { QuestionsNode } from "@/components/tiptap/extensions/Questions/QuestionsNode";
import { MusicNode } from "@/components/tiptap/extensions/Music/MusicNode";
import { twMerge } from "tailwind-merge";

import "./style.scss";
import FloatCallButton from "../stream/FloatCallButton";
import { useSession } from "next-auth/react";
import Bubble from "./bubble";
import { SpinnerLoading } from "../transitions/spinner-loading";

interface TiptapEditorProps {
  className?: string;
  ydoc?: Y.Doc | null;
  provider?: any | null;
  docId?: string;
  userName?: string;
  userColor?: string;
  studentID?: any;
  notebookId?: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  studentName?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  className = "",
  ydoc = null,
  provider = null,
  docId,
  userName,
  userColor,
  studentID,
  notebookId,
  title,
  onTitleChange,
  studentName,
}) => {
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      CommentMark,
      QuestionsNode,
      MusicNode,
      Placeholder.configure({
        placeholder: ({ node }) => {
          const headingPlaceholders: { [key: number]: string } = {
            1: "Coloque um título...",
            2: "Coloque um subtítulo...",
            3: "/",
            4: "/",
            5: "/",
            6: "/",
          };
          if (node.type.name === "heading") {
            return headingPlaceholders[node.attrs.level];
          }
          if (node.type.name === "paragraph") {
            return "O que vamos aprender...";
          }
          return "/";
        },
      }),
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        undoRedo: false,
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class:
              "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 30,
        upload: handleImageUpload,
        onError: (error: any) => console.error("Upload failed:", error),
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ...(ydoc
        ? [
            Collaboration.configure({
              document: ydoc,
              field: "content",
            }),
            ...(provider
              ? [
                  CollaborationCaret.configure({
                    provider,
                    user: {
                      name: userName ?? "Usuário",
                      color: userColor ?? "#38bdf8",
                    },
                  }),
                ]
              : []),
          ]
        : []),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "sm:px-[25vw] px-[8vw] prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 min-h-[300px] p-4",
      },
    },
  });

  if (!editor) {
    return <SpinnerLoading />;
  }

  return (
    <div
      className={twMerge(
        "!bg-white dark:!bg-black",
        className,
        isMobile && "!bg-slate-100 dark:!bg-slate-950",
        isStandalone && "!bg-slate-200 dark:!bg-slate-900",
      )}
    >
      <div
        ref={containerRef}
        className="relative h-[100dvh] overflow-y-auto no-scrollbar"
      >
        {!isMobile && (
          <Toolbar
            editor={editor}
            title={title}
            onTitleChange={onTitleChange}
            studentID={studentID}
            name={studentName}
            notebookId={notebookId || docId}
          />
        )}

        <Bubble editor={editor} />
        <EditorContent editor={editor} className="min-h-screen no-scrollbar" />

        {isMobile && <div className="h-20" />}

        {session?.user.role === "student" ? (
          <FloatCallButton student={{ studentID }} />
        ) : (
          <FloatCallButton student={studentID} />
        )}

        <CommentsSheet editor={editor} docId={docId || "test-comments"} />
      </div>

      {isMobile && (
        <BottomToolbar
          editor={editor}
          studentID={studentID}
          name={studentName}
        />
      )}
    </div>
  );
};

export default TiptapEditor;
