"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Trash2, Image as ImageIcon, Mic, 
  Layers, FileQuestion, List, Settings, Save, X, ExternalLink 
} from "lucide-react";

import { db } from "@/lib/firebase/config";
import { handleImageUpload, deleteImageByUrl, handleAudioUpload } from "@/lib/tiptap-utils";
import { useSession } from "next-auth/react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc } from "firebase/firestore";

// --- Tipagens ---
type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor };
type QuestionType = "fill_in" | "multiple_choice" | "true_false";
type Option = { id: string; text: string; correct?: boolean };
type QuestionRecord = {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];
  answer?: string | boolean;
  imageUrl?: string;
  audioUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
};

// --- Utilitários ---
function uid() { return Math.random().toString(36).slice(2, 10); }
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const AUDIO_MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/webm"];

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be";
  } catch { return false; }
}

async function uploadFileAdmin(file: File, kind: "image" | "audio"): Promise<string | undefined> {
  try {
    if (kind === "image" && file.type?.startsWith("image/")) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return undefined;
      if (file.size > IMAGE_MAX_BYTES) return undefined;
      return await handleImageUpload(file);
    }
    if (kind === "audio" && file.type?.startsWith("audio/")) {
      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) return undefined;
      if (file.size > AUDIO_MAX_BYTES) return undefined;
      return await handleAudioUpload(file);
    }
    return undefined;
  } catch { return undefined; }
}

function useQuestionsLibrary() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  useEffect(() => {
    setLoading(true);
    const col = collection(db, "tiptap", "extensions", "questions");
    const q = query(col);
    const unsub = onSnapshot(q, (snap) => {
      const list: QuestionRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          type: data.type,
          text: data.text,
          options: data.options || [],
          answer: data.answer,
          imageUrl: data.imageUrl,
          audioUrl: data.audioUrl,
          createdBy: data.createdBy || "",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
        });
      });
      setQuestions(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { loading, questions };
}

