"use client";
import { Workbook } from "@/types/notebooks/notebooks";
import { useEffect, useState, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface EditWorkbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: Workbook | null;
  onSave: (
    id: string,
    newLevel: string,
    newGuidelines: string,
    newCoverFile?: File
  ) => Promise<void>;
  levelOptions: Workbook["level"][];
  markdownComponents: any; // Still pass this prop as it's used in the modal
}

export default function EditWorkbookModal({
  isOpen,
  onClose,
  workbook,
  onSave,
  levelOptions,
  markdownComponents, // Receive the components here
}: EditWorkbookModalProps) {
  const [currentLevel, setCurrentLevel] = useState<string>("");
  const [currentGuidelines, setCurrentGuidelines] = useState<string>("");
  const [currentCoverFile, setCurrentCoverFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (workbook) {
      setCurrentLevel(workbook.level);
      setCurrentGuidelines(workbook.guidelines || "");
      setCurrentCoverFile(null);
    }
  }, [workbook]);

  if (!isOpen || !workbook) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(
        workbook.id,
        currentLevel,
        currentGuidelines,
        currentCoverFile || undefined
      );
      onClose();
    } catch (error) {
      console.error("Error saving workbook:", error);
      // Consider adding user-facing error feedback here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-300">
              {workbook.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fechar modal"
          >
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <form
            onSubmit={handleSubmit}
            id="editWorkbookForm"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6 md:col-span-1">
                <div>
                  <label
                    htmlFor="level"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nível
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    disabled={isSaving}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {levelOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cover"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Capa da Apostila
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      id="cover"
                      name="cover"
                      accept="image/*"
                      onChange={(e) =>
                        setCurrentCoverFile(
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      disabled={isSaving}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400
                        hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                        transition-colors duration-200 cursor-pointer"
                    />
                    {currentCoverFile && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nova capa:{" "}
                        <span className="font-medium">
                          {currentCoverFile.name}
                        </span>
                      </p>
                    )}
                    {workbook.coverURL && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Capa atual:
                        </p>
                        <img
                          src={workbook.coverURL}
                          alt="Capa atual"
                          className="w-full max-w-[150px] h-auto rounded-lg border dark:border-gray-600 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Markdown Editor/Preview */}
              <div className="md:col-span-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diretrizes
                  </label>
                  <div className="flex border-b dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className={`px-4 py-2 text-sm font-medium ${activeTab === "edit" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`px-4 py-2 text-sm font-medium ${activeTab === "preview" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                      Pré-visualização
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                  {activeTab === "edit" ? (
                    <textarea
                      id="guidelines"
                      name="guidelines"
                      value={currentGuidelines}
                      onChange={(e) => setCurrentGuidelines(e.target.value)}
                      disabled={isSaving}
                      placeholder="Insira as diretrizes da apostila em formato Markdown..."
                      className="w-full h-64 p-4 border-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <div className="h-64 p-4 overflow-auto bg-gray-50 dark:bg-gray-700/30 prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={markdownComponents}
                        remarkPlugins={[remarkGfm]}
                      >
                        {currentGuidelines || "*Nada para pré-visualizar*"}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Dica: Use Markdown para formatar suas diretrizes (títulos,
                  listas, links, etc.)
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editWorkbookForm"
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
