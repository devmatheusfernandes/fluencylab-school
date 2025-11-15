import React, { useState, useEffect } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import PropTypes from 'prop-types';
import { useSession } from 'next-auth/react';

const MultipleChoiceComponent = ({ node, updateAttributes }) => {
  const { data: session } = useSession(); // Use session to check if user is admin
  const isAdmin = session?.user?.role === 'admin'; // Assuming 'role' determines admin status

  const [userAnswer, setUserAnswer] = useState(node.attrs.answer);
  const [isCorrect, setIsCorrect] = useState(null);
  const [hasSelectedOption, setHasSelectedOption] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
  const [editableQuestion, setEditableQuestion] = useState(node.attrs.question);
  const [editableOptions, setEditableOptions] = useState(() => {
    if (Array.isArray(node.attrs.options)) {
      return node.attrs.options; // Use directly if it's an array
    }
    try {
      return JSON.parse(node.attrs.options); // Try parsing if it's a string
    } catch (error) {
      console.error('Failed to parse options:', error, 'Original options:', node.attrs.options);
      return []; // Default to an empty array if parsing fails
    }
  });
  

  const { correctOption } = node.attrs;

  useEffect(() => {
    if (userAnswer !== null) {
      setIsCorrect(userAnswer === correctOption);
      setHasSelectedOption(true);

      // Persist answer
      updateAttributes({ answer: userAnswer });
    }
  }, [userAnswer, correctOption, updateAttributes]);

  const handleOptionSelect = (index) => {
    if (!hasSelectedOption) {
      setUserAnswer(index);
    }
  };

  const saveEdits = () => {
    updateAttributes({
      question: editableQuestion,
      options: JSON.stringify(editableOptions),
    });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="react-component">
      <div className="flex flex-col items-start w-full">
        {isEditing ? (
          <>
            <textarea
              value={editableQuestion}
              onChange={(e) => setEditableQuestion(e.target.value)}
              className="mb-2 w-full border rounded p-2"
              placeholder="Editar pergunta"
            />
            {editableOptions.map((option, index) => (
              <div key={index} className="mb-1 flex items-center w-full">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const updatedOptions = [...editableOptions];
                    updatedOptions[index] = e.target.value;
                    setEditableOptions(updatedOptions);
                  }}
                  className="w-full border rounded p-1 pl-2"
                  placeholder={`Edit option ${index + 1}`}
                />
              </div>
            ))}
            
            <div className='flex flex-row gap-1 mt-2'>
              <button onClick={saveEdits} className="bg-green-500 text-white px-2 py-1 rounded-md text-sm font-bold">
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
        ) : (
          <>
            <h3 className="option-h3 text-[16px]">{editableQuestion}</h3>
            <ul className="options-list list-decimal ml-4">
              {editableOptions.map((option, index) => (
                <li
                  key={index}
                  className={`option ${hasSelectedOption && (index === correctOption ? 'correct' : 'incorrect')} ${
                    hasSelectedOption ? 'disabled' : ''
                  }`}
                  onClick={() => handleOptionSelect(index)}
                  style={{ cursor: hasSelectedOption ? 'not-allowed' : 'pointer' }}
                >
                  {option}
                </li>
              ))}
            </ul>
            {hasSelectedOption && (
              <div className={`feedback ml-4 mt-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? 'Correto!' : 'Incorreto.'}
              </div>
            )}
          </>
        )}

        {/* Admin-only Edit Button */}
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-bold mt-1"
          >
            Editar
          </button>
        )}
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

MultipleChoiceComponent.propTypes = {
  node: PropTypes.shape({
    attrs: PropTypes.shape({
      question: PropTypes.string.isRequired,
      options: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
      correctOption: PropTypes.number.isRequired,
      answer: PropTypes.number,
    }).isRequired,
  }).isRequired,
  updateAttributes: PropTypes.func.isRequired,
};

export default MultipleChoiceComponent;
