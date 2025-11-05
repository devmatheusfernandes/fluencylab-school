import type { Commands } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      addComment: (attrs: { id: string }) => ReturnType;
      unsetComment: () => ReturnType;
      unsetCommentById: (id: string) => ReturnType;
    };
  }
}