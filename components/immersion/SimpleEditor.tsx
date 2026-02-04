"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

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
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
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
        class:
          "prose dark:prose-invert max-w-none min-h-[200px] p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {editable && (
        <div className="flex gap-2 border p-2 rounded-md bg-muted/50 flex-wrap">
          <Button
            size="sm"
            variant={editor.isActive("bold") ? "glass" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("italic") ? "glass" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={
              editor.isActive("heading", { level: 2 }) ? "glass" : "ghost"
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            type="button"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("bulletList") ? "glass" : "ghost"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive("orderedList") ? "glass" : "ghost"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = window.prompt("URL");
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            type="button"
          >
            IMG
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
