import React from 'react';
import { useState } from 'react';

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import PropTypes from 'prop-types';
// import Image from 'next/image';

// import HeaderImage from '../../../../../../../public/images/apostila/vocabulab.png';
// import ExampleImage from '../../../../../../../public/images/apostila/wordscomand.png';
// import ChemistryImage from '../../../../../../../public/images/apostila/potion.png';
// import PotionMiddle from '../../../../../../../public/images/apostila/potionmiddle.png';
// import TeacherImage from '../../../../../../../public/images/apostila/teacher.png';
// import TipImage from '../../../../../../../public/images/apostila/tip.png';

const VocabLabComponent = ({ node }) => {
  const { sentences1, words, sentences2 } = node.attrs;
  const firstSentences = sentences1 ? sentences1.split('\n') : [];
  const wordList = words ? words.split(',') : [];
  const secondSentences = sentences2 ? sentences2.split('\n') : [];

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col text-black dark:text-white p-4 my-4">
        {/* Title Vocabulab */}
        <div className="flex justify-center relative lg:-top-10 md:-top-5 -top-4 w-full h-fit">
          {/* <Image src={HeaderImage} alt="Vocab Lab Title" className="w-[18rem] h-auto !rounded-none" /> */}
        </div>

        {/* Section 1: Image and sentences to practice */}
        <div className="w-full h-fit flex flex-row justify-center items-center gap-4 mb-6">
          {/* <Image src={ExampleImage} alt="Example Image" className="w-20 h-auto !rounded-none" /> */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-8 gap-y-2">
            {firstSentences.map((sentence, index) => (
              <p key={index} className="text-lg font-semibold whitespace-nowrap">
                {sentence}
              </p>
            ))}
          </div>
        </div>

        <div className='lg:relative block top-10 left-[14rem] md:flex flex-row items-center justify-center bg-muted text-foreground lg:w-[70%] lg:h-[7rem] md:h-full h-fit rounded-3xl lg:mb-20 mb-10 lg:py-0 md:py-2 py-0'>
          <div className='flex flex-row justify-between lg:items-center items-center overflow-hidden'>
            <p className='text-md text-center w-full font-semibold ml-8'>Agora podem treinar primeiro as frases acima!</p>
            {/* <Image src={TeacherImage} alt="Teacher" className='w-[7rem] bottom-3 h-auto relative !rounded-none' /> */}
          </div>
        </div>

        {/* Section 2: Words with Hover Audio */}
        <div className="flex flex-row items-center lg:justify-center md:justify-center justify-center relative lg:rounded-r-2xl md:rounded-2xl rounded-2xl overflow-visible lg:h-[16.5rem] md:h-fit h-fit lg:py-0 md:py-4 py-4 mb-8">
          {/* <Image src={PotionMiddle} alt="Chemistry Icon" className="lg:block md:hidden hidden w-[7rem] h-auto !rounded-none" /> */}

          <div className='flex flex-col items-center justify-center gap-4 p-4'>
            <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-x-12 gap-y-8 mb-2">
              {wordList.map((word, index) => (
                <SpeakWord key={index} word={word.trim()} />
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-row items-center justify-center bg-muted text-foreground w-full h-min rounded-3xl px-4 mb-8'>
          <div className='w-full lg:flex lg:flex-row md:flex md:flex-row flex flex-col justify-between items-center'>
            {/* <Image src={TipImage} alt="Teacher" className='lg:w-[13%] w-[16%] h-auto !rounded-none' /> */}
            <p className='lg:p-7 md:p-5 p-3 text-md text-start w-full max-w-[95%] font-semibold'>Para conseguir lembrar e falar bem as palavras pronuncie cada uma com bastante convicção. Não precisa ter vergonha!</p>
          </div>
        </div>

        {/* Section 3: Two-column sentences with image in the middle */}
        <div className="p-4">
          <div className='flex flex-col items-center justify-center'>
            <p className='font-bold text-xl mb-5 p-4'>Agora é sua vez de praticar!</p>
            <div className='lg:flex lg:flex-row md:flex md:flex-row flex flex-col w-fit justify-evenly gap-12'>
              {/* First Column */}
              <div className="flex-1 flex flex-col gap-2 px-4">
                {secondSentences
                  .map((sentence, index) => (
                    <p key={`left-${index}`} className="text-lg font-semibold whitespace-nowrap">
                      {sentence}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

VocabLabComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      sentences1: PropTypes.string.isRequired,
      words: PropTypes.string.isRequired,
      sentences2: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default VocabLabComponent;


const SpeakWord = ({ word }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const speak = () => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;

      // Ensure voices are loaded
      const voices = synth.getVoices();
      if (voices.length === 0) {
        console.warn("No voices are available. Speech synthesis might not work properly.");
        return;
      }

      // Create an utterance
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';

      // Select an appropriate voice
      const voice = voices.find((v) => v.lang === 'en-US') || voices[0];
      utterance.voice = voice;

      // Speak the word
      synth.cancel(); // Cancel any ongoing speech to prevent overlap
      synth.speak(utterance);
    } else {
      alert('Speech synthesis is not supported in your browser.');
    }
  };

  return (
    <div
      className="relative inline-block cursor-pointer group"
      onMouseEnter={() => {
        setShowTooltip(true);
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
          Clique para ouvir
        </div>
      )}

      {/* Word */}
      <span
        onClick={speak}
        className="cursor-pointer hover:text-primary ease-in-out transition-all duration-300 font-bold"
      >
        {word}
      </span>
    </div>
  );
};

SpeakWord.propTypes = {
  word: PropTypes.string.isRequired,
};
