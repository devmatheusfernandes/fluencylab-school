import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NodeViewWrapper } from '@tiptap/react';

const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const SentencesComponent = ({ node, updateAttributes }) => {
  const [sentences, setSentences] = useState(Array.isArray(node.attrs.sentences) ? node.attrs.sentences : ['']);
  const [feedback, setFeedback] = useState(node.attrs.feedback || []);
  const [loadingIndex, setLoadingIndex] = useState(null); // Track loading state per sentence

  const handleSentenceChange = (index, value) => {
    const updatedSentences = [...sentences];
    updatedSentences[index] = value;
    setSentences(updatedSentences);
    updateAttributes({ sentences: updatedSentences });
  };

  const handleKeyDown = async (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setLoadingIndex(index); // Show loading for this sentence

      const sentence = e.target.value;
      const updatedSentences = [...sentences];
      updatedSentences[index] = sentence;
      setSentences(updatedSentences);

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const text = node.attrs.text;
      const prompt = `Check if the following sentence is correct: "${sentence}" and if it uses at least one word of the vocabulary or a similar structure from the text: "${text}" and respond "Correct" if the sentence is correct.`;

      const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 500,
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_destructiveOUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      try {
        const chat = model.startChat({ generationConfig, safetySettings, history: [] });
        const result = await chat.sendMessage(prompt);
        const responseText = result.response.text();
        const updatedFeedback = [...feedback];

        if (responseText.includes('Correct')) {
          updatedFeedback[index] = 'Muito bem!';
        } else if (responseText.includes('Incorreto')) {
          updatedFeedback[index] = responseText.replace('Incorrect:', '').trim();
        } else {
          updatedFeedback[index] = 'Tente novamente.';
        }

        setFeedback(updatedFeedback);
        updateAttributes({ feedback: updatedFeedback });
        setSentences([...updatedSentences, '']);
      } catch (error) {
        console.error('Validation error:', error.message);
      } finally {
        setLoadingIndex(null); // Hide loading after validation completes
      }
    }
  };

  return (
    <NodeViewWrapper className="react-component">
      <p className='pb-1 font-bold'>Escreva frases baseadas no exemplo abaixo e aperte enter!</p>
      <div className="mb-4">
        <p className="font-semibold text-justify p-3 bg-muted text-foreground rounded-md">
          {node.attrs.text}
        </p>
      </div>

      {sentences.map((sentence, index) => (
        <div key={index} className="mb-3 flex flex-row items-center gap-4">
          <input
            type="text"
            value={sentence}
            onChange={(e) => handleSentenceChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            placeholder="Escreva uma frase baseada no vocabulário ou estrutura..."
            className="w-full bg-transparent border-b-2 border-dotted outline-none pl-1"
            disabled={loadingIndex === index} // Disable input while loading
          />
          
          {loadingIndex === index ? (
            <div className="w-[10rem] flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
          ) : (
            <p className={`w-[10rem] text-sm font-bold ${feedback[index] === 'Muito bem!' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback[index]}
            </p>
          )}
        </div>
      ))}
    </NodeViewWrapper>
  );
};

SentencesComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      text: PropTypes.string.isRequired,
      sentences: PropTypes.array.isRequired,
      feedback: PropTypes.array,
    }).isRequired,
  }).isRequired,
  updateAttributes: PropTypes.func.isRequired,
};

export default SentencesComponent;
