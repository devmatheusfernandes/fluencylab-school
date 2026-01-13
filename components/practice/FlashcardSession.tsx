'use client';

import { useState, useEffect, useMemo } from "react";
import { Flashcard, ReviewGrade } from "@/types/srs";
import { User } from "@/types/users/users";
import { useSRS } from "@/hooks/useSRS";
import { useGamification } from "@/hooks/useGamification";
import { GamificationHeader } from "./GamificationHeader";
import { Flashcard as FlashcardComponent } from "./Flashcard";
import { SessionSummary } from "./SessionSummary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHotkeys } from "react-hotkeys-hook";
import { saveCardReview, getDeckProgress, getUserLearningStats } from "@/actions/practice";
import { getDecks } from "@/actions/decks";
import { Deck } from "@/types/deck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Layers,  ArrowLeft, Loader2, BrainCircuit, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalSecondaryButton } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContributionHeatmap } from "./ContributionHeatmap";

type GamificationHook = ReturnType<typeof useGamification>;

interface FlashcardSessionProps {
  cards: Flashcard[];
  initialUser?: User | null; // Pass user for initial gamification state
  onSessionComplete?: () => void;
  onCardReviewed?: (cardId: string, grade: ReviewGrade, newSrsData: any) => void;
}

const MOCK_CARDS: Flashcard[] = [
  { id: '1', front: 'Apple', back: 'Maçã', srsData: undefined },
  { id: '2', front: 'House', back: 'Casa', srsData: undefined },
  { id: '3', front: 'To Run', back: 'Correr', srsData: undefined },
  { id: '4', front: 'Book', back: 'Livro', srsData: undefined },
  { id: '5', front: 'Water', back: 'Água', srsData: undefined },
];

