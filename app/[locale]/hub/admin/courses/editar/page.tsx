"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Save, Plus, Edit2, Trash2, ChevronUp, ChevronDown, 
  Loader2, BookOpen, HelpCircle, ImageIcon, UploadCloud, 
  LayoutList, Clock, Globe, Shield 
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/ui/container"; // Assumindo container do shadcn
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose } from "@/components/ui/modal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Custom Components & Types
import LessonForm from "../components/Component/LessonForm";
import QuizForm from "../components/Component/QuizForm";
import SectionForm from "../components/Component/SectionForm";
import { Course, Section, Lesson, QuizQuestion } from "../components/types";

const generateUniqueId = () => `_${Math.random().toString(36).substr(2, 9)}`;

export default function EditCourseForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  // --- STATES (Mantidos Originais) ---
  const [course, setCourse] = useState<Partial<Course>>({});
  const [savingCourseDetails, setSavingCourseDetails] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [currentSectionIdForLesson, setCurrentSectionIdForLesson] = useState<string | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizQuestion, setEditingQuizQuestion] = useState<QuizQuestion | null>(null);
  const [currentLessonForQuiz, setCurrentLessonForQuiz] = useState<Lesson | null>(null);
  const [isDeleteSectionAlertOpen, setIsDeleteSectionAlertOpen] = useState(false);
  const [sectionIdToDelete, setSectionIdToDelete] = useState<string | null>(null);

  // --- DATA FETCHING (Mantido Original) ---
  const fetchCourseAndContent = useCallback(async () => {
    if (!courseId) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) {
        toast.error("Curso não encontrado.");
        router.push("/admin/cursos");
        return;
      }
      const data = await res.json();
      setCourse(data.course as Course);
      if ((data.course as Course).imageUrl) setImagePreview((data.course as Course).imageUrl);
      setSections(data.sections as Section[]);
    } catch (error) {
      console.error("Error fetching course data: ", error);
      toast.error("Falha ao carregar dados do curso.");
    } finally {
      setLoadingContent(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/");
      return;
    }
    if (!courseId) {
      toast.error("ID do curso não encontrado na URL.");
      router.push("/admin/cursos");
      return;
    }
    fetchCourseAndContent();
  }, [session, status, router, courseId, fetchCourseAndContent]);

  // --- HANDLERS (Mantidos Originais) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourse((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCourseDetails = async () => {
    if (!courseId || savingCourseDetails) return;
    setSavingCourseDetails(true);
    const toastId = toast.loading("Salvando detalhes do curso...");
    try {
      const form = new FormData();
      if (course.title) form.append("title", course.title);
      if (course.language) form.append("language", course.language);
      if (course.description) form.append("description", course.description);
      if (course.duration) form.append("duration", course.duration);
      if (course.role) form.append("role", course.role);
      if (imageFile) form.append("image", imageFile);
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: "PUT", body: form });
      if (!res.ok) throw new Error("Falha na API");
      if (imageFile) setImageFile(null);
      if (imageFile && imagePreview) setImagePreview(imagePreview);
      toast.success("Detalhes do curso atualizados!", { id: toastId });
    } catch (error) {
      console.error("Error updating course details: ", error);
      toast.error("Falha ao atualizar detalhes do curso.", { id: toastId });
    } finally {
      setSavingCourseDetails(false);
    }
  };

  const handleOpenSectionModal = (section: Section | null = null) => {
    setEditingSection(section);
    setIsSectionModalOpen(true);
  };
  const openDeleteSectionAlert = (id: string) => {
    setSectionIdToDelete(id);
    setIsDeleteSectionAlertOpen(true);
  };

  const handleSaveSection = async (sectionData: { title: string }) => {
    if (!courseId) return;
    const toastId = toast.loading(editingSection ? "Atualizando seção..." : "Criando seção...");
    try {
      if (editingSection) {
        const res = await fetch(`/api/admin/courses/${courseId}/sections/${editingSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sectionData.title }),
        });
        if (!res.ok) throw new Error("Falha na API");
      } else {
        const newOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 0;
        const res = await fetch(`/api/admin/courses/${courseId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sectionData.title, order: newOrder }),
        });
        if (!res.ok) throw new Error("Falha na API");
      }
      await fetchCourseAndContent();
      setIsSectionModalOpen(false);
      toast.success(editingSection ? "Seção atualizada!" : "Seção criada!", { id: toastId });
    } catch (error) {
      console.error("Error saving section: ", error);
      toast.error("Falha ao salvar seção.", { id: toastId });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!courseId) return;
    const toastId = toast.loading("Excluindo seção e seu conteúdo...");
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha na API");
      await fetchCourseAndContent();
      toast.success("Seção excluída com sucesso!", { id: toastId });
    } catch (error: any) {
      console.error("Erro ao excluir seção: ", error);
      toast.error(`Falha ao excluir seção: ${error.message || 'Erro desconhecido'}`, { id: toastId });
    }
  };

  const handleOpenLessonModal = (sectionId: string, lesson: Lesson | null = null) => {
    setCurrentSectionIdForLesson(sectionId);
    setEditingLesson(lesson);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (lessonData: Omit<Lesson, 'id' | 'order'>) => {
    if (!courseId || !currentSectionIdForLesson) return;
    const toastId = toast.loading(editingLesson ? "Atualizando lição..." : "Criando lição...");
    try {
      let savedLessonId: string | undefined;
      if (editingLesson) {
        const payload = {
          ...lessonData,
          contentBlocks: lessonData.contentBlocks.map(block => {
            if (block.type === 'text') return { ...block, content: block.content?.trim() || null };
            if (block.type === 'video') return { ...block, url: block.url?.trim() || null };
            return block;
          }),
        };
        const res = await fetch(`/api/admin/courses/${courseId}/sections/${currentSectionIdForLesson}/lessons/${editingLesson.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Falha na API");
        savedLessonId = editingLesson.id;
      } else {
        const currentSection = sections.find(s => s.id === currentSectionIdForLesson);
        const newOrder = currentSection && currentSection.lessons.length > 0 ? Math.max(...currentSection.lessons.map(l => l.order)) + 1 : 0;
        const newLessonData = { ...lessonData, order: newOrder, quiz: [], attachments: [] };
        const res = await fetch(`/api/admin/courses/${courseId}/sections/${currentSectionIdForLesson}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newLessonData),
        });
        if (!res.ok) throw new Error("Falha na API");
        const json = await res.json();
        savedLessonId = json.id;
        setEditingLesson({ ...newLessonData, id: savedLessonId! } as Lesson);
      }
      await fetchCourseAndContent();
      const updatedSection = sections.find(s => s.id === currentSectionIdForLesson);
      const latestLesson = updatedSection?.lessons?.find(l => l.id === (editingLesson?.id || savedLessonId));
      if (latestLesson) {
        setEditingLesson(latestLesson);
        setCurrentLessonForQuiz(latestLesson);
      }
      toast.success(editingLesson ? "Lição atualizada!" : "Lição criada!", { id: toastId });
    } catch (error) {
      console.error("Error saving lesson: ", error);
      toast.error("Falha ao salvar lição.", { id: toastId });
    }
  };

  const handleAttachmentsUpdated = (updatedLesson: Lesson) => {
    setEditingLesson(updatedLesson);
    setSections(prevSections => prevSections.map(section => {
      if (section.id === updatedLesson.sectionId) {
        return {
          ...section,
          lessons: section.lessons.map(lesson => lesson.id === updatedLesson.id ? updatedLesson : lesson)
        };
      }
      return section;
    }));
    if (currentLessonForQuiz?.id === updatedLesson.id) setCurrentLessonForQuiz(updatedLesson);
  };

  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!courseId || !confirm("Tem certeza que deseja excluir esta lição?")) return;
    const toastId = toast.loading("Excluindo lição...");
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha na API");
      await fetchCourseAndContent();
      toast.success("Lição excluída!", { id: toastId });
    } catch (error) {
      console.error("Error deleting lesson: ", error);
      toast.error("Falha ao excluir lição.", { id: toastId });
    }
  };

  const handleOpenQuizModal = (lesson: Lesson, question: QuizQuestion | null = null) => {
    setCurrentLessonForQuiz(lesson);
    setEditingQuizQuestion(question);
    setIsQuizModalOpen(true);
  };

  const handleAddNewQuizQuestionRequest = () => setEditingQuizQuestion(null);
  const handleRequestEditQuizQuestion = (questionToEdit: QuizQuestion) => setEditingQuizQuestion(questionToEdit);

  const handleSaveQuizQuestion = async (questionData: Omit<QuizQuestion, 'id'>) => {
    if (!courseId || !currentLessonForQuiz || !currentLessonForQuiz.sectionId) {
      toast.error("Erro interno: dados de curso ou lição faltando.");
      return;
    }
    const toastId = toast.loading(editingQuizQuestion ? "Atualizando questão..." : "Adicionando questão...");
    try {
      let updatedQuiz: QuizQuestion[];
      if (editingQuizQuestion) {
        updatedQuiz = (currentLessonForQuiz.quiz || []).map(q => q.id === editingQuizQuestion.id ? { ...q, ...questionData } : q);
      } else {
        updatedQuiz = [...(currentLessonForQuiz.quiz || []), { ...questionData, id: generateUniqueId() }];
      }
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${currentLessonForQuiz.sectionId}/lessons/${currentLessonForQuiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz: updatedQuiz }),
      });
      if (!res.ok) throw new Error("Falha na API");
      await fetchCourseAndContent();
      const updatedSection = sections.find(s => s.id === currentLessonForQuiz.sectionId);
      const latestLesson = updatedSection?.lessons?.find(l => l.id === currentLessonForQuiz.id);
      if (latestLesson) setCurrentLessonForQuiz(latestLesson);
      setEditingQuizQuestion(null);
      toast.success(editingQuizQuestion ? "Questão atualizada!" : "Questão adicionada!", { id: toastId });
    } catch (error) {
      console.error("Error saving quiz question: ", error);
      toast.error("Falha ao salvar questão do quiz.", { id: toastId });
    }
  };

  const handleDeleteQuizQuestion = async (lesson: Lesson, questionId: string) => {
    if (!courseId || !lesson.sectionId || !confirm("Tem certeza que deseja excluir esta questão do quiz?")) return;
    const toastId = toast.loading("Excluindo questão...");
    try {
      const updatedQuiz = (lesson.quiz || []).filter(q => q.id !== questionId);
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${lesson.sectionId}/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz: updatedQuiz }),
      });
      if (!res.ok) throw new Error("Falha na API");
      await fetchCourseAndContent();
      toast.success("Questão excluída!", { id: toastId });
    } catch (error) {
      console.error("Error deleting quiz question: ", error);
      toast.error("Falha ao excluir questão.", { id: toastId });
    }
  };

  const handleMove = async (direction: 'up' | 'down', type: 'section' | 'lesson', sectionId: string, lessonId?: string) => {
    if (!courseId) return;
    let items: (Section | Lesson)[] = type === 'section' ? [...sections] : sections.find(s => s.id === sectionId)?.lessons || [];
    const index = items.findIndex(item => item.id === (type === 'section' ? sectionId : lessonId));
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = items[index].order;
    items[index].order = items[targetIndex].order;
    items[targetIndex].order = tempOrder;
    const toastId = toast.loading("Reordenando...");
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, sectionId, a: { id: items[index].id, order: items[index].order }, b: { id: items[targetIndex].id, order: items[targetIndex].order },
        }),
      });
      if (!res.ok) throw new Error("Falha na API");
      await fetchCourseAndContent();
      toast.success("Itens reordenados!", { id: toastId });
    } catch (error) {
      console.error("Error reordering items: ", error);
      toast.error("Falha ao reordenar.", { id: toastId });
    }
  };

  if (!session || session.user.role !== "admin") return null;

  // --- RENDER ---
  return (
    <Container className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Editor de Curso
              </h1>
              <p className="text-muted-foreground mt-1">
                 {course.title ? `Editando: ${course.title}` : "Carregando detalhes..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
                {savingCourseDetails && <span className="text-xs text-muted-foreground animate-pulse">Salvando alterações...</span>}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Course Settings */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Capa & Detalhes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg overflow-hidden h-48 bg-muted/10 flex items-center justify-center">
                            <Input 
                                id="courseImage" 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            />
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Preview" fill className="object-cover transition-opacity group-hover:opacity-75" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <UploadCloud className="w-8 h-8" />
                                    <span className="text-xs font-medium">Clique para fazer upload</span>
                                </div>
                            )}
                            {imagePreview && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white z-0 transition-opacity pointer-events-none">
                                    <span className="text-xs font-medium">Trocar imagem</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata Inputs */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="title" className="text-xs">Título</Label>
                                <Input id="title" name="title" value={course.title || ''} onChange={handleInputChange} placeholder="Ex: Inglês para Iniciantes" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="language" className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Idioma</Label>
                                    <Input id="language" name="language" value={course.language || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="duration" className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Duração</Label>
                                    <Input id="duration" name="duration" value={course.duration || ''} onChange={handleInputChange} placeholder="Ex: 20h" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="role" className="text-xs flex items-center gap-1"><Shield className="w-3 h-3" /> Acesso</Label>
                                <Select value={course.role || 'student'} onValueChange={(value) => setCourse((prev: any) => ({ ...prev, role: value }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Estudante Básico</SelectItem>
                                        <SelectItem value="premium_student">Estudante Premium</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description" className="text-xs">Descrição</Label>
                                <Textarea id="description" name="description" value={course.description || ''} onChange={handleInputChange} rows={4} className="resize-none" />
                            </div>
                        </div>

                        <Button onClick={handleSaveCourseDetails} disabled={savingCourseDetails} className="w-full">
                             {savingCourseDetails ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                             Salvar Alterações
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Curriculum */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-none bg-transparent">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <LayoutList className="w-5 h-5 text-muted-foreground" />
                             <h2 className="text-xl font-semibold">Grade Curricular</h2>
                        </div>
                        <Button onClick={() => handleOpenSectionModal()} size="sm">
                            <Plus className="w-4 h-4 mr-1" /> Nova Seção
                        </Button>
                    </div>

                    {loadingContent ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                            <BookOpen className="w-10 h-10 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">Este curso ainda não tem conteúdo.</p>
                            <Button variant="link" onClick={() => handleOpenSectionModal()}>Criar primeira seção</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sections.map((section, idx) => (
                                <motion.div 
                                    key={section.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border rounded-lg bg-card overflow-hidden shadow-sm"
                                >
                                    {/* Section Header */}
                                    <div className="bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
                                        <div>
                                            <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                                Módulo {idx + 1}
                                            </Badge>
                                            <h3 className="font-semibold text-lg leading-none">{section.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 self-end sm:self-auto">
                                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleMove('up', 'section', section.id)} disabled={idx === 0}>
                                                <ChevronUp className="w-4 h-4" />
                                             </Button>
                                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleMove('down', 'section', section.id)} disabled={idx === sections.length - 1}>
                                                <ChevronDown className="w-4 h-4" />
                                             </Button>
                                             <Separator orientation="vertical" className="h-4 mx-1" />
                                             <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleOpenSectionModal(section)}>
                                                <Edit2 className="w-4 h-4" />
                                             </Button>
                                             <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteSectionAlert(section.id)}>
                                                 <Trash2 className="w-4 h-4" />
                                             </Button>
                                        </div>
                                    </div>

                                    {/* Lessons List */}
                                    <div className="p-2 space-y-1 bg-card">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="group flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex flex-col items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                                                        {lIdx + 1}
                                                    </div>
                                                    <span className="font-medium truncate">{lesson.title}</span>
                                                    {lesson.quiz && lesson.quiz.length > 0 && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1 gap-1">
                                                            <HelpCircle className="w-3 h-3" /> Quiz
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove('up', 'lesson', section.id, lesson.id)} disabled={lIdx === 0}>
                                                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove('down', 'lesson', section.id, lesson.id)} disabled={lIdx === section.lessons.length - 1}>
                                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleOpenLessonModal(section.id, lesson)}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLesson(section.id, lesson.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground border border-dashed border-transparent hover:border-border" onClick={() => handleOpenLessonModal(section.id)}>
                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Lição
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>

      </motion.div>

      {/* --- MODALS --- */}
      {/* Usando os componentes Modal originais passados nas props, mas estilizados internamente */}
      <Modal open={isSectionModalOpen} onOpenChange={(open) => !open && setIsSectionModalOpen(false)}>
        <ModalContent className="sm:max-w-lg">
          <ModalHeader>
            <ModalTitle>{editingSection ? "Editar Módulo" : "Novo Módulo"}</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <div className="py-4">
             <SectionForm initialData={editingSection} onSave={handleSaveSection} onCancel={() => setIsSectionModalOpen(false)} />
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isLessonModalOpen} onOpenChange={(open) => !open && setIsLessonModalOpen(false)}>
        <ModalContent className="max-w-4xl w-full h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>{editingLesson ? "Editar Conteúdo da Aula" : "Nova Aula"}</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <div className="py-2">
            {currentSectionIdForLesson && (
                <LessonForm
                    initialData={editingLesson}
                    sectionId={currentSectionIdForLesson}
                    onSave={handleSaveLesson}
                    onCancel={() => { setIsLessonModalOpen(false); setEditingLesson(null); setCurrentSectionIdForLesson(null); }}
                    onManageQuiz={handleOpenQuizModal}
                    courseId={courseId || ''} 
                    lessonId={editingLesson?.id || null} 
                    onAttachmentsUpdated={handleAttachmentsUpdated} 
                />
            )}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={isQuizModalOpen} onOpenChange={(open) => !open && setIsQuizModalOpen(false)}>
        <ModalContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Gerenciar Quiz</ModalTitle>
            <ModalClose />
          </ModalHeader>
          {currentLessonForQuiz && (
              <QuizForm
                  lesson={currentLessonForQuiz}
                  initialQuestionData={editingQuizQuestion} 
                  onSaveQuestion={handleSaveQuizQuestion}
                  onDeleteQuestion={handleDeleteQuizQuestion}
                  onCancel={() => { setIsQuizModalOpen(false); setEditingQuizQuestion(null); }}
                  onAddNewQuestionRequest={handleAddNewQuizQuestionRequest}                         
                  onRequestEditQuestion={handleRequestEditQuizQuestion} 
              />
          )}
        </ModalContent>
      </Modal>

      <AlertDialog open={isDeleteSectionAlertOpen} onOpenChange={(open) => !open && setIsDeleteSectionAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir seção</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá a seção e todas as suas lições e anexos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteSectionAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (sectionIdToDelete) {
                  setIsDeleteSectionAlertOpen(false);
                  const id = sectionIdToDelete;
                  setSectionIdToDelete(null);
                  handleDeleteSection(id);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Container>
  );
}
