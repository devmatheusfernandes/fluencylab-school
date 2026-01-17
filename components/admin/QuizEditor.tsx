'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Quiz, QuizSection, QuizQuestion } from '@/types/content';
import { quizSchema } from '@/lib/validation/schemas';
import { updateQuiz } from '@/actions/content-processing';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { z } from 'zod';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalPrimaryButton, ModalSecondaryButton, ModalIcon } from '@/components/ui/modal';

interface QuizEditorProps {
  content: Content;
}

export function QuizEditor({ content }: QuizEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; sectionIndex: number; questionIndex: number } | null>(null);
  // Local state for quiz data
  const [quizData, setQuizData] = useState<Quiz | undefined>(content.quiz);
  const [activeTab, setActiveTab] = useState<string>('vocabulary');

  // Initialize active tab on mount
  useEffect(() => {
    if (quizData?.quiz_sections?.[0]?.type) {
      setActiveTab(quizData.quiz_sections[0].type);
    }
  }, []); // Only on mount

  // If no quiz, initialize with default structure
  useEffect(() => {
    if (!content.quiz) {
      setQuizData({
        quiz_metadata: {
          title: `Quiz: ${content.title}`,
          level: content.level || 'B1',
          dateGenerated: new Date().toISOString(),
        },
        quiz_sections: [],
      });
    }
  }, [content.quiz, content.title, content.level]);

  const handleSave = async () => {
    if (!quizData) return;

    try {
      setIsSaving(true);
      
      // Validate before saving
      const validatedData = quizSchema.parse(quizData);
      
      const result = await updateQuiz(content.id, validatedData);
      
      if (result.success) {
        toast.success('Quiz updated successfully!');
        router.refresh();
      } else {
        toast.error('Failed to update quiz');
      }
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        toast.error('Validation failed. Please check the fields.');
        // You could add more detailed error mapping here
      } else {
        toast.error('An error occurred');
      }
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
          <h1 className="text-2xl font-bold tracking-tight">Quiz Editor</h1>
          <p className="text-muted-foreground text-sm">{content.title}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
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
                  {section.type} Section
                </CardTitle>
                <CardDescription>
                  Manage questions for the {section.type} section.
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
                              {`Q${questionIndex + 1}: ${question.text || 'New Question'}`}
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
                            <label className="text-sm font-medium">Question Text</label>
                            <Textarea 
                              value={question.text}
                              onChange={(e) => handleUpdateQuestion(sectionIndex, questionIndex, 'text', e.target.value)}
                              placeholder="Enter question text..."
                              className="resize-y"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-muted-foreground">Option {optionIndex + 1}</label>
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
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Explanation (Optional)</label>
                            <Textarea 
                              value={question.explanation || ''}
                              onChange={(e) => handleUpdateQuestion(sectionIndex, questionIndex, 'explanation', e.target.value)}
                              placeholder="Explain why the answer is correct..."
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
                    Add Question
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
            <ModalTitle>Delete Question</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setDeleteConfirmation(null)}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton variant="destructive" onClick={confirmDeleteQuestion}>
              Delete
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