export const QuestionsToolModal: React.FC<BaseModalProps> = ({ isOpen, onClose, editor }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  
  const [mode, setMode] = useState<"new_question" | "existing_question" | "new_deck" | "manage_questions">("new_question");
  
  // Estados do formulário
  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<Option[]>([
    { id: uid(), text: "", correct: false },
    { id: uid(), text: "", correct: false },
  ]);
  const [answerTF, setAnswerTF] = useState<boolean>(true);
  const [answerFill, setAnswerFill] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrlInput, setAudioUrlInput] = useState<string>("");
  
  // Estados de controle
  const [saving, setSaving] = useState(false);
  const { loading, questions } = useQuestionsLibrary();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckQuestionIds, setDeckQuestionIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estados para edição (mídia existente)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | undefined>(undefined);

  // Reset states
  useEffect(() => {
    if (!isOpen) {
      setMode("new_question");
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setType("multiple_choice");
    setText("");
    setOptions([{ id: uid(), text: "", correct: false }, { id: uid(), text: "", correct: false }]);
    setAnswerTF(true);
    setAnswerFill("");
    setImageFile(null);
    setAudioFile(null);
    setAudioUrlInput("");
    setSelectedQuestionId("");
    setDeckTitle("");
    setDeckQuestionIds([]);
    setEditingId(null);
    setOriginalImageUrl(undefined);
    setOriginalAudioUrl(undefined);
  };

  const insertQuestionsNode = useCallback((attrs: { mode: "question" | "deck"; question?: any; deck?: any }) => {
      const qStr = attrs.question ? JSON.stringify(attrs.question).replace(/'/g, "&#39;") : "";
      const dStr = attrs.deck ? JSON.stringify(attrs.deck).replace(/'/g, "&#39;") : "";
      const html = attrs.mode === "question"
          ? `<questions-node mode="question" question='${qStr}'></questions-node>`
          : `<questions-node mode="deck" deck='${dStr}'></questions-node>`;
      
      try {
        editor.chain().focus().insertContent(html).run();
        return true;
      } catch { return false; }
    }, [editor]);

  const canSaveQuestion = useMemo(() => {
    if (!text.trim()) return false;
    if (type === "multiple_choice") {
      const filled = options.filter((o) => o.text.trim().length > 0);
      const hasCorrect = filled.some((o) => !!o.correct);
      return filled.length >= 2 && hasCorrect;
    }
    if (type === "true_false") return typeof answerTF === "boolean";
    if (type === "fill_in") return !!answerFill.trim();
    return false;
  }, [text, type, options, answerTF, answerFill]);

  // Handlers Options
  const handleAddOption = () => setOptions((prev) => [...prev, { id: uid(), text: "", correct: false }]);
  const handleUpdateOption = (id: string, next: Partial<Option>) => setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...next } : o)));
  const handleRemoveOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));

  // Save New Question
  const handleSaveQuestion = useCallback(async () => {
    if (!userId || !canSaveQuestion) return;
    setSaving(true);
    try {
      const col = collection(db, "tiptap", "extensions", "questions");
      const imageUrl = imageFile ? await uploadFileAdmin(imageFile, "image") : undefined;
      let audioUrl: string | undefined = undefined;
      if (audioFile) audioUrl = await uploadFileAdmin(audioFile, "audio");
      else if (audioUrlInput && isValidYouTubeUrl(audioUrlInput)) audioUrl = audioUrlInput.trim();

      const payload: any = {
        type,
        text: text.trim(),
        options: type === "multiple_choice" ? options.filter((o) => o.text.trim().length > 0) : [],
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      if (type === "true_false") payload.answer = answerTF;
      else if (type === "fill_in") payload.answer = answerFill.trim();
      
      if (imageUrl) payload.imageUrl = imageUrl;
      if (audioUrl) payload.audioUrl = audioUrl;

      const created = await addDoc(col, payload);
      const nodePayload = { ...payload, id: created.id };
      insertQuestionsNode({ mode: "question", question: nodePayload, deck: null });
      onClose();
    } finally { setSaving(false); }
  }, [userId, canSaveQuestion, type, text, options, imageFile, audioFile, audioUrlInput, answerTF, answerFill, insertQuestionsNode, onClose]);

  // Start Edit
  const beginEdit = (q: QuestionRecord) => {
    setEditingId(q.id);
    setMode("manage_questions");
    setType(q.type);
    setText(q.text);
    setOptions(q.type === "multiple_choice" ? (q.options || []).map(o => ({ id: o.id || uid(), text: o.text, correct: !!o.correct })) : [{ id: uid(), text: "", correct: false }, { id: uid(), text: "", correct: false }]);
    setAnswerTF(q.type === "true_false" ? (q.answer as boolean) : true);
    setAnswerFill(q.type === "fill_in" ? String(q.answer || "") : "");
    
    // Mídia
    setImageFile(null);
    setAudioFile(null);
    setAudioUrlInput(q.audioUrl && isValidYouTubeUrl(q.audioUrl) ? q.audioUrl : "");
    
    // Armazena originais para preview e deleção
    setOriginalImageUrl(q.imageUrl);
    setOriginalAudioUrl(q.audioUrl && !isValidYouTubeUrl(q.audioUrl) ? q.audioUrl : undefined);
  };

  // Update Existing Question
  const handleUpdateQuestion = useCallback(async () => {
    if (!editingId || !userId || !text.trim()) return;
    setSaving(true);
    try {
      const docRef = doc(db, "tiptap", "extensions", "questions", editingId);
      const updates: any = { type, text: text.trim(), updatedAt: Timestamp.fromDate(new Date()) };
      
      if (type === "multiple_choice") {
        updates.options = options.filter((o) => o.text.trim().length > 0);
        updates.answer = null; 
      } else if (type === "true_false") {
        updates.answer = answerTF;
        updates.options = [];
      } else if (type === "fill_in") {
        updates.answer = answerFill.trim();
        updates.options = [];
      }

      // Handle Image
      if (imageFile) {
        const nextImageUrl = await uploadFileAdmin(imageFile, "image");
        if (nextImageUrl) {
          updates.imageUrl = nextImageUrl;
          if (originalImageUrl && originalImageUrl !== nextImageUrl) await deleteImageByUrl(originalImageUrl);
        }
      }

      // Handle Audio
      if (audioFile) {
        const nextAudioUrl = await uploadFileAdmin(audioFile, "audio");
        if (nextAudioUrl) {
          updates.audioUrl = nextAudioUrl;
          if (originalAudioUrl && originalAudioUrl !== nextAudioUrl) await deleteImageByUrl(originalAudioUrl);
        }
      } else if (audioUrlInput && isValidYouTubeUrl(audioUrlInput)) {
        updates.audioUrl = audioUrlInput.trim();
      }

      await updateDoc(docRef, updates);
      setEditingId(null);
      setMode("manage_questions");
      resetForm(); // Limpa form após salvar edição
    } finally { setSaving(false); }
  }, [editingId, userId, type, text, options, answerTF, answerFill, imageFile, audioFile, audioUrlInput, originalImageUrl, originalAudioUrl]);

  // Delete
  const handleDeleteQuestion = useCallback(async (q: QuestionRecord) => {
    if (!q?.id) return;
    try {
      if (q.imageUrl) await deleteImageByUrl(q.imageUrl);
      if (q.audioUrl && !isValidYouTubeUrl(q.audioUrl)) await deleteImageByUrl(q.audioUrl);
      await deleteDoc(doc(db, "tiptap", "extensions", "questions", q.id));
    } catch {}
  }, []);

  // Insert Existing
  const handleInsertExistingQuestion = useCallback(() => {
    if (!selectedQuestionId) return;
    const q = questions.find((x) => x.id === selectedQuestionId);
    if (!q) return;
    insertQuestionsNode({ mode: "question", question: q, deck: null });
    onClose();
  }, [selectedQuestionId, questions, insertQuestionsNode, onClose]);

  // Save Deck
  const handleSaveDeck = useCallback(async () => {
    if (!userId || !deckTitle.trim() || deckQuestionIds.length === 0) return;
    setSaving(true);
    try {
      const colDecks = collection(db, "tiptap", "extensions", "questions_decks");
      const created = await addDoc(colDecks, {
        title: deckTitle.trim(),
        questionIds: deckQuestionIds,
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      insertQuestionsNode({
        mode: "deck",
        deck: { id: created.id, title: deckTitle.trim(), questionIds: deckQuestionIds },
        question: null,
      });
      onClose();
    } finally { setSaving(false); }
  }, [userId, deckTitle, deckQuestionIds, insertQuestionsNode, onClose]);

  // --- COMPONENTE DE FORMULÁRIO (Reutilizável) ---
  const renderQuestionForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {/* Coluna Esquerda: Configurações Básicas */}
      <div className="md:col-span-2 space-y-4 overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label>Enunciado da Pergunta</Label>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Ex: Qual é a capital da França?" 
            className="min-h-[100px] text-base"
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de Resposta</Label>
          <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
              <SelectItem value="true_false">Verdadeiro ou Falso</SelectItem>
              <SelectItem value="fill_in">Completar (Preencher lacuna)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
          <Label className="text-primary">Configuração da Resposta</Label>
          
          {type === "multiple_choice" && (
            <div className="space-y-3">
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-primary cursor-pointer"
                    checked={!!opt.correct}
                    onChange={(e) => handleUpdateOption(opt.id, { correct: e.target.checked })}
                    title="Marcar como correta"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => handleUpdateOption(opt.id, { text: e.target.value })}
                    placeholder="Opção de resposta"
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveOption(opt.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddOption} className="mt-2">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Opção
              </Button>
            </div>
          )}

          {type === "true_false" && (
            <div className="flex gap-4">
              <Button 
                variant={answerTF === true ? "primary" : "outline"} 
                onClick={() => setAnswerTF(true)}
                className="w-32"
              >
                Verdadeiro
              </Button>
              <Button 
                variant={answerTF === false ? "primary" : "outline"} 
                onClick={() => setAnswerTF(false)}
                className="w-32"
              >
                Falso
              </Button>
            </div>
          )}

          {type === "fill_in" && (
            <div className="space-y-2">
              <Input value={answerFill} onChange={(e) => setAnswerFill(e.target.value)} placeholder="Resposta correta exata" />
              <p className="text-xs text-muted-foreground">O aluno precisará digitar exatamente este texto.</p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Mídia */}
      <div className="space-y-4 overflow-y-auto pr-1">
        <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
          <h3 className="font-medium text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Imagem</h3>
          
          {/* Preview da imagem existente ao editar */}
          {editingId && originalImageUrl && !imageFile && (
             <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-background group">
                <img src={originalImageUrl} alt="Atual" className="object-cover w-full h-full opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium">
                   Imagem Atual
                </div>
             </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">
               {editingId && originalImageUrl ? "Trocar Imagem" : "Upload de Imagem"}
            </Label>
            <Input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= IMAGE_MAX_BYTES) setImageFile(f);
                else e.currentTarget.value = "";
              }}
              className="text-xs cursor-pointer file:cursor-pointer file:text-primary file:font-medium"
            />
            {imageFile && <p className="text-xs text-green-600 truncate flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {imageFile.name}</p>}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
          <h3 className="font-medium text-sm flex items-center gap-2"><Mic className="w-4 h-4" /> Áudio / Vídeo</h3>
          
          {/* Preview de áudio existente ao editar */}
          {editingId && originalAudioUrl && !audioFile && !audioUrlInput && (
             <div className="flex items-center gap-2 p-2 bg-background border rounded text-xs text-muted-foreground mb-2">
                <Mic className="w-3 h-3" /> Áudio atual configurado
                <a href={originalAudioUrl} target="_blank" rel="noopener noreferrer" className="ml-auto hover:text-primary"><ExternalLink className="w-3 h-3"/></a>
             </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Upload de Arquivo</Label>
            <Input
              type="file"
              accept={ALLOWED_AUDIO_TYPES.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && ALLOWED_AUDIO_TYPES.includes(f.type) && f.size <= AUDIO_MAX_BYTES) {
                   setAudioFile(f);
                   setAudioUrlInput(""); // Limpa URL se fizer upload
                } else e.currentTarget.value = "";
              }}
              className="text-xs cursor-pointer file:cursor-pointer file:text-primary file:font-medium"
            />
            {audioFile && <p className="text-xs text-green-600 truncate flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {audioFile.name}</p>}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted/30 px-2 text-muted-foreground">OU</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Link YouTube</Label>
            <Input
              type="url"
              placeholder="https://youtube.com/..."
              value={audioUrlInput}
              onChange={(e) => {
                 setAudioUrlInput(e.target.value);
                 if(e.target.value) setAudioFile(null); // Limpa file se usar URL
              }}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="min-w-[80vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileQuestion className="w-5 h-5" /> Ferramenta de Questões
          </DialogTitle>
          <DialogDescription>
            Crie perguntas interativas, organize decks ou gerencie sua biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="flex-1 flex flex-col h-full">
            <div className="px-6 border-b shrink-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="new_question" className="gap-2"><Plus className="w-4 h-4" /> Criar</TabsTrigger>
                <TabsTrigger value="existing_question" className="gap-2"><List className="w-4 h-4" /> Biblioteca</TabsTrigger>
                <TabsTrigger value="new_deck" className="gap-2"><Layers className="w-4 h-4" /> Deck</TabsTrigger>
                <TabsTrigger value="manage_questions" className="gap-2"><Settings className="w-4 h-4" /> Gerenciar</TabsTrigger>
              </TabsList>
            </div>

            {/* --- ABA CRIAR NOVA PERGUNTA --- */}
            <TabsContent value="new_question" className="flex-1 overflow-hidden p-6">
               {renderQuestionForm()}
            </TabsContent>

            {/* --- ABA BIBLIOTECA --- */}
            <TabsContent value="existing_question" className="flex-1 overflow-hidden flex flex-col p-6">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap">Buscar Pergunta:</Label>
                  <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma pergunta da lista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((q) => (
                        <SelectItem key={q.id} value={q.id} className="truncate max-w-[500px]">
                          {q.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedQuestionId && (
                  <div className="p-4 border rounded-lg bg-muted/20 mt-4 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Pré-visualização:</h4>
                    {(() => {
                      const q = questions.find(x => x.id === selectedQuestionId);
                      return q ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                             <Badge>{q.type}</Badge>
                             {q.imageUrl && <Badge variant="outline">Tem Imagem</Badge>}
                          </div>
                          <p className="text-lg">{q.text}</p>
                          {/* Preview simples das opções se necessário */}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- ABA NOVO DECK --- */}
            <TabsContent value="new_deck" className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
              <div className="space-y-2 shrink-0">
                <Label>Título do Deck</Label>
                <Input value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} placeholder="Ex: Revisão Módulo 1" />
              </div>
              
              <div className="flex-1 flex flex-col min-h-0 border rounded-md overflow-hidden">
                <div className="p-3 bg-muted border-b font-medium text-sm">Selecione as Perguntas ({deckQuestionIds.length})</div>
                <div className="overflow-y-auto p-2 space-y-1 bg-background flex-1">
                  {questions.length === 0 && <p className="p-4 text-center text-muted-foreground text-sm">Nenhuma pergunta disponível.</p>}
                  {questions.map((q) => {
                    const checked = deckQuestionIds.includes(q.id);
                    return (
                      <div key={q.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors cursor-pointer ${checked ? 'bg-primary/5 border-primary/20 border' : 'hover:bg-muted/50 border border-transparent'}`} onClick={() => {
                          const next = checked
                            ? deckQuestionIds.filter((x) => x !== q.id)
                            : [...deckQuestionIds, q.id];
                          setDeckQuestionIds(next);
                      }}>
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 accent-primary pointer-events-none"
                          checked={checked}
                          readOnly
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">{q.text}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5">{q.type}</Badge>
                            {q.imageUrl && <Badge variant="secondary" className="text-[10px] h-5">Img</Badge>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* --- ABA GERENCIAR --- */}
            <TabsContent value="manage_questions" className="flex-1 overflow-hidden flex flex-col p-6">
              {editingId ? (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                       <Settings className="w-4 h-4" /> Editando Pergunta
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); resetForm(); }}>
                      <X className="w-4 h-4 mr-1" /> Cancelar Edição
                    </Button>
                  </div>
                  
                  {/* Reusa o formulário completo para edição */}
                  <div className="flex-1 overflow-hidden">
                     {renderQuestionForm()}
                  </div>
                </div>
              ) : (
                /* MODO LISTA */
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {questions.map((q) => (
                    <div key={q.id} className="group border rounded-lg p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1 max-w-[70%]">
                        <div className="text-sm font-medium truncate">{q.text}</div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-normal">{q.type}</Badge>
                          {q.imageUrl && <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Img</span>}
                          {q.audioUrl && <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Audio</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" onClick={() => beginEdit(q)}>Editar</Button>
                        <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => handleDeleteQuestion(q)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && <p className="text-center text-muted-foreground mt-8">Nenhuma pergunta criada ainda.</p>}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          
          {mode === "new_question" && (
            <Button onClick={handleSaveQuestion} disabled={!canSaveQuestion || saving}>
              {saving ? "Salvando..." : "Salvar e Inserir"}
            </Button>
          )}
          
          {mode === "existing_question" && (
            <Button onClick={handleInsertExistingQuestion} disabled={!selectedQuestionId}>
              Inserir Selecionada
            </Button>
          )}
          
          {mode === "new_deck" && (
            <Button onClick={handleSaveDeck} disabled={!deckTitle.trim() || deckQuestionIds.length === 0 || saving}>
              {saving ? "Salvando..." : "Criar Deck"}
            </Button>
          )}

          {mode === "manage_questions" && editingId && (
             <Button onClick={handleUpdateQuestion} disabled={saving || !text.trim()}>
                {saving ? "Atualizando..." : "Salvar Alterações"}
             </Button>
          )}
          
          {mode === "manage_questions" && !editingId && (
            <Button onClick={() => setMode("new_question")} variant="secondary">
              Criar nova pergunta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionsToolModal;