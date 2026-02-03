import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  FileJson,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Lesson, QuizQuestion } from "@/types/quiz/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalClose,
} from "@/components/ui/modal";
import { Label } from "../ui/label";

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

export default function QuizForm({
  lesson,
  onUpdateQuiz,
  onBack,
}: {
  lesson: Lesson;
  onUpdateQuiz: (updatedQuiz: QuizQuestion[]) => Promise<void>;
  onBack: () => void;
}) {
  const t = useTranslations("CourseComponents.QuizForm");

  // Estado Local de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Dados do formulário
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  // Utilitários
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  // Confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, onConfirm: () => {} });

  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setActiveQuestionId(null);
    setIsEditing(false);
  };

  const startEdit = (q: QuizQuestion) => {
    setQuestionText(q.question);
    const opts = [...q.options];
    // Garante 4 campos visualmente
    while (opts.length < 4) opts.push("");
    setOptions(opts);
    setCorrectAnswer(q.correctAnswer);
    setActiveQuestionId(q.id);
    setIsEditing(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    // Se alterou a correta, reseta a seleção para evitar inconsistência
    if (correctAnswer === options[index] && value !== options[index]) {
      setCorrectAnswer("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledOptions = options.filter((o) => o.trim() !== "");

    if (!questionText.trim()) return toast.error(t("emptyQuestion"));
    if (filledOptions.length < 2) return toast.error(t("minOptions"));
    if (!correctAnswer || !filledOptions.includes(correctAnswer))
      return toast.error(t("invalidCorrectAnswer"));

    const newQuestionData: QuizQuestion = {
      id: activeQuestionId || generateUniqueId(),
      question: questionText,
      options: filledOptions,
      correctAnswer,
    };

    const currentQuiz = lesson.quiz || [];
    let updatedQuiz;

    if (activeQuestionId) {
      updatedQuiz = currentQuiz.map((q) =>
        q.id === activeQuestionId ? newQuestionData : q,
      );
    } else {
      updatedQuiz = [...currentQuiz, newQuestionData];
    }

    const toastId = toast.loading("Salvando questão...");
    try {
      await onUpdateQuiz(updatedQuiz);
      toast.success("Quiz atualizado!", { id: toastId });
      resetForm();
    } catch (err) {
      toast.error("Erro ao salvar", { id: toastId });
    }
  };

  const requestDelete = (questionId: string) => {
    setConfirmModal({
      isOpen: true,
      onConfirm: async () => {
        const updatedQuiz = (lesson.quiz || []).filter(
          (q) => q.id !== questionId,
        );
        await onUpdateQuiz(updatedQuiz);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        toast.success("Questão removida");
      },
    });
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("JSON deve ser um array");

      const newQuestions = parsed.map((item: any) => ({
        id: generateUniqueId(),
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer,
      }));

      await onUpdateQuiz([...(lesson.quiz || []), ...newQuestions]);
      toast.success(`${newQuestions.length} questões importadas`);
      setIsImporting(false);
      setJsonInput("");
    } catch (e) {
      toast.error("JSON Inválido");
    }
  };

  return (
    <div className="space-y-8">
      {/* Lista de Questões Existentes (Sidebar visual ou Lista acima) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Questões ({lesson.quiz?.length || 0})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImporting(!isImporting)}
            >
              <FileJson className="w-4 h-4 mr-2" /> JSON
            </Button>
            {!isEditing && (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            )}
          </div>
        </div>

        {isImporting && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"question": "...", "options": [...], "correctAnswer": "..."}]'
              className="font-mono text-xs mb-2"
            />
            <Button size="sm" onClick={handleImport}>
              Importar
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {(lesson.quiz || []).map((q, idx) => (
            <div
              key={q.id}
              className={`flex justify-between items-center p-4 border rounded-xl transition-all ${
                activeQuestionId === q.id
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-gray-100 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{q.question}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {q.options.length} opções • Resposta: {q.correctAnswer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startEdit(q)}
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:text-red-500"
                  onClick={() => requestDelete(q.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(lesson.quiz || []).length === 0 && !isEditing && (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhuma questão cadastrada para esta lição.</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Edição Inline */}
      {isEditing && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">
              {activeQuestionId ? "Editar Questão" : "Nova Questão"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Cancelar
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label>Enunciado</Label>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ex: Qual é a capital da França?"
                className="bg-white dark:bg-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-xs text-gray-500">Opção {i + 1}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Opção ${i + 1}`}
                      className={`bg-white dark:bg-gray-900 ${correctAnswer === opt && opt !== "" ? "border-green-500 ring-1 ring-green-500" : ""}`}
                    />
                    {opt.trim() !== "" && (
                      <button
                        type="button"
                        onClick={() => setCorrectAnswer(opt)}
                        title="Marcar como correta"
                        className={`p-2 rounded-full transition-colors ${correctAnswer === opt ? "text-green-500 bg-green-50" : "text-gray-300 hover:text-gray-400"}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="submit" className="w-full md:w-auto">
                {activeQuestionId ? "Salvar Alterações" : "Adicionar Questão"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      <Modal
        open={confirmModal.isOpen}
        onOpenChange={(open) =>
          setConfirmModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Excluir Questão</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <div className="py-4 text-gray-600">
            Tem certeza que deseja remover esta questão? Esta ação não pode ser
            desfeita.
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <ModalSecondaryButton
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton
              onClick={confirmModal.onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </ModalPrimaryButton>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
