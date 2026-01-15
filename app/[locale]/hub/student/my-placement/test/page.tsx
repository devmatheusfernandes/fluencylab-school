"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { TestView } from "../../../../../../components/placement/TestView";
import { ResultView } from "../../../../../../components/placement/ResultView";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Level,
  Question,
  AdaptiveState,
  DiagnosticResult,
} from "../../../../../../types/placement/types";
import {
  MAX_QUESTIONS,
  LEVELS,
  LEVEL_SCORES,
  getNextLevel,
  selectNextQuestion,
} from "../../../../../../utils/placement-utils";
import { useTranslations } from "next-intl";

// Import questions directly
import enQuestionsData from "../../../../../../placement/en-questions.json";
import ptQuestionsData from "../../../../../../placement/pt-questions.json";

export default function TestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const t = useTranslations("Placement");

  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "pt">("en");
  
  // Adaptive Test State
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>({
    currentQuestionId: null,
    usedQuestionIds: [],
    answers: {},
    currentLevel: "B1",
    questionCount: 0,
    history: [],
  });

  // Result State
  const [finalResult, setFinalResult] = useState<{
    score: number;
    level: string;
    diagnostics: DiagnosticResult;
    avgTime: number;
  } | null>(null);

  const startTimeRef = useRef<number>(0);

  // --- Logic Hooks ---
  const questionPool = useMemo(() => {
    const rawQuestions =
      selectedLanguage === "en"
        ? (enQuestionsData as Question[])
        : (ptQuestionsData as Question[]);
    const pool: Record<Level, Question[]> = {
      A1: [],
      A2: [],
      B1: [],
      B2: [],
      C1: [],
      C2: [],
    };
    rawQuestions.forEach((q) => {
      if (pool[q.level]) pool[q.level].push(q);
    });
    return pool;
  }, [selectedLanguage]);

  const allQuestionsMap = useMemo(() => {
    const rawQuestions =
      selectedLanguage === "en"
        ? (enQuestionsData as Question[])
        : (ptQuestionsData as Question[]);
    return rawQuestions.reduce(
      (acc, q) => {
        acc[q.id] = q;
        return acc;
      },
      {} as Record<string, Question>
    );
  }, [selectedLanguage]);

  const currentQuestion = adaptiveState.currentQuestionId
    ? allQuestionsMap[adaptiveState.currentQuestionId]
    : null;
  const progress = (adaptiveState.questionCount / MAX_QUESTIONS) * 100;

  useEffect(() => {
    if (currentQuestion && !finalResult) {
      startTimeRef.current = Date.now();
    }
  }, [adaptiveState.currentQuestionId, currentQuestion, finalResult]);

  // --- Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const progressRef = doc(db, "placement_progress", session.user.id);
        const progressSnap = await getDoc(progressRef);
        
        if (progressSnap.exists()) {
          const data = progressSnap.data();
          
          // If completed, ignore progress and treat as new test request
          if (data.completed) {
            // If lang param is present, start new test
            if (langParam && (langParam === "en" || langParam === "pt")) {
               setSelectedLanguage(langParam);
               await startNewTest(langParam);
            } else {
               if (!langParam) {
                 router.push("/hub/student/my-placement");
                 return;
               }
            }
          } else {
            // Check if user wants to start a different language test
            if (langParam && (langParam === "en" || langParam === "pt")) {
                if (data.selectedLanguage !== langParam) {
                    // Language mismatch: Start new test in requested language
                    setSelectedLanguage(langParam);
                    await startNewTest(langParam);
                    return;
                }
            }

            // Resume existing test
            if (data.selectedLanguage) setSelectedLanguage(data.selectedLanguage);
            if (data.adaptiveState) {
              setAdaptiveState(data.adaptiveState);
            }
          }
        } else {
          // No progress doc
          if (langParam && (langParam === "en" || langParam === "pt")) {
            setSelectedLanguage(langParam);
            await startNewTest(langParam);
          } else {
            router.push("/hub/student/my-placement");
            return;
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load previous data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, langParam, router]);

  const startNewTest = async (lang: "en" | "pt") => {
    // Need to use the correct pool for the selected language
    // But questionPool is memoized on selectedLanguage state, which might not be updated yet
    // So we need to compute it manually or wait.
    // simpler: compute first question here.
    
    const rawQuestions =
      lang === "en"
        ? (enQuestionsData as Question[])
        : (ptQuestionsData as Question[]);
    const pool: Record<Level, Question[]> = {
      A1: [],
      A2: [],
      B1: [],
      B2: [],
      C1: [],
      C2: [],
    };
    rawQuestions.forEach((q) => {
      if (pool[q.level]) pool[q.level].push(q);
    });

    const startLevel: Level = "B1";
    const firstQuestion = selectNextQuestion(startLevel, [], pool);

    if (!firstQuestion) {
      toast.error(t("errorInit"));
      return;
    }

    const initialState: AdaptiveState = {
      currentQuestionId: firstQuestion.id,
      usedQuestionIds: [firstQuestion.id],
      answers: {},
      currentLevel: startLevel,
      questionCount: 0,
      history: [],
    };

    setAdaptiveState(initialState);
    
    if (session?.user?.id) {
        await setDoc(doc(db, "placement_progress", session.user.id), {
            userId: session.user.id,
            selectedLanguage: lang,
            adaptiveState: initialState,
            updatedAt: serverTimestamp(),
            completed: false
        });
    }
  };

  const saveProgress = async (newState: AdaptiveState) => {
    if (!session?.user?.id) return;
    try {
      await setDoc(doc(db, "placement_progress", session.user.id), {
        userId: session.user.id,
        selectedLanguage,
        adaptiveState: newState,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleOptionSelect = (value: string) => {
    if (!adaptiveState.currentQuestionId) return;
    setAdaptiveState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentQuestionId!]: value },
    }));
  };

  const processAnswer = async (skipped: boolean) => {
    if (!currentQuestion) return;
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const selectedOption = adaptiveState.answers[currentQuestion.id];
    const isCorrect =
      !skipped && selectedOption === currentQuestion.correctOption;

    if (skipped) {
      setAdaptiveState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [currentQuestion.id]: "SKIPPED" },
      }));
    }

    const newHistoryEntry = {
      questionId: currentQuestion.id,
      isCorrect,
      level: currentQuestion.level,
      timeTaken,
      skipped,
    };

    const nextQuestionCount = adaptiveState.questionCount + 1;

    if (nextQuestionCount >= MAX_QUESTIONS) {
      await handleFinish({
        ...adaptiveState,
        questionCount: nextQuestionCount,
        history: [...adaptiveState.history, newHistoryEntry],
      });
      return;
    }

    const nextLevel = getNextLevel(currentQuestion.level, isCorrect);
    const nextQuestion = selectNextQuestion(
      nextLevel,
      adaptiveState.usedQuestionIds,
      questionPool
    );

    if (!nextQuestion) {
      await handleFinish({
        ...adaptiveState,
        questionCount: nextQuestionCount,
        history: [...adaptiveState.history, newHistoryEntry],
      });
      return;
    }

    const newState: AdaptiveState = {
      ...adaptiveState,
      currentQuestionId: nextQuestion.id,
      usedQuestionIds: [...adaptiveState.usedQuestionIds, nextQuestion.id],
      currentLevel: nextLevel,
      questionCount: nextQuestionCount,
      history: [...adaptiveState.history, newHistoryEntry],
    };

    setAdaptiveState(newState);
    await saveProgress(newState);
  };

  const handleAnswer = () => processAnswer(false);
  const handleIDontKnow = () => processAnswer(true);

  const handleFinish = async (finalState: AdaptiveState) => {
    const recentHistory = finalState.history.slice(-5);
    let levelSum = 0;
    recentHistory.forEach((h) => {
      levelSum += LEVEL_SCORES[h.level];
    });
    const averageScore =
      recentHistory.length > 0
        ? levelSum / recentHistory.length
        : LEVEL_SCORES["A1"];
    const roundedScore = Math.round(averageScore);
    const assignedLevel = LEVELS[Math.max(0, Math.min(5, roundedScore - 1))];

    const topicStats: Record<string, { total: number; correct: number }> = {};
    let totalTime = 0;

    finalState.history.forEach((h) => {
      totalTime += h.timeTaken;
      const q = allQuestionsMap[h.questionId];
      if (!q) return;
      q.topics.forEach((topic) => {
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total += 1;
        if (h.isCorrect) topicStats[topic].correct += 1;
      });
    });

    const finalDiagnostics: DiagnosticResult = {};
    Object.keys(topicStats).forEach((topic) => {
      const { total, correct } = topicStats[topic];
      finalDiagnostics[topic] = Math.round((correct / total) * 100);
    });

    const avgTime = totalTime / MAX_QUESTIONS;
    const totalScore = finalState.history.reduce(
      (acc, h) => acc + (h.isCorrect ? LEVEL_SCORES[h.level] : 0),
      0
    );

    const resultData = {
      score: totalScore,
      level: assignedLevel,
      diagnostics: finalDiagnostics,
      avgTime,
    };
    setFinalResult(resultData);

    if (session?.user?.id) {
      try {
        await addDoc(collection(db, "placement_results"), {
          userId: session.user.id,
          totalScore: totalScore,
          assignedLevel: assignedLevel,
          diagnostics: finalDiagnostics,
          language: selectedLanguage,
          completedAt: serverTimestamp(),
          adaptiveHistory: finalState.history,
          averageTimePerQuestion: avgTime,
        });
        await setDoc(doc(db, "placement_progress", session.user.id), {
          completed: true,
        }, { merge: true });
        toast.success(t("testCompleted"));
      } catch (error) {
        console.error("Error saving results:", error);
      }
    }
  };

  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4 max-w-md mx-auto">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="py-6 px-4">
        <ResultView 
            result={finalResult} 
            onBack={() => router.push(`/hub/student/my-placement`)} 
        />
      </div>
    );
  }

  if (!currentQuestion) {
      // Should not happen if loading handled correctly
      return null;
  }

  return (
    <div className="py-2 px-4">
      <TestView
        currentQuestion={currentQuestion}
        adaptiveState={adaptiveState}
        progress={progress}
        onOptionSelect={handleOptionSelect}
        onAnswer={handleAnswer}
        onSkip={handleIDontKnow}
        onExit={() => router.push(`/hub/student/my-placement`)}
      />
    </div>
  );
}
