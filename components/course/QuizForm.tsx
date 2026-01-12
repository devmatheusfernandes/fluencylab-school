import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Lesson, QuizQuestion } from "../../types/quiz/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ModalPrimaryButton, ModalSecondaryButton } from "@/components/ui/modal";

const QuizForm = ({
  lesson,
  initialQuestionData,
  onSaveQuestion,
  onDeleteQuestion,
  onCancel,
  onAddNewQuestionRequest,
  onRequestEditQuestion
}: {
  lesson: Lesson;
  initialQuestionData: QuizQuestion | null;
  onSaveQuestion: (data: Omit<QuizQuestion, 'id'>) => void;
  onDeleteQuestion: (lesson: Lesson, questionId: string) => void;
  onCancel: () => void;
  onAddNewQuestionRequest: () => void;
  onRequestEditQuestion: (question: QuizQuestion) => void;
}) => {
  const t = useTranslations("CourseComponents.QuizForm");
  const [question, setQuestion] = useState(initialQuestionData?.question || '');
  const [options, setOptions] = useState<string[]>(initialQuestionData?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(initialQuestionData?.correctAnswer || '');

  useEffect(() => {
    setQuestion(initialQuestionData?.question || '');
    const currentOptions = initialQuestionData?.options || [];
    setOptions([...currentOptions, ...Array(4 - currentOptions.length).fill('')].slice(0, 4));
    setCorrectAnswer(initialQuestionData?.correctAnswer || '');
  }, [initialQuestionData]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    if (correctAnswer === options[index] && value !== options[index]) {
      setCorrectAnswer('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error(t("emptyQuestion"));
      return;
    }
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error(t("minOptions"));
      return;
    }
    if (!correctAnswer || !filledOptions.includes(correctAnswer)) {
      toast.error(t("invalidCorrectAnswer"));
      return;
    }

    onSaveQuestion({ question, options: filledOptions, correctAnswer });
  };

  return (
    <div className="space-y-6">
      <div className="bg-fluency-pages-light dark:bg-fluency-pages-dark p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-fluency-text-light dark:text-fluency-text-dark">
            {t("existingQuestions", { count: lesson.quiz?.length || 0 })}
          </h3>
          {initialQuestionData && (
            <Button
              onClick={onAddNewQuestionRequest}
            >
              <Plus className="mr-2 w-4 h-4" /> {t("newQuestion")}
            </Button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2">
          {(lesson.quiz || []).length === 0 ? (
            <p className="text-sm text-fluency-text-light dark:text-fluency-text-dark">
              {t("emptyList")}
            </p>
          ) : (
            (lesson.quiz || []).map(q => (
              <div key={q.id} className="flex justify-between items-center p-2 bg-fluency-bg-light dark:bg-fluency-gray-800 rounded-lg">
                <span className="text-sm text-fluency-text-light dark:text-fluency-text-dark truncate">
                  {q.question}
                </span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => {
                      onAddNewQuestionRequest();
                      onRequestEditQuestion(q);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDeleteQuestion(lesson, q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-fluency-pages-light dark:bg-fluency-pages-dark p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-fluency-text-light dark:text-fluency-text-dark mb-4">
          {initialQuestionData ? t("editing", { question: initialQuestionData.question }) : t("newQuestion")}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="quizQuestion"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-fluency-text-light dark:text-fluency-text-dark">
              {t("optionsLabel")}
            </label>
            {options.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={t("optionPlaceholder", { index: index + 1 })}
                className="text-sm"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-fluency-text-light dark:text-fluency-text-dark">
              {t("correctAnswerLabel")}
            </label>
            <Select
              value={correctAnswer}
              onValueChange={(value) => setCorrectAnswer(value)}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectCorrectAnswer")} />
              </SelectTrigger>
              <SelectContent>
                {options.filter(opt => opt.trim() !== '').map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t border-fluency-gray-200 dark:border-fluency-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <ModalSecondaryButton
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              {t("close")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              type="submit"
              className="w-full sm:w-auto"
            >
              {initialQuestionData ? t("save") : t("add")}
            </ModalPrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizForm;
