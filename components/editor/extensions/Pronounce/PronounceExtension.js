import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PronounceComponent from './PronounceComponent';

export default Node.create({
  name: 'speakingComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      audioId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'speaking-component',
        getAttrs: (element) => ({
          audioId: element.getAttribute('audioId'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['speaking-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PronounceComponent);
  },
});

