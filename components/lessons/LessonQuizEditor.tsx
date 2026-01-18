'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lesson, Quiz, QuizQuestion } from '@/types/lesson'; // Usando tipo Lesson/Quiz corretos
import { updateLessonQuiz } from '@/actions/lesson-updating'; // Action correta
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalPrimaryButton, ModalSecondaryButton, ModalIcon } from '@/components/ui/modal';

interface LessonQuizEditorProps {
  lesson: Lesson;
}

export function LessonQuizEditor({ lesson }: LessonQuizEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; sectionIndex: number; questionIndex: number } | null>(null);
  
  // Local state for quiz data
  const [quizData, setQuizData] = useState<Quiz | undefined>(lesson.quiz);
  const [activeTab, setActiveTab] = useState<string>('vocabulary');

  // Initialize active tab on mount
  useEffect(() => {
    if (quizData?.quiz_sections?.[0]?.type) {
      setActiveTab(quizData.quiz_sections[0].type);
    }
  }, []); 

  // If no quiz, initialize with default structure
  useEffect(() => {
    if (!lesson.quiz) {
      setQuizData({
        quiz_metadata: {
          title: `Quiz: ${lesson.title}`,
          level: (lesson.level || 'B1') as string,
          dateGenerated: new Date().toISOString(),
        },
        quiz_sections: [],
      });
    }
  }, [lesson.quiz, lesson.title, lesson.level]);

  const handleSave = async () => {
    if (!quizData) return;

    try {
      setIsSaving(true);
      // Validar manualmente se necessário ou usar Zod Schema compatível
      // Aqui enviamos direto, assumindo que a UI garante a estrutura
      const result = await updateLessonQuiz(lesson.id, quizData);
      
      if (result.success) {
        toast.success('Quiz atualizado com sucesso!');
        router.refresh();
      } else {
        toast.error('Falha ao atualizar quiz.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = (sectionIndex: number, questionIndex: number, field: keyof QuizQuestion | 'options', value: any, optionIndex?: number) => {
    setQuizData(prev => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = [...newSections[sectionIndex].questions];
      const question = { ...newQuestions[questionIndex] };

      if (field === 'options' && typeof optionIndex === 'number') {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        question.options = newOptions;
      } else {
        (question as any)[field] = value;
      }

      newQuestions[questionIndex] = question;
      newSections[sectionIndex] = { ...newSections[sectionIndex], questions: newQuestions };
      return { ...prev, quiz_sections: newSections };
    });
  };

  const handleAddQuestion = (sectionIndex: number) => {
    setQuizData(prev => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = [...newSections[sectionIndex].questions];
      
      newQuestions.push({
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: ''
      });

      newSections[sectionIndex] = { ...newSections[sectionIndex], questions: newQuestions };
      return { ...prev, quiz_sections: newSections };
    });
  };

  const handleRemoveQuestion = (sectionIndex: number, questionIndex: number) => {
    setDeleteConfirmation({ isOpen: true, sectionIndex, questionIndex });
  };

  const confirmDeleteQuestion = () => {
    if (!deleteConfirmation) return;
    const { sectionIndex, questionIndex } = deleteConfirmation;

    setQuizData(prev => {
      if (!prev) return prev;
      const newSections = [...prev.quiz_sections];
      const newQuestions = newSections[sectionIndex].questions.filter((_, i) => i !== questionIndex);
      newSections[sectionIndex] = { ...newSections[sectionIndex], questions: newQuestions };
      return { ...prev, quiz_sections: newSections };
    });

    setDeleteConfirmation(null);
  };

  if (!quizData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-gray-500">Nenhum quiz encontrado. Gere um quiz primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editor de Quiz</h1>
          <p className="text-muted-foreground text-sm">{lesson.title}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto justify-start h-auto p-1 mb-4 no-scrollbar">
          {quizData.quiz_sections.map((section) => (
            <TabsTrigger 
              key={section.type} 
              value={section.type}
              className="capitalize whitespace-nowrap"
            >
              {section.type}
              <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5">
                {section.questions.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {quizData.quiz_sections.map((section, sectionIndex) => (
          <TabsContent key={section.type} value={section.type} className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  Seção: {section.type}
                </CardTitle>
                <CardDescription>
                  Gerencie as perguntas desta seção.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Accordion type="multiple" className="w-full space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <AccordionItem 
                        key={questionIndex} 
                        value={`item-${questionIndex}`} 
                        className="border rounded-lg px-4 bg-card"
                      >
                        <div className="flex items-center gap-2 py-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          <AccordionTrigger className="hover:no-underline flex-1 py-2">
                            <span className="text-left font-medium line-clamp-1 mr-4">
                              {`Q${questionIndex + 1}: ${question.text || 'Nova Pergunta'}`}
                            </span>
                          </AccordionTrigger>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveQuestion(sectionIndex, questionIndex);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <AccordionContent className="pt-2 pb-4 space-y-4 border-t">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Enunciado</label>
                            <Textarea 
                              value={question.text}
                              onChange={(e) => handleUpdateQuestion(sectionIndex, questionIndex, 'text', e.target.value)}
                              placeholder="Digite a pergunta..."
                              className="resize-y"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-muted-foreground">Opção {optionIndex + 1}</label>
                                  <input 
                                    type="radio"
                                    name={`correct-${sectionIndex}-${questionIndex}`}
                                    checked={question.correctIndex === optionIndex}
                                    onChange={() => handleUpdateQuestion(sectionIndex, questionIndex, 'correctIndex', optionIndex)}
                                    className="h-4 w-4 text-primary"
                                  />
                                </div>
                                <Input 
                                  value={option}
                                  onChange={(e) => handleUpdateQuestion(sectionIndex, questionIndex, 'options', e.target.value, optionIndex)}
                                  placeholder={`Opção ${optionIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Explicação (Opcional)</label>
                            <Textarea 
                              value={question.explanation || ''}
                              onChange={(e) => handleUpdateQuestion(sectionIndex, questionIndex, 'explanation', e.target.value)}
                              placeholder="Explique por que a resposta está correta..."
                              className="h-20 resize-y"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed"
                    onClick={() => handleAddQuestion(sectionIndex)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Modal open={deleteConfirmation?.isOpen} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalIcon type="delete" />
            <ModalTitle>Excluir Pergunta</ModalTitle>
            <ModalDescription>
              Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setDeleteConfirmation(null)}>
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton variant="destructive" onClick={confirmDeleteQuestion}>
              Excluir
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
