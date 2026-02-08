import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, RefreshCcw } from "lucide-react";
import { QuizQuestion, QuizResult } from "../../types/quiz/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface QuizComponentProps {
  quiz: QuizQuestion[];
  onQuizSubmit?: (results: {
    answers: Record<string, string>;
    score: number;
    totalQuestions: number;
    correct: boolean;
  }) => void;
  savedQuizData?: QuizResult | null;
}

interface QuizQuestionItemProps {
  q: QuizQuestion;
  index: number;
  selectedAnswers: Record<string, string>;
  quizSubmitted: boolean;
  isSubmitting: boolean;
  handleOptionChange: (questionId: string, option: string) => void;
  t: (key: string) => string;
}

const QuizQuestionItem = ({
  q,
  index,
  selectedAnswers,
  quizSubmitted,
  isSubmitting,
  handleOptionChange,
  t,
}: QuizQuestionItemProps) => {
  return (
    <div className="pb-4 border-b border-fluency-gray-200 dark:border-fluency-gray-700 last:border-b-0">
      <p className="font-medium text-sm md:text-base text-fluency-text-light dark:text-fluency-text-dark mb-2 md:mb-3">
        {index + 1}. {q.question}
      </p>

      <div className="space-y-2">
        {q.options.map((option) => {
          const isSelected = selectedAnswers[q.id] === option;
          const isCorrect = option === q.correctAnswer;

          let optionStyle =
            "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all cursor-pointer border ";
          if (quizSubmitted) {
            optionStyle += isCorrect
              ? "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-500"
              : isSelected
                ? "bg-rose-100/80 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-500"
                : "bg-fluency-gray-100 dark:bg-fluency-gray-700 hover:bg-fluency-gray-200 dark:hover:bg-fluency-gray-600 border-transparent";
          } else {
            optionStyle += isSelected
              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
              : "bg-fluency-gray-100 dark:bg-fluency-gray-700 hover:bg-fluency-gray-200 dark:hover:bg-fluency-gray-600 border-transparent";
          }

          return (
            <label key={option} className={optionStyle}>
              <input
                type="radio"
                name={`quiz-${q.id}`}
                value={option}
                checked={isSelected}
                onChange={() => handleOptionChange(q.id, option)}
                className="form-radio text-indigo-500 focus:ring-indigo-500 h-4 w-4 md:h-5 md:w-5"
                disabled={quizSubmitted || isSubmitting}
              />

              <span className="flex-1 text-sm md:text-base">{option}</span>

              {quizSubmitted && (
                <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                  {isSelected && !isCorrect && t("yourAnswer")}
                  {isSelected && isCorrect && t("correct")}
                  {!isSelected && isCorrect && t("correctAnswer")}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

const QuizComponent = ({
  quiz,
  onQuizSubmit,
  savedQuizData,
}: QuizComponentProps) => {
  const t = useTranslations("CourseComponents.QuizComponent");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Effect to load saved quiz data when component mounts
  useEffect(() => {
    if (savedQuizData && savedQuizData.answers) {
      setSelectedAnswers(savedQuizData.answers);
      setQuizSubmitted(true);
    }
  }, [savedQuizData]);

  const handleOptionChange = (questionId: string, option: string) => {
    if (quizSubmitted) setQuizSubmitted(false);
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!allQuestionsAnswered || isSubmitting)
      return toast.error(t("answerAll"));

    setIsSubmitting(true);
    const toastId = toast.loading(t("submitting"));

    try {
      setQuizSubmitted(true);

      // Calculate score and results
      const correctAnswers = quiz.filter(
        (q) => selectedAnswers[q.id] === q.correctAnswer,
      );
      const score = correctAnswers.length;
      const totalQuestions = quiz.length;
      const allCorrect = score === totalQuestions;

      // Prepare results object
      const quizResults = {
        answers: selectedAnswers,
        score,
        totalQuestions,
        correct: allCorrect,
      };

      // Call the parent component's submit handler to save to Firebase
      if (onQuizSubmit) {
        await onQuizSubmit(quizResults);
      }

      // Show success/error message
      const percentage = Math.round((score / totalQuestions) * 100);
      const message = allCorrect
        ? t("successAllCorrect")
        : t("successPartial", { score, total: totalQuestions, percentage });

      toast[allCorrect ? "success" : "error"](message, { id: toastId });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(t("submitError"), { id: toastId });
      setQuizSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const allQuestionsAnswered =
    quiz.length > 0 && quiz.every((q) => selectedAnswers[q.id] !== undefined);

  // Calculate current score for display
  const currentScore = quizSubmitted
    ? quiz.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length
    : 0;
  const percentage = quizSubmitted
    ? Math.round((currentScore / quiz.length) * 100)
    : 0;

  // Show different UI states based on saved data
  const showPreviousAttempt = savedQuizData && quizSubmitted;
  const attemptDate = savedQuizData?.submittedAt?.toDate
    ? savedQuizData.submittedAt.toDate().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="p-3 md:p-4 border-2 border-fluency-gray-200 dark:border-fluency-gray-700 rounded-lg card-base">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-fluency-text-light dark:text-fluency-text-dark flex items-center gap-2">
          <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
          {t("title")}
        </h3>

        <div className="flex flex-col items-end gap-1">
          {quizSubmitted && (
            <div className="text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
              {t("score", {
                score: currentScore,
                total: quiz.length,
                percentage,
              })}
            </div>
          )}

          {showPreviousAttempt && attemptDate && (
            <div className="text-xs text-fluency-text-secondary dark:text-fluency-text-dark-secondary">
              {t("answeredAt", { date: attemptDate })}
            </div>
          )}
        </div>
      </div>

      {quiz.length === 0 ? (
        <p className="text-fluency-text-secondary dark:text-fluency-text-dark-secondary italic">
          {t("empty")}
        </p>
      ) : (
        <>
          {/* Mobile View - Carousel */}
          <div className="block md:hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {quiz.map((q, index) => (
                  <CarouselItem key={q.id}>
                    <QuizQuestionItem
                      q={q}
                      index={index}
                      selectedAnswers={selectedAnswers}
                      quizSubmitted={quizSubmitted}
                      isSubmitting={isSubmitting}
                      handleOptionChange={handleOptionChange}
                      t={t as any}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <p className="text-center text-xs text-muted-foreground mt-4 italic">
              Deslize para ver a próxima
            </p>
          </div>

          {/* Desktop View - List */}
          <div className="hidden md:block space-y-6">
            {quiz.map((q, index) => (
              <QuizQuestionItem
                key={q.id}
                q={q}
                index={index}
                selectedAnswers={selectedAnswers}
                quizSubmitted={quizSubmitted}
                isSubmitting={isSubmitting}
                handleOptionChange={handleOptionChange}
                t={t as any}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        {!quizSubmitted ? (
          <Button
            onClick={handleSubmitQuiz}
            variant={allQuestionsAnswered ? "primary" : "ghost"}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? t("buttons.sending") : t("buttons.check")}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleResetQuiz}
              variant="warning"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              <RefreshCcw className="mr-2 w-5 h-5" />
              {t("buttons.retry")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
