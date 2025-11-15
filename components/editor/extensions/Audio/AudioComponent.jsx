import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
// import AudioPlayer from '@/app/SharedPages/Games/listening/component/playerComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { toast } from 'sonner';

const AudioComponent = ({ node }) => {
  const { audioId } = node.attrs;
  const [randomDocument, setRandomDocument] = useState(null);
  const [wordInputs, setWordInputs] = useState([]);
  const [inputsDisabled, setInputsDisabled] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [shouldPlayAgain, setShouldPlayAgain] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);

  // New state to toggle mode: 'listening' or 'practice'
  const [mode, setMode] = useState('listening');

  useEffect(() => {
    if (!audioId) {
      console.error('No audio ID provided');
      return;
    }

    const fetchNivelamentoData = async () => {
      try {
        const docRef = doc(db, 'Nivelamento', audioId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRandomDocument({
            id: docSnap.id,
            transcript: data.transcript,
            url: data.url,
            name: data.name,
          });
          setSelectedAudio(data.url);
          prepareWordInputs(data.transcript);
          setTranscript(data.transcript);
        } else {
          console.error('Document does not exist.');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    fetchNivelamentoData();
  }, [audioId]);

  const prepareWordInputs = (transcript) => {
    const words = transcript.split(' ');
    const inputIndicesSet = new Set();
    while (inputIndicesSet.size < Math.floor(words.length * 0.2)) {
      inputIndicesSet.add(Math.floor(Math.random() * words.length));
    }

    const inputs = words.map((word, index) => ({
      word,
      isInput: inputIndicesSet.has(index),
      userAnswer: '',
      isCorrect: null,
    }));

    setWordInputs(inputs);
    setInputsDisabled(false);
  };

  const checkAnswers = () => {
    const emptyFields = wordInputs.filter(input => input.isInput && input.userAnswer.trim() === '').length;
    if (emptyFields === wordInputs.filter(input => input.isInput).length) {
      toast.error('Coloque pelo menos uma palavra!', {
        position: 'top-center',
      });
      return null;
    }

    const updatedWordInputs = wordInputs.map(input => {
      if (input.isInput) {
        const cleanWord = input.word.replace(/[!?]/g, '').toLowerCase();
        const cleanUserAnswer = input.userAnswer.trim().replace(/[!?]/g, '').toLowerCase();
        const isCorrect = cleanWord === cleanUserAnswer;
        return { ...input, isCorrect };
      }
      return input;
    });

    setWordInputs(updatedWordInputs);
    setInputsDisabled(true);
  };

  const handleInputChange = (index, event) => {
    const { value } = event.target;
    const updatedWordInputs = [...wordInputs];
    updatedWordInputs[index].userAnswer = value;
    setWordInputs(updatedWordInputs);
  };

  const handlePlayAgain = () => {
    prepareWordInputs(randomDocument?.transcript || '');
  };

  useEffect(() => {
    if (shouldPlayAgain) {
      prepareWordInputs(randomDocument?.transcript || '');
      setShouldPlayAgain(false);
    }
  }, [shouldPlayAgain, randomDocument]);

  const toggleTranscriptVisibility = () => {
    setIsTranscriptVisible(!isTranscriptVisible);
  };

  const toggleShowAllWords = () => {
    setShowAllWords(!showAllWords);
  };

  // Toggle mode function
  const toggleMode = () => {
    setMode(prev => (prev === 'practice' ? 'listening' : 'practice'));
  };

  const getWordDisplay = (input, index) => {
    if (showAllWords) {
      return input.word;
    }
    return input.isInput ? (
      <Input
        type="text"
        className={`max-w-[15%] mx-1 font-bold bg-transparent border-dashed border-b-[1px] outline-none ${input.isCorrect === true ? 'text-green-500' : input.isCorrect === false ? 'text-red-500' : 'text-black dark:text-white'}`}
        value={input.userAnswer}
        onChange={(e) => handleInputChange(index, e)}
        disabled={inputsDisabled}
      />
    ) : input.word;
  };

  return (
    <NodeViewWrapper className="react-component">
      <div className='h-min w-full flex flex-col justify-center items-center'>
        <div className='w-full text-justify flex flex-col gap-1 items-center justify-center rounded-md text-lg'>
          {/* {selectedAudio && <AudioPlayer src={selectedAudio} mode={mode} toggleMode={toggleMode} />} */}
          {randomDocument && mode === 'practice' && (
            <div className='flex flex-col items-center gap-2' key={randomDocument.id}>
              <div className='flex flex-col sm:flex-row gap-0 sm:gap-2'>
                <Button className='mt-4' onClick={toggleTranscriptVisibility}>
                  {isTranscriptVisible ? 'Esconder texto' : 'Mostrar texto'}
                </Button>
                <Button className='mt-4' variant='success' onClick={toggleShowAllWords}>
                  {showAllWords ? 'Esconder respostas' : 'Mostrar respostas'}
                </Button>
              </div>
              {isTranscriptVisible && (
                <>
                  <div className='h-max overflow-hidden overflow-y-scroll p-10 rounded-md'>
                    {wordInputs.map((input, index) => (
                      <span className='w-full' key={index}>
                        {getWordDisplay(input, index)}
                        {' '}
                      </span>
                    ))}
                  </div>
                  {inputsDisabled ? (
                    <div className='flex flex-row gap-2 items-center'>
                      <Button className='mt-4 flex flex-row items-center' variant='warning' onClick={handlePlayAgain}>
                        Jogar novamente
                      </Button>
                    </div>
                  ) : (
                    <Button variant='outline' onClick={checkAnswers}>
                      Verificar Respostas
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <NodeViewContent className="content is-editable" />
    </NodeViewWrapper>
  );
};

export default AudioComponent;
