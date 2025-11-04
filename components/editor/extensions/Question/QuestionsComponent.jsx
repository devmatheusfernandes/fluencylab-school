import React, { useState, useEffect, useRef } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';
import { useSession } from 'next-auth/react';

const QuestionsComponent = ({ node, updateAttributes }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin'; // Assuming `role` is available in the session
  const [userAnswer, setUserAnswer] = useState(node.attrs.userAnswer || '');
  const [isCorrect, setIsCorrect] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSentence, setEditedSentence] = useState(node.attrs.sentence);
  const [editedAnswer, setEditedAnswer] = useState(node.attrs.answer);
  const inputRef = useRef(null);

  const { sentence, answer } = node.attrs;

  // Check if the userAnswer matches the correct answer
  useEffect(() => {
    const trimmedUserAnswer = userAnswer.trim().toLowerCase();
    const trimmedCorrectAnswer = answer.trim().toLowerCase();
    setIsCorrect(trimmedUserAnswer === trimmedCorrectAnswer);

    // Update the node's attributes with the user's answer
    updateAttributes({ userAnswer });
  }, [userAnswer, answer, updateAttributes]);

  useEffect(() => {
    if (inputRef.current) {
      // Adjust the input width to fit the content
      inputRef.current.style.width = '2rem'; // Reset width to measure the content
      inputRef.current.style.width = `${inputRef.current.scrollWidth}px`;
    }
  }, [userAnswer]);

  const handleChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const saveChanges = () => {
    updateAttributes({ sentence: editedSentence, answer: editedAnswer });
    setIsEditing(false);
  };

  const parts = sentence.split('{{gap}}');

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col items-start w-full">
        {!isEditing ? (
          <>
            <p className="mb-2 ml-3">
              {parts[0]}
              <input
                type="text"
                ref={inputRef}
                className={`bg-transparent border-b-2 border-dotted outline-none pl-1 focus:border-blue-500 ${
                  isCorrect === true
                    ? 'text-green-500 font-bold'
                    : isCorrect === false
                    ? 'text-red-500 font-bold'
                    : 'text-black'
                }`}
                value={userAnswer}
                onChange={handleChange}
                style={{ width: 'auto', minWidth: '2rem' }}
              />
              {parts[1]}
            </p>
          </>
        ) : (
          <>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Editar Frase:</label>
              <textarea
                className="border rounded p-2 w-full"
                value={editedSentence}
                onChange={(e) => setEditedSentence(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Editar Resposta:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveChanges}
                className="bg-green-500 text-white px-2 py-1 rounded-md text-sm font-bold"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-bold"
          >
            Editar
          </button>
        )}

        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

// Define PropTypes for ExerciseComponent
QuestionsComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      sentence: PropTypes.string.isRequired,
      answer: PropTypes.string.isRequired,
      userAnswer: PropTypes.string, // Optional attribute for user's answer
    }).isRequired,
  }).isRequired,
  updateAttributes: PropTypes.func.isRequired, // Function to update the node attributes
};

export default QuestionsComponent;
