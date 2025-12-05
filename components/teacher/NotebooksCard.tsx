"use client";

import React, { useState } from "react";
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
import { Luggage, PaperclipIcon, Plus } from "lucide-react";
import { toast } from "sonner";

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
  return (
    <div ref={ref} className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">{notebook.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Criado em:{" "}
        {notebook.createdAt &&
          new Date(notebook.createdAt).toLocaleDateString("pt-BR")}
      </p>
      {notebook.description && (
        <p className="text-gray-700 mb-6">{notebook.description}</p>
      )}
      <div className="border-t border-gray-300 pt-4">
        <h2 className="text-xl font-semibold mb-3">Conteúdo</h2>
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
  onAddTask,
  loading = false,
}: NotebooksCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

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
        toast.success("Sucesso!", { description: "Caderno criado com sucesso." });
      } else {
        toast.error("Erro!", { description: "Não foi possível criar o caderno." });
      }
    } catch (err) {
      toast.error("Erro!", { description: "Ocorreu um erro ao criar o caderno." });
    }
  };

  // Handle adding notebook as a task for review
  const handleAddNotebookAsTask = async (notebook: Notebook) => {
    if (!onAddTask) return;

    const taskText = `Revisar caderno: ${notebook.title} - ${new Date(notebook.createdAt).toLocaleDateString("pt-BR")}`;

    try {
      const successResult = await onAddTask(taskText);
      if (successResult) {
        toast.success("Sucesso!", { description: "Caderno adicionado às tarefas para revisão!" });
      } else {
        toast.error("Erro!", { description: "Não foi possível adicionar o caderno às tarefas." });
      }
    } catch (err) {
      toast.error("Erro!", { description: "Ocorreu um erro ao adicionar o caderno às tarefas." });
    }
  };

  // Handle downloading notebook as PDF
  const handleDownloadNotebookPDF = (notebook: Notebook) => {
    try {
      const success_result = generateNotebookPDF(notebook);
      if (success_result) {
        toast.success("Sucesso!", { description: "Caderno baixado como PDF com sucesso!" });
      } else {
        toast.error("Erro!", { description: "Ocorreu um erro ao baixar o caderno como PDF." });
      }
    } catch (err) {
      toast.error("Erro!", { description: "Ocorreu um erro ao baixar o caderno como PDF." });
      console.error("Error generating PDF:", err);
    }
  };

  return (
    <SubContainer>
      <div className="flex flex-row gap-2 mb-4 relative">
        <SearchBar
          placeholder="Buscar cadernos..."
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
                  href={`/hub/teacher/my-students/${student?.id}/notebook/${notebook.id}`}
                  className="block flex-1"
                >
                  <h3 className="font-bold text-lg text-title">
                    {notebook.title}
                  </h3>
                  <div className="text-xs text-paragraph opacity-70">
                    {notebook.createdAt &&
                      new Date(notebook.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </Link>
                {/* Action buttons - only show for teachers */}

                <div className="flex items-center gap-2">
                  <PaperclipIcon
                    height={24}
                    className="w-5 h-5 hover:text-danger/70 duration-300 easy-in-out transition-all cursor-pointer"
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
              withSearch: `Nenhum caderno encontrado para "${searchQuery}"`,
              withoutSearch: "Nenhum caderno criado ainda",
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
              <ModalTitle>Criar Novo Caderno</ModalTitle>
              <ModalClose />
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-title mb-1">
                  Título *
                </label>
                <ModalInput
                  type="text"
                  value={newNotebookTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewNotebookTitle(e.target.value)
                  }
                  placeholder="Digite o título do caderno"
                />
              </div>
              <ModalFooter>
                <ModalSecondaryButton onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={handleCreateNotebook}
                  disabled={!newNotebookTitle.trim()}
                >
                  Criar
                </ModalPrimaryButton>
              </ModalFooter>
            </div>
          </ModalContent>
        </Modal>
      )}
    </SubContainer>
  );
}
