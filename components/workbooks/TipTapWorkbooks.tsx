"use client";
import React from 'react';

//Other imports
import { useSession } from 'next-auth/react';
import "@/components/tiptap/style.scss";

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

import FloatingToolbar from '../tiptap/toolbar/floating-toolbar';
import BottomToolbar from '../tiptap/toolbar/bottom-toolbar';

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
  return (
    <div className='flex flex-col min-w-full min-h-full gap-8 justify-center items-center text-black dark:text-white'>
      <EditorContent editor={editor} />

      {isEditable && <BottomToolbar editor={editor} />}
    </div>
  );
};

export default Tiptap;