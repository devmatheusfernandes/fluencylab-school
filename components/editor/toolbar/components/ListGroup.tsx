import React from "react";
import { Editor } from "@tiptap/react";
import {
  List,
  ListOrdered,
  ListChecks,
  Quote,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ListGroupProps {
  editor: Editor;
}

const ListGroup: React.FC<ListGroupProps> = ({ editor }) => {
  const lists = [
    {
      type: "bulletList",
      icon: <List size={18} />,
      label: "Marcadores",
      shortcut: "Ctrl+Shift+8",
    },
    {
      type: "orderedList",
      icon: <ListOrdered size={18} />,
      label: "Numerada",
      shortcut: "Ctrl+Shift+7",
    },
    {
      type: "taskList",
      icon: <ListChecks size={18} />,
      label: "Tarefas",
      shortcut: "",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`
            p-2 rounded-lg transition-all duration-200 flex items-center gap-1
            ${
              editor.isActive("bulletList") ||
              editor.isActive("orderedList") ||
              editor.isActive("taskList")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }
          `}
          title="Listas"
        >
          <List size={18} />
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {lists.map((list) => (
          <DropdownMenuItem
            key={list.type}
            onClick={() => {
              if (list.type === "bulletList") {
                editor.chain().focus().toggleBulletList().run();
              } else if (list.type === "orderedList") {
                editor.chain().focus().toggleOrderedList().run();
              } else if (list.type === "taskList") {
                editor.chain().focus().toggleTaskList().run();
              }
            }}
            className={`flex items-center gap-3 cursor-pointer ${
              editor.isActive(list.type) ? "bg-primary/10 text-primary" : ""
            }`}
          >
            {list.icon}
            <div className="flex-1">
              <div className="font-medium">Lista {list.label}</div>
              {list.shortcut && (
                <div className="text-xs text-muted-foreground">
                  {list.shortcut}
                </div>
              )}
            </div>
            {editor.isActive(list.type) && <Check size={16} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`flex items-center gap-3 cursor-pointer ${
            editor.isActive("blockquote") ? "bg-primary/10 text-primary" : ""
          }`}
        >
          <Quote size={18} />
          <div className="flex-1">
            <div className="font-medium">Citação</div>
            <div className="text-xs text-muted-foreground">Ctrl+Shift+B</div>
          </div>
          {editor.isActive("blockquote") && <Check size={16} />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ListGroup;