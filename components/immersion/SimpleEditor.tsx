"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";

interface SimpleEditorProps {
  content: string;
  onChange?: (content: string) => void;
  editable?: boolean;
}

export function SimpleEditor({
  content,
  onChange,
  editable = true,
}: SimpleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg shadow-md my-6", // Estilo para imagens dentro do post
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all",
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert max-w-none focus:outline-none",
          // Se for editável, mantém a aparência de input. Se não, aparência de artigo limpo.
          editable
            ? "min-h-[200px] p-4 border rounded-md focus:ring-2 focus:ring-ring bg-background"
            : "prose-lg prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl",
        ),
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-4">
      {editable && (
        <div className="sticky top-0 z-10 flex gap-1 p-1 rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm flex-wrap mb-4">
          {/* ... Botões da toolbar (mantive igual, só ajustei o container) ... */}
          {/* Para brevidade, imagine seus botões aqui */}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
