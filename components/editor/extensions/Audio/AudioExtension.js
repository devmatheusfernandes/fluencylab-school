import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AudioComponent from './AudioComponent';

export default Node.create({
  name: 'listeningComponent',

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
        tag: 'listening-component',
        getAttrs: (element) => ({
          audioId: element.getAttribute('audioId'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['listening-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioComponent);
  },
});
