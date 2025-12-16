"use client";

import { Mark, mergeAttributes } from "@tiptap/core";
import type { CommandProps } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { Plugin } from "prosemirror-state";

export interface CommentOptions {
  onOpenSheet?: (payload: { id?: string; mode?: "add" | "view" }) => void;
}

declare global {
  interface WindowEventMap {
    "open-comment-sheet": CustomEvent<{ id?: string; mode?: "add" | "view" | "list" }>;
  }
}

export const CommentMark = Mark.create<CommentOptions>({
  name: "comment",

  inclusive() {
    return false;
  },

  addOptions() {
    return {
      onOpenSheet: undefined,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.id) return {};
          return { "data-comment-id": attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]'
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class:
          "cursor-pointer bg-yellow-200/60 dark:bg-yellow-900/40 ring-1 ring-yellow-400/50 rounded-sm px-0.5 comment-mark",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      addComment:
        (attrs: { id: string }) =>
        ({ chain }: CommandProps) => {
          return chain().focus().setMark(this.name, attrs).run();
        },
      unsetComment:
        () =>
        ({ chain }: CommandProps) => {
          return chain().focus().unsetMark(this.name).run();
        },
      unsetCommentById:
        (id: string) =>
        ({ tr, state, dispatch }: CommandProps) => {
          const markType = state.schema.marks[this.name];
          if (!markType) return false;

          const { doc } = state;
          doc.descendants((node, pos) => {
            if (!node.isText) return true;
            const marksToRemove = node.marks.filter(
              (m) => m.type === markType && (m.attrs as any).id === id
            );
            if (marksToRemove.length > 0) {
              marksToRemove.forEach(() => {
                tr.removeMark(pos, pos + node.nodeSize, markType);
              });
            }
            return true;
          });

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const onOpenSheet = this.options.onOpenSheet;
    const name = this.name;
    return [
      new Plugin({
        props: {
          handleClick: (_view, _pos, event) => {
            const target = event.target as HTMLElement | null;
            const id = target?.closest('[data-comment-id]')?.getAttribute('data-comment-id') || undefined;
            if (id) {
              // Prefer callback when provided
              if (onOpenSheet) {
                onOpenSheet({ id, mode: "view" });
              } else {
                window.dispatchEvent(
                  new CustomEvent("open-comment-sheet", { detail: { id, mode: "view" } })
                );
              }
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default CommentMark;