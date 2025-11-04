import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import QuestionsComponent from './QuestionsComponent';

export default Node.create({
  name: 'exerciseComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      sentence: {
        default: null,
      },
      answer: {
        default: null,
      },
      userAnswer: {
        default: '', // To store the user's answer
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'exercise-component',
        getAttrs: (element) => ({
          sentence: element.getAttribute('sentence'),
          answer: element.getAttribute('answer'),
          userAnswer: element.getAttribute('userAnswer') || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['exercise-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestionsComponent);
  },
});
