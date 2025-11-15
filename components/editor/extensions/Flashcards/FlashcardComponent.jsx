import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { motion } from 'framer-motion';
import './style.css';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FlashcardComponent = ({ node }) => {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState('normal'); // 'normal', 'type', 'srs'
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [srsData, setSrsData] = useState({});

  useEffect(() => {
    const loadCards = async () => {
      if (node?.attrs?.deckId) {
        const cardsQuery = collection(db, 'Flashcards', node.attrs.deckId, 'cards');
        const cardsSnapshot = await getDocs(cardsQuery);
        const cardsData = cardsSnapshot.docs.map(doc => ({
          ...doc.data(),
          repeatsLeft: 0,
          cooldown: 0,
        }));
        setCards(cardsData);
        setFilteredCards(cardsData);
        setCurrentIndex(0);
        setIsFlipped(false);
        setUserInput('');
        setFeedback(null);
      }
    };
    loadCards();
  }, [node?.attrs?.deckId]);

  // Navigate cards normally (prev/next) for 'normal' and 'type' modes
  const handleNavigation = (direction) => {
    if (filteredCards.length === 0) return;
    setFeedback(null);
    setUserInput('');
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      direction === 'next'
        ? (prevIndex + 1) % filteredCards.length
        : (prevIndex - 1 + filteredCards.length) % filteredCards.length
    );
  };

  // Improved SRS navigation with cooldown decrement and skip cooldown cards
  const goToNextCard = (cardsList = filteredCards) => {
    // Decrement cooldown for all cards
    const nextCards = cardsList.map(card => ({
      ...card,
      cooldown: Math.max(0, card.cooldown - 1),
    }));

    // Filter cards ready to show (cooldown === 0)
    const availableCards = nextCards.filter(card => card.cooldown === 0);

    if (availableCards.length === 0) {
      // If none available, just update cooldowns and wait
      setFilteredCards(nextCards);
      setUserInput('');
      setFeedback(null);
      setIsFlipped(false);
      return;
    }

    // Find first card with cooldown 0 to show
    const nextIndex = nextCards.findIndex(card => card.cooldown === 0);

    setFilteredCards(nextCards);
    setCurrentIndex(nextIndex);
    setUserInput('');
    setFeedback(null);
    setIsFlipped(false);
  };

  // Check user input answer in 'type' mode
  const checkAnswer = () => {
    const correct = userInput.trim().toLowerCase() === filteredCards[currentIndex]?.back?.trim().toLowerCase();
    setFeedback(correct ? 'correct' : 'incorrect');
    if (correct) {
      setTimeout(() => setIsFlipped(true), 300);
    }
  };

  // Improved SRS difficulty selection handler
  const handleSrsSelection = (difficulty) => {
    if (!filteredCards[currentIndex]) return;

    const updatedCards = [...filteredCards];
    const currentCard = updatedCards[currentIndex];

    if (difficulty === 'easy') {
      // Remove card from this round entirely
      updatedCards.splice(currentIndex, 1);
    } else {
      // Set repeatsLeft and cooldown based on difficulty
      currentCard.repeatsLeft = difficulty === 'medium' ? 1 : 2;
      currentCard.cooldown = difficulty === 'medium' ? 2 : 3;
    }

    setFilteredCards(updatedCards);
    setSrsData((prev) => ({
      ...prev,
      [currentCard.front]: difficulty,
    }));

    goToNextCard(updatedCards);
  };

  if (filteredCards.length === 0) {
    return (
      <NodeViewWrapper className="flashcard-loading flex flex-col items-center justify-center">
        Sem flashcards.
        <button
          onClick={() => {
            // Reset all cards with initial values
            const resetCards = cards.map(card => ({
              ...card,
              repeatsLeft: 0,
              cooldown: 0,
            }));
            setFilteredCards(resetCards);
            setCurrentIndex(0);
            setIsFlipped(false);
            setUserInput('');
            setFeedback(null);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Recomeçar
        </button>
      </NodeViewWrapper>
    );
  }

  const currentCard = filteredCards[currentIndex] || {};

  return (
    <NodeViewWrapper className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-row items-center justify-center gap-4 bg-gray-700 text-white p-2 px-4 rounded-md">
        <Button variant={mode === 'normal' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('normal')}>Normal</Button>
        <Button variant={mode === 'type' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('type')}>Digite</Button>
        <Button variant={mode === 'srs' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('srs')}>Repetição</Button>
      </div>

      <div className="flex flex-row items-center justify-center w-full gap-2">
        <Button variant="ghost" size="icon" onClick={() => (mode === 'srs' ? goToNextCard() : handleNavigation('prev'))}>
          <ChevronLeftIcon className="size-5" />
        </Button>

        <div className="flashcard-wrapper cursor-pointer" onClick={() => mode !== 'type' && setIsFlipped(!isFlipped)}>
          <motion.div
            className={`flashcard ${feedback}`}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ transformStyle: 'preserve-3d', position: 'relative' }}
          >
            <div
              className="card-front px-6 py-4"
              style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }}
            >
              {currentCard?.front}
            </div>
            <div
              className="card-back px-6 py-4"
              style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%', transform: 'rotateY(180deg)' }}
            >
              {currentCard?.back}
            </div>
          </motion.div>
        </div>

        <Button variant="ghost" size="icon" onClick={() => (mode === 'srs' ? goToNextCard() : handleNavigation('next'))}>
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>

      {mode === 'type' && (
        <div className="flex flex-row items-center justify-center gap-2 w-full">
          <div className="relative w-64">
            <Input
              className={`px-2 py-1 outline-none rounded-md font-semibold w-full pr-10
                ${
                  feedback === 'correct'
                    ? 'bg-green-600 text-white'
                    : feedback === 'incorrect'
                    ? 'bg-red-600 text-white'
                    : ''
                }`}
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') checkAnswer();
              }}
            />
            <Button
              onClick={checkAnswer}
              title="Check answer"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              size="icon"
              variant="ghost"
              tabIndex={-1}
            >
              <CheckCircleIcon className="size-5" />
            </Button>
          </div>
        </div>
      )}

      {mode === 'srs' && isFlipped && (
        <div className="flex flex-row items-center justify-center gap-1 mt-4">
          <Button variant="success" onClick={() => handleSrsSelection('easy')}>Fácil</Button>
          <Button variant="warning" onClick={() => handleSrsSelection('medium')}>Médio</Button>
          <Button variant="destructive" onClick={() => handleSrsSelection('hard')}>Difícil</Button>
        </div>
      )}

      {/* Progress text and cooldown info */}
      {mode === 'srs' && (
        <div className="text-sm text-center mt-2 text-gray-400">
          {filteredCards.length} carta(s) restante(s).{' '}
          {filteredCards.some(c => c.cooldown > 0) && (
            <span className="text-yellow-400">
              Aguardando {filteredCards.filter(c => c.cooldown > 0).length} carta(s) em cooldown...
            </span>
          )}
        </div>
      )}

      {/* Navigation index */}
      <div className="card-navigation text-center text-white">
        <span>
          {filteredCards.length === 0 ? 0 : currentIndex + 1}/{filteredCards.length}
        </span>
      </div>
    </NodeViewWrapper>
  );
};

export default FlashcardComponent;
