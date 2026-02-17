"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  Search,
  Headphones,
  ListFilter,
  Languages,
  Cloud,
  HardDrive,
  CloudUpload,
  RefreshCw,
  Eye,
  Loader2,
  Download,
  Plus,
  Pencil,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Imports
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"; // Certifique-se de ter o componente Dialog
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Imports Locais (Fallback/Seed)
import enQuestionsData from "../../../../../placement/en-questions.json";
import ptQuestionsData from "../../../../../placement/pt-questions.json";

// Tipagens
type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type DataSource = "local" | "firebase";

interface Question {
  id: string;
  text: string;
  audioUrl?: string;
  options: string[];
  correctOption: string;
  level: Level;
  topics: string[];
  lang?: "en" | "pt";
}

const EMPTY_QUESTION: Question = {
  id: "",
  text: "",
  options: ["", "", "", ""],
  correctOption: "",
  level: "A1",
  topics: [],
  audioUrl: "",
};

export default function ContentCuratorPage() {
  const [activeLang, setActiveLang] = useState<"en" | "pt">("en");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Estados de Edição
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filtros de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLevel, setActiveLevel] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // --- 1. Lógica de Carregamento ---
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "placement_questions"),
        where("lang", "==", activeLang),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const firebaseData = querySnapshot.docs.map(
          (doc) => doc.data() as Question,
        );
        // Ordena por ID para ficar bonito na lista
        firebaseData.sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true }),
        );
        setQuestions(firebaseData);
        setDataSource("firebase");
      } else {
        const localData =
          activeLang === "en" ? enQuestionsData : ptQuestionsData;
        setQuestions(localData as Question[]);
        setDataSource("local");
      }
    } catch (error) {
      console.error("Erro ao conectar no Firebase:", error);
      const localData = activeLang === "en" ? enQuestionsData : ptQuestionsData;
      setQuestions(localData as Question[]);
      setDataSource("local");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLang]);

  // --- 2. Upload (JSON Local -> Firebase) ---
  const handleSyncToFirebase = async () => {
    if (
      !confirm(
        "Isso irá sobrescrever o banco de dados com os arquivos JSON locais. Continuar?",
      )
    )
      return;

    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      enQuestionsData.forEach((q) => {
        const docRef = doc(db, "placement_questions", `en_${q.id}`);
        batch.set(docRef, { ...q, lang: "en" }, { merge: true });
      });

      ptQuestionsData.forEach((q) => {
        const docRef = doc(db, "placement_questions", `pt_${q.id}`);
        batch.set(docRef, { ...q, lang: "pt" }, { merge: true });
      });

      await batch.commit();
      toast.success("Banco de dados sincronizado com sucesso!");
      await fetchQuestions();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast.error("Erro ao sincronizar com Firebase.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- 3. Download (Firebase -> JSON Local) ---
  const handleDownloadBackup = async () => {
    if (dataSource === "local") {
      toast.error("Você já está visualizando os arquivos locais.");
      return;
    }

    try {
      // Baixa TODOS do idioma atual, não apenas os filtrados na tela
      const q = query(
        collection(db, "placement_questions"),
        where("lang", "==", activeLang),
      );
      const querySnapshot = await getDocs(q);
      const rawData = querySnapshot.docs.map((doc) => doc.data() as Question);

      // Limpeza de dados para o JSON ficar igual ao original
      // Remove o campo 'lang' (pois o arquivo já define a lingua) e garante ordenação
      const cleanData = rawData
        .map(({ lang, ...rest }) => rest)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      const jsonString = JSON.stringify(cleanData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeLang}-questions.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Download de ${cleanData.length} questões iniciado.`);
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      toast.error("Erro ao baixar arquivo.");
    }
  };

  // --- 4. Salvar Questão (Create/Update) ---
  const handleSaveQuestion = async (q: Question) => {
    try {
      // ID Composto para o Firestore (ex: en_q_01)
      const firestoreId = `${activeLang}_${q.id}`;

      // Adiciona o campo lang
      const payload = { ...q, lang: activeLang };

      await setDoc(doc(db, "placement_questions", firestoreId), payload);

      toast.success(
        editingQuestion ? "Questão atualizada!" : "Questão criada!",
      );
      setIsDialogOpen(false);
      setEditingQuestion(null);
      await fetchQuestions(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar questão. Verifique as permissões.");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) return;
    try {
      const firestoreId = `${activeLang}_${qId}`;
      await deleteDoc(doc(db, "placement_questions", firestoreId));
      toast.success("Questão removida.");
      await fetchQuestions();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  // --- 5. Handlers de UI ---
  const openNewQuestionModal = () => {
    // Tenta sugerir um ID novo (ex: q_61) baseado no ultimo
    let newId = "q_01";
    if (questions.length > 0) {
      const lastId = questions[questions.length - 1].id; // assume ordenado
      const numberPart = parseInt(lastId.replace("q_", "")) || 0;
      newId = `q_${String(numberPart + 1).padStart(2, "0")}`; // q_31
    }

    setEditingQuestion({ ...EMPTY_QUESTION, id: newId });
    setIsDialogOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setIsDialogOpen(true);
  };

  // --- Filtros Combinados ---
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topics.some((t) =>
          t.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesLevel = activeLevel === "all" || q.level === activeLevel;
      return matchesSearch && matchesLevel;
    });
  }, [questions, searchTerm, activeLevel]);

  return (
    <div className="container-padding space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Curadoria de Testes
            </h1>
            <Badge
              variant="outline"
              className={`gap-1.5 ${
                dataSource === "firebase"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {dataSource === "firebase" ? (
                <Cloud className="w-3 h-3" />
              ) : (
                <HardDrive className="w-3 h-3" />
              )}
              {dataSource === "firebase"
                ? "Live Data (Firebase)"
                : "Local JSON"}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl">
            Adicione, edite e baixe questões do teste de nivelamento.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Grupo de Ações */}
          <div className="flex items-center bg-white p-1 rounded-lg border shadow-sm dark:bg-slate-800 dark:border-slate-700">
            {dataSource === "firebase" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadBackup}
                className="text-slate-600 hover:text-primary gap-2"
                title="Baixar JSON atualizado para atualizar o projeto local"
              >
                <Download className="w-4 h-4" />
                Baixar Backup
              </Button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncToFirebase}
              disabled={isSyncing}
              className="text-slate-600 hover:text-amber-600 gap-2"
              title="CUIDADO: Sobrescreve o banco com os dados locais"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              Resetar DB
            </Button>
          </div>

          <Button onClick={openNewQuestionModal} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Nova Questão
          </Button>

          {/* Seletor de Língua */}
          <div className="flex bg-white p-1 rounded-lg border shadow-sm dark:bg-slate-800 dark:border-slate-700 ml-2">
            <Button
              variant={activeLang === "en" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveLang("en")}
              className="gap-2"
            >
              <Languages className="w-4 h-4" /> EN
            </Button>
            <Button
              variant={activeLang === "pt" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveLang("pt")}
              className="gap-2"
            >
              PT
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar ID, texto ou gramática..."
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="md:col-span-7 overflow-x-auto pb-2 md:pb-0">
          <Tabs
            value={activeLevel}
            onValueChange={setActiveLevel}
            className="w-full min-w-[400px]"
          >
            <TabsList className="w-full grid grid-cols-7 bg-slate-100/50 p-1">
              <TabsTrigger value="all" className="text-xs font-semibold">
                Todos
              </TabsTrigger>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                <TabsTrigger
                  key={lvl}
                  value={lvl}
                  className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {lvl}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
          <p className="text-slate-400 animate-pulse">Buscando questões...</p>
        </div>
      ) : (
        /* Grid de Questões */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((q) => (
              <QuestionReviewCard
                key={`${activeLang}-${q.id}`}
                question={q}
                isAudioPlaying={playingId === q.id}
                onToggleAudio={() =>
                  setPlayingId(playingId === q.id ? null : q.id)
                }
                onEdit={() => openEditModal(q)}
                onDelete={() => handleDeleteQuestion(q.id)}
                readOnly={dataSource === "local"}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Edição */}
      <QuestionEditorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        questionData={editingQuestion}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}

// --- Componentes Auxiliares ---

function QuestionReviewCard({
  question,
  isAudioPlaying,
  onToggleAudio,
  onEdit,
  onDelete,
  readOnly,
}: {
  question: Question;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly: boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isAudioPlaying) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isAudioPlaying]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group h-full border-slate-200 hover:border-primary/40 hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-800 relative">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full ${getLevelColor(
                  question.level,
                )}`}
              />
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-slate-400 bg-slate-50 border-slate-100"
              >
                {question.id}
              </Badge>
              <Badge
                className={`${getLevelColor(
                  question.level,
                )} text-white border-none hover:opacity-90`}
              >
                {question.level}
              </Badge>
            </div>

            {/* Botões de Ação do Card */}
            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {!readOnly && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    onClick={onEdit}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </>
              )}
              {/* Fallback visual se for readOnly */}
              {readOnly && <Eye className="w-4 h-4 text-slate-300" />}
            </div>
          </div>

          <CardTitle className="text-lg font-bold leading-snug text-slate-800 dark:text-slate-100 pr-8">
            {renderQuestionText(question.text)}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {question.audioUrl && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <audio
                ref={audioRef}
                src={question.audioUrl}
                onEnded={onToggleAudio}
                preload="none"
              />
              <Button
                size="icon"
                variant={isAudioPlaying ? "glass" : "secondary"}
                className={`h-9 w-9 rounded-full shrink-0 shadow-sm transition-all ${
                  isAudioPlaying ? "animate-pulse ring-2 ring-primary/20" : ""
                }`}
                onClick={onToggleAudio}
              >
                {isAudioPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Audio
                </span>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isAudioPlaying ? "100%" : "0%" }}
                    transition={{
                      duration: isAudioPlaying ? 5 : 0,
                      ease: "linear",
                    }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correctOption;
              return (
                <div
                  key={i}
                  className={`relative flex items-center justify-between p-2.5 rounded-lg text-sm font-medium border transition-all ${
                    isCorrect
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
                      : "bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                        isCorrect
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          <div className="flex flex-wrap gap-2">
            {question.topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-tight dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuestionEditorDialog({
  isOpen,
  onClose,
  questionData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  questionData: Question | null;
  onSave: (q: Question) => void;
}) {
  // Estado local do formulário
  const [formData, setFormData] = useState<Question>(EMPTY_QUESTION);

  useEffect(() => {
    if (questionData) {
      setFormData(questionData);
    }
  }, [questionData]);

  const handleChange = (field: keyof Question, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleTopicsChange = (str: string) => {
    // Separa por vírgula e limpa espaços
    const topics = str
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    setFormData((prev) => ({ ...prev, topics }));
  };

  if (!questionData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Questão ({formData.id})</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo. O ID deve ser único para o idioma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
              <Label>ID (ex: q_01)</Label>
              <Input
                value={formData.id}
                onChange={(e) => handleChange("id", e.target.value)}
              />
            </div>
            <div className="col-span-1 space-y-2">
              <Label>Nível</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.level}
                onChange={(e) => handleChange("level", e.target.value)}
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Tópicos (sep. vírgula)</Label>
              <Input
                placeholder="grammar, past-simple"
                value={formData.topics.join(", ")}
                onChange={(e) => handleTopicsChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Enunciado (Use ____ para lacunas)</Label>
            <Textarea
              value={formData.text}
              onChange={(e) => handleChange("text", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>URL do Áudio (Opcional)</Label>
            <Input
              placeholder="https://..."
              value={formData.audioUrl || ""}
              onChange={(e) => handleChange("audioUrl", e.target.value)}
            />
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
            <Label className="text-slate-500 font-bold uppercase text-xs">
              Opções de Resposta
            </Label>
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge variant="outline" className="w-8 justify-center">
                  {String.fromCharCode(65 + idx)}
                </Badge>
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className={
                    opt === formData.correctOption
                      ? "border-emerald-500 ring-1 ring-emerald-500/20"
                      : ""
                  }
                />
                <Button
                  size="sm"
                  variant={opt === formData.correctOption ? "glass" : "ghost"}
                  onClick={() => handleChange("correctOption", opt)}
                  className={
                    opt === formData.correctOption
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "text-slate-400"
                  }
                  title="Marcar como correta"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {/* Aviso se a correta não bater com o texto das opções */}
            {formData.correctOption &&
              !formData.options.includes(formData.correctOption) && (
                <p className="text-xs text-red-500 font-medium">
                  Atenção: A resposta correta deve ser idêntica a uma das
                  opções.
                </p>
              )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(formData)}>
            <Save className="w-4 h-4 mr-2" /> Salvar Questão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helpers
function renderQuestionText(text: string) {
  if (!text.includes("____")) return text;
  const parts = text.split("____");
  return (
    <span>
      {parts[0]}
      <span className="mx-1 px-2 py-0 bg-primary/10 border-b-2 border-primary text-primary inline-flex min-w-[40px] justify-center rounded-t-sm">
        ?
      </span>
      {parts[1]}
    </span>
  );
}

function getLevelColor(level: Level) {
  const colors: Record<Level, string> = {
    A1: "bg-emerald-500",
    A2: "bg-teal-500",
    B1: "bg-sky-500",
    B2: "bg-indigo-500",
    C1: "bg-purple-600",
    C2: "bg-rose-600",
  };
  return colors[level] || "bg-slate-500";
}
