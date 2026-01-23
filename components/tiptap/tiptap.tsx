"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import * as Y from "yjs";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";
import { Image } from "@tiptap/extension-image";
import { MAX_FILE_SIZE, handleImageUpload, extractImageSrcsFromHtml, deleteImageByUrl } from "@/lib/tiptap-utils";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./toolbar/toolbar";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomToolbar from "./toolbar/bottom-toolbar";
import { Spinner } from "../ui/spinner";
import { CommentMark } from "@/components/tiptap/extensions/Comments/CommentsMark";
import { CommentsSheet } from "@/components/tiptap/extensions/Comments/CommentsSheet";
import { QuestionsNode } from "@/components/tiptap/extensions/Questions/QuestionsNode";
import { MusicNode } from "@/components/tiptap/extensions/Music/MusicNode";

import "./style.scss";
import FloatStudentCallButton from "../stream/FloatStudentCallButton";
import FloatTeacherCallButton from "../stream/FloatTeacherCallButton";
import { useSession } from "next-auth/react";
import Bubble from "./bubble";

interface TiptapEditorProps {
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  autoSaveDelay?: number;
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
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onSave,
  placeholder = "Comece a escrever...",
  autoSaveDelay = 2000,
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
}) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);
  const isMobile = useIsMobile();
  const imageUrlsRef = useRef<Set<string>>(new Set());
  const { data: session } = useSession();

  const debouncedSave = useCallback(
    async (newContent: string) => {
      // Limpa o timeout anterior se existir
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Define um novo timeout para salvar
      saveTimeoutRef.current = setTimeout(async () => {
        // Verifica se o conteúdo realmente mudou
        if (
          newContent !== lastSavedContentRef.current &&
          !isSavingRef.current
        ) {
          try {
            isSavingRef.current = true;
            onSave(newContent);
            lastSavedContentRef.current = newContent;
          } catch (error) {
            console.error("Erro ao salvar automaticamente:", error);
          } finally {
            isSavingRef.current = false;
          }
        }
      }, autoSaveDelay);
    },
    [onSave, autoSaveDelay]
  );

  const editor = useEditor({
    extensions: [
      CommentMark,
      QuestionsNode,
      MusicNode,
      //Teaching Extensions
      //Default Extensions
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
      }),
      Underline,
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300",
        },
      }),
      // Add collaboration extension when ydoc is provided
      ...(ydoc
        ? [
            Collaboration.configure({
              document: ydoc,
              field: "content",
            }),
            // Collaboration carets (presence) when provider is available
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
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "sm:px-[25vw] px-[8vw] prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 min-h-[300px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const current = new Set(extractImageSrcsFromHtml(html));
      for (const url of imageUrlsRef.current) {
        if (!current.has(url)) {
          deleteImageByUrl(url).catch(() => {});
        }
      }
      imageUrlsRef.current = current;
      debouncedSave(html);
    },
    onCreate: ({ editor }) => {
      try {
        // Debug: listar extensões e marks disponíveis
        // Útil para verificar se 'comment' está carregado
        // Remova se não precisar do log.
        // eslint-disable-next-line no-console
        // console.log("Tiptap extensions:", editor.extensionManager.extensions.map((e: any) => e.name));
        // eslint-disable-next-line no-console
        // console.log("Tiptap marks:", Object.keys((editor as any).schema?.marks || {}));
      } catch {}
      if (content && content !== "<p></p>" && editor.isEmpty) {
        editor.commands.setContent(content);
        lastSavedContentRef.current = content;
        imageUrlsRef.current = new Set(extractImageSrcsFromHtml(content));
      }
    },
  });

  // Atualiza o conteúdo quando a prop content muda externamente (apenas sem colaboração)
  useEffect(() => {
    if (
      !ydoc &&
      editor &&
      content !== editor.getHTML() &&
      content !== lastSavedContentRef.current
    ) {
      editor.commands.setContent(content);
      lastSavedContentRef.current = content;
      imageUrlsRef.current = new Set(extractImageSrcsFromHtml(content));
    }
  }, [content, editor, ydoc]);

  // Cleanup do timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return <Spinner />;
  }

  return (
    <div className={`bg-slate-100 dark:bg-black ${className}`}>
      <div className="relative h-screen overflow-y-auto no-scrollbar">
        {!isMobile && (
          <Toolbar
            editor={editor}
            title={title}
            onTitleChange={onTitleChange}
            studentID={studentID}
            notebookId={notebookId || docId}
          />)}
        <Bubble editor={editor} />
        <EditorContent
          editor={editor}
          className="min-h-screen no-scrollbar"
        /> 
        
        {session?.user.role === "student" && (
          <FloatStudentCallButton student={{ studentID }} />
        )}

        {session?.user.role === "teacher" && (
          <FloatTeacherCallButton student={ studentID } />
        )}
        
        <CommentsSheet editor={editor} docId={docId || "test-comments"} />
      </div>
      {isMobile && <BottomToolbar editor={editor} />}
    </div>
  );
};

export default TiptapEditor;
