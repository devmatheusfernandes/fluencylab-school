import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SentencesComponent from './SentencesComponent';

export default Node.create({
  name: 'sentencesComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: '',
      },
      sentences: {
        default: [],
      },
      feedback: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sentences-component',
        getAttrs: (element) => {
          let sentences = [];
          let feedback = [];

          try {
            sentences = JSON.parse(element.getAttribute('sentences') || '[]');
          } catch (error) {
            console.warn('Invalid JSON for sentences:', element.getAttribute('sentences'));
          }

          try {
            feedback = JSON.parse(element.getAttribute('feedback') || '[]');
          } catch (error) {
            console.warn('Invalid JSON for feedback:', element.getAttribute('feedback'));
          }

          return {
            text: element.getAttribute('text') || '',
            sentences,
            feedback,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sentences-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SentencesComponent);
  },
});
