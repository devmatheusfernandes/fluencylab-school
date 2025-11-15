import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TranslationComponent from './TranslationComponent';

export default Node.create({
  name: 'translationComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      originalSentence: {
        default: '',
      },
      sentenceNumber: {
        default: 1, // Set a default number if needed
      },
      correctTranslation: {
        default: '',
      },
      userTranslation: {
        default: '',
      },
      feedback: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'translation-component',
        getAttrs: (element) => ({
          originalSentence: element.getAttribute('originalSentence'),
          correctTranslation: element.getAttribute('correctTranslation'),
          sentenceNumber: parseInt(element.getAttribute('sentenceNumber'), 10),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['translation-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TranslationComponent);
  },
});
