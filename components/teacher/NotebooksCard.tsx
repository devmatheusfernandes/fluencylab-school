"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalFooter,
  ModalSecondaryButton,
  ModalPrimaryButton,
  ModalIcon,
  ModalInput,
} from "@/components/ui/modal";
import { SearchBar } from "@/components/ui/search-bar";
import { NoResults } from "@/components/ui/no-results";
import { SubContainer } from "@/components/ui/sub-container";
import { Notebook } from "@/types/notebooks/notebooks";
import { generateNotebookPDF } from "@/utils/pdfGenerator";
import { FileTextIcon, Luggage, PaperclipIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NotebooksCardProps {
  student: {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  notebooks: Notebook[];
  onCreateNotebook: (title: string) => Promise<boolean>;
  userRole?: string;
  onAddTask?: (taskText: string) => Promise<boolean>;
  loading?: boolean; // Added loading prop
}

// PDF Content Component for printing
const NotebookPDFContent = React.forwardRef<
  HTMLDivElement,
  { notebook: Notebook }
>(({ notebook }, ref) => {
  const t = useTranslations("NotebooksCard");
  return (
    <div ref={ref} className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">{notebook.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("createdAt")}
        {notebook.createdAt &&
          new Date(notebook.createdAt).toLocaleDateString("pt-BR")}
      </p>
      {notebook.description && (
        <p className="text-gray-700 mb-6">{notebook.description}</p>
      )}
      <div className="border-t border-gray-300 pt-4">
        <h2 className="text-xl font-semibold mb-3">{t("content")}</h2>
        <div className="whitespace-pre-wrap">{notebook.content}</div>
      </div>
    </div>
  );
});
NotebookPDFContent.displayName = "NotebookPDFContent";

export default function NotebooksCard({
  student,
  notebooks,
  onCreateNotebook,
  userRole,
  onAddTask
}: NotebooksCardProps) {
  const t = useTranslations("NotebooksCard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      // Small delay to ensure modal is mounted and transition has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Filter notebooks by search query
  const filteredNotebooks = notebooks.filter(
    (notebook) =>
      notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle creating a new notebook
  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) return;

    try {
      const successResult = await onCreateNotebook(newNotebookTitle);
      if (successResult) {
        setNewNotebookTitle("");
        setIsModalOpen(false);
        toast.success(t("successCreated"));
      } else {
        toast.error(t("errorCreated"));
      }
    } catch (err) {
      toast.error(t("errorCreated"));
    }
  };

  // Handle adding notebook as a task for review
  const handleAddNotebookAsTask = async (notebook: Notebook) => {
    if (!onAddTask) return;

    const taskText = t("reviewTask", {
      title: notebook.title,
      date: new Date(notebook.createdAt).toLocaleDateString("pt-BR"),
    });

    try {
      const successResult = await onAddTask(taskText);
      if (successResult) {
        toast.success(t("successTask"));
      } else {
        toast.error(t("errorTask"));
      }
    } catch (err) {
      toast.error(t("errorTask"));
    }
  };

  // Handle downloading notebook as PDF
  const handleDownloadNotebookPDF = (notebook: Notebook) => {
    try {
      const success_result = generateNotebookPDF(notebook);
      if (success_result) {
        toast.success(t("successDownload"));
      } else {
        toast.error(t("errorDownload"));
      }
    } catch (err) {
      toast.error(t("errorDownload"));
      console.error("Error generating PDF:", err);
    }
  };

  return (
    <SubContainer>
      <div className="flex flex-row gap-2 mb-4 relative">
        <SearchBar
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          className="w-full pl-10 pr-12" // Added padding to accommodate the button
        />
        {/* Only show the add button for teachers */}
        {userRole === "teacher" && (
          <Plus
            height={24}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 min-w-11 min-h-11 text-secondary hover:text-secondary-hover duration-300 ease-in-out transition-all cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        {filteredNotebooks.length > 0 ? (
          [...filteredNotebooks]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((notebook, index) => (
              <motion.div
                key={notebook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="flex flex-row items-start justify-between overflow-hidden p-4 card-base"
              >
                <Link
                  href={
                    userRole === "teacher"
                      ? `/hub/teacher/my-students/${student?.id}/notebook/${notebook.id}`
                      : `/hub/student/my-notebook/notebook/${notebook.id}`
                  }
                  className="block flex-1"
                >
                  <h3 className="subtitle-base">
                    {notebook.title}
                  </h3>
                  <div className="paragraph-base opacity-70">
                    {notebook.createdAt &&
                      new Date(notebook.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </Link>
                {/* Action buttons - only show for teachers */}

                <div className="flex items-center gap-2">
                  <FileTextIcon
                    height={24}
                    className="w-5 h-5 hover:text-destructive/70 duration-300 easy-in-out transition-all cursor-pointer"
                    onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDownloadNotebookPDF(notebook);
                    }}
                  />
                  {userRole === "teacher" && (
                    <>
                      {onAddTask && (
                        <Luggage
                          height={24}
                          className="w-5 h-5 hover:text-secondary duration-300 easy-in-out transition-all cursor-pointer"
                          onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAddNotebookAsTask(notebook);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))
        ) : (
          <NoResults
            searchQuery={searchQuery}
            customMessage={{
              withSearch: t("noResultsSearch", { query: searchQuery }),
              withoutSearch: t("noResultsEmpty"),
            }}
            className="p-8"
          />
        )}
      </div>

      {/* Modal for creating notebook - only for teachers */}
      {userRole === "teacher" && (
        <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-md">
            <ModalIcon type="confirm" />
            <ModalHeader>
              <ModalTitle>{t("createTitle")}</ModalTitle>
              <ModalClose />
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  {t("inputTitle")}
                </label>
                <ModalInput
                  ref={inputRef}
                  type="text"
                  value={newNotebookTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewNotebookTitle(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      handleCreateNotebook();
                    }
                  }}
                  placeholder={t("inputPlaceholder")}
                />
              </div>
              <ModalFooter>
                <ModalSecondaryButton onClick={() => setIsModalOpen(false)}>
                  {t("cancel")}
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={handleCreateNotebook}
                  disabled={!newNotebookTitle.trim()}
                >
                  {t("create")}
                </ModalPrimaryButton>
              </ModalFooter>
            </div>
          </ModalContent>
        </Modal>
      )}
    </SubContainer>
  );
}
