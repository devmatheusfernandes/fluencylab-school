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
import * as Y from "yjs";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";
import { Image } from "@tiptap/extension-image";
import { MAX_FILE_SIZE, handleImageUpload } from "@/lib/tiptap-utils";
import Toolbar from "./toolbar/toolbar";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomToolbar from "./toolbar/bottom-toolbar";
import QuestionsExtension from "@/components/editor/extensions/Question/QuestionsExtension";

interface TiptapEditorProps {
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  autoSaveDelay?: number;
  className?: string;
  ydoc?: Y.Doc | null;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onSave,
  placeholder = "Comece a escrever...",
  autoSaveDelay = 2000,
  className = "",
  ydoc = null,
}) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);
  const isMobile = useIsMobile();

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
            await onSave(newContent);
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
      QuestionsExtension,
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
        limit: 3,
        upload: handleImageUpload,
        onError: (error: any) => console.error("Upload failed:", error),
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300",
        },
      }),
      // Add collaboration extension when ydoc is provided
      ...(ydoc
        ? [
            Collaboration.configure({
              document: ydoc,
              field: "content",
            }),
          ]
        : []),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 min-h-[300px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSave(html);
    },
    onCreate: ({ editor }) => {
      // Define o conteúdo inicial, inclusive em modo colaboração, apenas se o editor estiver vazio
      if (content && content !== "<p></p>" && editor.isEmpty) {
        editor.commands.setContent(content);
        lastSavedContentRef.current = content;
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
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-b-lg"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-white dark:bg-gray-950 ${className}`}>
      {!isMobile && <Toolbar editor={editor} />}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="min-h-[300px] max-h-[600px] overflow-y-auto"
        />
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
      {isMobile && <BottomToolbar editor={editor} />}
    </div>
  );
};

export default TiptapEditor;
