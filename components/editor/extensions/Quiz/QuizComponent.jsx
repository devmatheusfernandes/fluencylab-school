import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

const QuizComponent = ({ node, deleteNode, getPos, editor }) => {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackColor, setFeedbackColor] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    loadQuiz();
  }, [node?.attrs?.deckId]);

  const loadQuiz = async () => {
    if (node?.attrs?.deckId) {
      try {
        const deckRef = doc(db, 'Quizzes', node.attrs.deckId);
        const deckSnap = await getDoc(deckRef);

        if (deckSnap.exists()) {
          const deckData = { id: deckSnap.id, ...deckSnap.data() };
          setSelectedDeck(deckData);
          setQuestions(deckData.questions);
          setAnswers(Array(deckData.questions.length).fill(null));
          setCurrentQuestionIndex(0);
          setScore(0);
          setFeedback('');
          setQuizFinished(false);
        } else {
          toast.error('Quiz não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao carregar quiz:', error);
        toast.error('Erro ao carregar o quiz.');
      }
    }
  };

  const handleAnswerSelect = (selectedOption) => {
    if (!selectedDeck || !questions[currentQuestionIndex] || quizFinished) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.options.some(
      (option) => option.option === selectedOption && option.isCorrect
    );

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setAnswers(newAnswers);

    setFeedback(isCorrect ? 'Correto!' : 'Incorreto!');
    setFeedbackColor(isCorrect ? 'green' : 'red');

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      goToNextQuestion();
    }, 1500);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setFeedback('');
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    setQuizFinished(true);
    toast.success(`Quiz finalizado! Sua pontuação: ${score}/${questions.length}`);
  };

  const handleSkipQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = null;
    setAnswers(newAnswers);
    goToNextQuestion();
  };

  const handleRetryQuiz = () => {
    loadQuiz();
  };

  const handleDeleteQuiz = () => {
    if (deleteNode) {
      deleteNode();
    } else if (editor && getPos) {
      // Método alternativo usando editor
      const pos = getPos();
      if (pos !== undefined) {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
      }
    }
  };

  if (!selectedDeck || questions.length === 0) {
    return (
      <NodeViewWrapper 
        ref={nodeRef}
        className="quiz-loading flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <div className="flex justify-between items-center w-full mb-2">
          <span className="text-gray-500">Carregando Quiz...</span>
          <Button
            onClick={handleDeleteQuiz}
            variant="destructive"
            size="sm"
            title="Excluir Quiz"
            leftIcon={<XIcon className="size-4" />}
          >
            Excluir
          </Button>
        </div>
        {node?.attrs?.deckId ? (
          <span className="text-sm text-gray-400">ID: {node.attrs.deckId}</span>
        ) : (
          <span className="text-sm text-gray-400">Nenhum quiz selecionado</span>
        )}
      </NodeViewWrapper>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <NodeViewWrapper 
      ref={nodeRef}
      className="quiz-container p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 border relative"
    >
      {/* Botão de exclusão */}
      <Button
        onClick={handleDeleteQuiz}
        className="absolute top-2 right-2"
        variant="destructive"
        size="sm"
        title="Excluir Quiz"
        leftIcon={<XIcon className="size-4" />}
      >
        Excluir
      </Button>

      <div className="flex justify-between items-center mb-4 pr-8">
        <h3 className="text-xl font-bold">{selectedDeck.deckTitle}</h3>
        <span className="text-sm text-gray-500">
          {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      {!quizFinished ? (
        <>
          <p className="text-lg font-medium mb-4">
            {currentQuestionIndex + 1}. {currentQuestion.questionTitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(option.option)}
                disabled={answers[currentQuestionIndex] !== null}
                className={`p-3 rounded-md text-left transition-all duration-200 w-full justify-start
                  ${answers[currentQuestionIndex] === option.option
                    ? option.isCorrect
                      ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500'
                      : 'bg-red-100 dark:bg-red-900 border-2 border-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
                  ${answers[currentQuestionIndex] !== null ? 'cursor-not-allowed' : ''}
                `}
              >
                {option.option}
              </Button>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            {answers[currentQuestionIndex] === null && (
              <Button
                onClick={handleSkipQuestion}
                variant="warning"
              >
                Pular
              </Button>
            )}
          </div>

          {feedback && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center font-semibold mt-4 ${feedbackColor === 'green' ? 'text-green-600' : 'text-red-600'}`}
            >
              {feedback}
            </motion.p>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Quiz Finalizado!</h3>
          <p className="text-xl mb-4">Sua pontuação: {score} de {questions.length}</p>
          <Button onClick={handleRetryQuiz}>Refazer Quiz</Button>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default QuizComponent;