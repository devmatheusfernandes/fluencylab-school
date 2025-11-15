import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BandVideoComponent from './BandVideoComponent';

export default Node.create({
  name: 'embedComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'embed-component',
        getAttrs: (element) => ({
          url: element.getAttribute('url'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['embed-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BandVideoComponent);
  },
});
