"use client";

import type { ComponentType } from "react";
import type { Editor } from "@tiptap/react";
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

type EditorToolProps = { editor: Editor } & Record<string, unknown>;
type DividerToolProps = Record<string, unknown>;

type DividerItem = {
  id: string;
  component: ComponentType<DividerToolProps>;
  width?: number;
  isDivider: true;
  props?: Partial<DividerToolProps>;
};

type EditorItem = {
  id: string;
  component: ComponentType<EditorToolProps>;
  width?: number;
  isDivider?: false;
  props?: Partial<EditorToolProps>;
};

export type ToolItem = DividerItem | EditorItem;

export const TOOL_ITEMS: ToolItem[] = [
  { id: "heading", component: HeadingSelector, width: 140 },
  { id: "divider-1", component: Divider, width: 20, isDivider: true },
  { id: "formatting", component: TextFormattingGroup, width: 120 },
  { id: "divider-2", component: Divider, width: 20, isDivider: true },
  { id: "alignment", component: AlignmentGroup, width: 50 },
  { id: "divider-3", component: Divider, width: 20, isDivider: true },
  { id: "list", component: ListGroup, width: 50 },
  { id: "divider-4", component: Divider, width: 20, isDivider: true },
  { id: "color", component: ColorPicker, width: 50 },
  {
    id: "colorHighlight",
    component: ColorHighlightPopover,
    width: 50,
    props: {
      hideWhenUnavailable: true,
      onApplied: ({ color, label }: { color: string; label: string }) =>
        console.log(`Applied highlight: ${label} (${color})`),
    },
  },
  { id: "divider-5", component: Divider, width: 20, isDivider: true },
  { id: "comments", component: CommentsButton, width: 50 },
  { id: "divider-6", component: Divider, width: 20, isDivider: true },
  { id: "link", component: LinkDrawer, width: 50 },
  { id: "divider-7", component: Divider, width: 20, isDivider: true },
  { id: "history", component: HistoryGroup, width: 90 },
  { id: "imageUpload", component: ImageUploadButton, width: 50 },
];
