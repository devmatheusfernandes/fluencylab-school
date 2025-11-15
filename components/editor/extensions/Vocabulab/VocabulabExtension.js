import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VocabLabComponent from './VocabulabComponent';

export default Node.create({
  name: 'vocabLabComponent',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      sentences1: {
        default: 'Are you __? How are you?\nI am __.\nWhere are you?',
      },
      words: {
        default: 'tired, happy, sad, hungry, angry, sleepy, scared, good, sick',
      },
      sentences2: {
        default: 'We are __.\nYou are __.\nThey are not __.',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'vocab-lab-component',
        getAttrs: (element) => ({
          sentences1: element.getAttribute('sentences1'),
          words: element.getAttribute('words'),
          sentences2: element.getAttribute('sentences2'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['vocab-lab-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VocabLabComponent);
  },
});
