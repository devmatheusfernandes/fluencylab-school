import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MultipleChoiceComponent from './MultipleChoiceComponent';

export default Node.create({
  name: 'multipleChoice',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      question: { default: '' },
      options: { default: '["", "", "", ""]' },
      correctOption: { default: null },
      answer: { default: null }, // Add answer to store the selected answer
    };
  },

  parseHTML() {
    return [
      {
        tag: 'multiple-choice',
        getAttrs: (element) => ({
          question: element.getAttribute('question'),
          options: element.getAttribute('options'),
          correctOption: parseInt(element.getAttribute('correctOption'), 10),
          answer: element.getAttribute('answer') ? parseInt(element.getAttribute('answer'), 10) : null,  // Parse the selected answer
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['multiple-choice', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MultipleChoiceComponent); // This will automatically pass updateAttributes
  },
});