// Sub-component for the actual session logic
function SessionRunner({ 
  cards, 
  initialUser, 
  onSessionComplete, 
  onCardReviewed,
  onExit,
  gamification
}: FlashcardSessionProps & { onExit: () => void, gamification: GamificationHook }) {
  const effectiveCards = cards && cards.length > 0 ? cards : MOCK_CARDS;
  
  const { gamificationState, addXP, updateStreak, calculateNextLevelXp, syncProgress, XP_REWARDS } = gamification;
  
  const handleReview = async (cardId: string, grade: ReviewGrade, newCard: Flashcard) => {
    let xp = 0;
    if (grade === 5) xp = XP_REWARDS.EASY;
    else if (grade === 4) xp = XP_REWARDS.GOOD;
    else if (grade === 3) xp = XP_REWARDS.HARD;
    else xp = XP_REWARDS.WRONG;
    
    addXP(xp);
    updateStreak();
    
    // Save to server
    saveCardReview(cardId, newCard.srsData!);

    if (onCardReviewed) {
      onCardReviewed(cardId, grade, newCard.srsData);
    }
  };

  const handleSessionComplete = async () => {
    await syncProgress();
    if (onSessionComplete) {
      onSessionComplete();
    }
  };

  const { 
    currentCard, 
    isSessionComplete, 
    submitReview, 
    progress,
    sessionStats
  } = useSRS({ 
    initialCards: effectiveCards, 
    onReview: handleReview,
    onComplete: handleSessionComplete 
  });

  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentCard]);

  useHotkeys('space', (e) => {
    e.preventDefault(); 
    if (!isSessionComplete) setIsFlipped(prev => !prev);
  }, [isSessionComplete]);
  
  useHotkeys('1', (e) => { e.preventDefault(); if (isFlipped && !isSessionComplete) submitReview(0); }, [isFlipped, isSessionComplete]);
  useHotkeys('2', (e) => { e.preventDefault(); if (isFlipped && !isSessionComplete) submitReview(3); }, [isFlipped, isSessionComplete]);
  useHotkeys('3', (e) => { e.preventDefault(); if (isFlipped && !isSessionComplete) submitReview(4); }, [isFlipped, isSessionComplete]);
  useHotkeys('4', (e) => { e.preventDefault(); if (isFlipped && !isSessionComplete) submitReview(5); }, [isFlipped, isSessionComplete]);

  const handleGrade = (grade: ReviewGrade) => {
    submitReview(grade);
  };

  if (isSessionComplete) {
    return (
      <div className="w-full min-h-[600px] flex flex-col">
         <GamificationHeader 
          currentXP={gamificationState.currentXP}
          level={gamificationState.level}
          streak={gamificationState.streak.current}
          nextLevelXP={calculateNextLevelXp(gamificationState.level)}
          prevLevelXP={calculateNextLevelXp(gamificationState.level - 1)}
          onExit={onExit}
        />
        <div className="flex-1 flex items-center justify-center">
          <SessionSummary 
            stats={{...sessionStats, xpEarned: Math.floor(sessionStats.correct * 10) + sessionStats.incorrect}} 
            heatmapData={gamificationState.studyHeatmap}
            onRestart={() => window.location.reload()} 
            onExit={onExit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[600px] flex flex-col gap-6 relative">

       <GamificationHeader 
          currentXP={gamificationState.currentXP}
          level={gamificationState.level}
          streak={gamificationState.streak.current}
          nextLevelXP={calculateNextLevelXp(gamificationState.level)}
          prevLevelXP={calculateNextLevelXp(gamificationState.level - 1)}
          onExit={onExit}
        />

      <div className="w-full max-w-2xl mx-auto space-y-2 px-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progresso da Sessão</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        <FlashcardComponent 
          data={currentCard} 
          isFlipped={isFlipped} 
          onFlip={() => setIsFlipped(!isFlipped)} 
        />

        <div className="h-20 flex items-center justify-center gap-4 w-full max-w-2xl transition-all">
          {!isFlipped ? (
             <Button size="lg" className="hidden w-full max-w-xs" onClick={() => setIsFlipped(true)}>
               Mostrar Resposta (Espaço)
             </Button>
          ) : (
            <div className="grid grid-cols-4 gap-2 w-full animate-in slide-in-from-bottom-4 fade-in">
              <div className="flex flex-col gap-1">
                 <Button variant="outline" className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={() => handleGrade(0)}>
                   Errei
                 </Button>
                 <span className="text-[10px] text-center text-muted-foreground font-mono">1</span>
              </div>
              <div className="flex flex-col gap-1">
                 <Button variant="outline" className="border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20" onClick={() => handleGrade(3)}>
                   Difícil
                 </Button>
                 <span className="text-[10px] text-center text-muted-foreground font-mono">2</span>
              </div>
              <div className="flex flex-col gap-1">
                 <Button variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" onClick={() => handleGrade(4)}>
                   Bom
                 </Button>
                 <span className="text-[10px] text-center text-muted-foreground font-mono">3</span>
              </div>
              <div className="flex flex-col gap-1">
                 <Button variant="outline" className="border-green-200 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20" onClick={() => handleGrade(5)}>
                   Fácil
                 </Button>
                 <span className="text-[10px] text-center text-muted-foreground font-mono">4</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlashcardSession(props: FlashcardSessionProps) {
  const [mode, setMode] = useState<'selection' | 'session'>('selection');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, { repetition: number, interval: number, lastReviewedAt?: string }>>({});
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLearnedModalOpen, setIsLearnedModalOpen] = useState(false);
  const gamification = useGamification({ initialUser: props.initialUser });

  useEffect(() => {
    const init = async () => {
      // Fetch decks and progress in parallel
      const [decksRes, statsRes] = await Promise.all([
        getDecks(),
        getUserLearningStats()
      ]);

      if (decksRes.success && decksRes.decks) {
        setDecks(decksRes.decks);
      }
      if (statsRes.success && statsRes.progressMap) {
        // @ts-ignore - casting is handled by the server action structure
        setProgressMap(statsRes.progressMap);
      }
    };
    init();
  }, []);

  const totalLearnedCards = Object.values(progressMap).length;

  const learnedCardsList = useMemo(() => {
    const list: Array<{ front: string, back: string, deckName: string, lastReviewedAt?: string }> = [];
    
    decks.forEach(deck => {
      deck.cards.forEach((card, index) => {
        const id = `${deck.id}-${index}`;
        const progress = progressMap[id];
        if (progress && progress.repetition > 0) {
          list.push({
            front: card.front,
            back: card.back,
            deckName: deck.title,
            lastReviewedAt: progress.lastReviewedAt
          });
        }
      });
    });
    
    // Sort by most recently reviewed
    return list.sort((a, b) => {
      if (!a.lastReviewedAt) return 1;
      if (!b.lastReviewedAt) return -1;
      return new Date(b.lastReviewedAt).getTime() - new Date(a.lastReviewedAt).getTime();
    });
  }, [decks, progressMap]);

  const handleStartDueSession = () => {
    setSessionCards(props.cards);
    setMode('session');
  };

  const handleStartDeckSession = async (deck: Deck) => {
    setIsLoading(true);
    try {
      // 1. Generate IDs for all cards in the deck
      const cardIds = deck.cards.map((_, index) => `${deck.id}-${index}`);
      
      // 2. Fetch progress for these cards (get full details)
      const res = await getDeckProgress(cardIds);
      
      if (!res.success) {
        toast.error("Erro ao carregar progresso do deck");
        setIsLoading(false);
        return;
      }

      const deckProgressMap = new Map(res.cards?.map(c => [c.id, c]));

      // 3. Merge deck cards with fetched progress
      const deckCards: Flashcard[] = deck.cards.map((card, index) => {
        const cardId = `${deck.id}-${index}`;
        const progress = deckProgressMap.get(cardId);
        
        return {
          id: cardId,
          front: card.front,
          back: card.back,
          category: card.category,
          srsData: progress?.srsData, // Use fetched SRS data
          lastReviewedAt: progress?.lastReviewedAt,
        };
      });

      setSessionCards(deckCards);
      setMode('session');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar sessão");
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'session') {
    return (
      <SessionRunner 
        {...props} 
        cards={sessionCards} 
        onExit={() => setMode('selection')}
        gamification={gamification}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Flashcards</h2>
          <p className="text-muted-foreground">Escolha um modo de estudo ou um deck específico.</p>
        </div>
        <div 
          className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg border border-border cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => setIsLearnedModalOpen(true)}
        >
          <BrainCircuit className="h-5 w-5 text-primary" />
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground font-medium uppercase">Total Aprendido</span>
            <span className="text-lg font-bold leading-none">{totalLearnedCards} cartões</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Due Review Card */}
        <Card 
          className={`transition-colors group ${props.cards.length > 0 ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          onClick={props.cards.length > 0 ? handleStartDueSession : undefined}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Revisão Diária
            </CardTitle>
            <CardDescription>
              Foque nos cartões que precisam de atenção hoje.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{props.cards.length}</span>
              <span className="text-sm text-muted-foreground">cartões pendentes</span>
            </div>
          </CardContent>
        </Card>

        {/* Available Decks */}
        {decks.map((deck) => {
          // Calculate progress for this deck
          const deckCardIds = deck.cards.map((_, i) => `${deck.id}-${i}`);
          const learnedCount = deckCardIds.filter(id => progressMap[id] && progressMap[id].repetition > 0).length;
          const totalCards = deck.cards.length;
          const percent = Math.round((learnedCount / totalCards) * 100) || 0;

          return (
            <Card key={deck.id} className="hover:border-primary/50 transition-colors cursor-pointer group flex flex-col" onClick={() => handleStartDeckSession(deck)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  {deck.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {deck.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{learnedCount}/{totalCards} ({percent}%)</span>
                   </div>
                   <Progress value={percent} className="h-1.5" />
                </div>

                {deck.tags && deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {deck.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="w-full p-4 bg-muted/30 rounded-lg flex justify-center">
        <ContributionHeatmap data={gamification.gamificationState.studyHeatmap} />
      </div>

      <Modal open={isLearnedModalOpen} onOpenChange={setIsLearnedModalOpen}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Cartões Aprendidos</ModalTitle>
            <ModalDescription>Lista de todos os cartões que você já estudou.</ModalDescription>
          </ModalHeader>
          <ScrollArea className="h-[400px] w-full pr-4">
             {learnedCardsList.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                 <BrainCircuit className="h-8 w-8 opacity-20" />
                 <p>Nenhum cartão aprendido ainda.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {learnedCardsList.map((card, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                     <div className="space-y-1">
                       <div className="font-medium">{card.front}</div>
                       <div className="text-sm text-muted-foreground">{card.back}</div>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                         <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {card.deckName}
                         </span>
                       </div>
                     </div>
                     {card.lastReviewedAt && (
                       <div className="text-xs text-muted-foreground text-right flex flex-col items-end gap-1">
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {format(new Date(card.lastReviewedAt), "dd/MM/yyyy", { locale: ptBR })}
                         </span>
                         <span>
                           {format(new Date(card.lastReviewedAt), "HH:mm", { locale: ptBR })}
                         </span>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </ScrollArea>
        </ModalContent>
      </Modal>
    </div>
  );
}
