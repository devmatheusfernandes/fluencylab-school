// TipTap Node Definition
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BandImageComponent from './BandImageComponent';

export default Node.create({
  name: 'imageTextComponent',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      imageUrl: {
        default: null,
      },
      text: {
        default: '',
      },
      position: {
        default: 'left',
      },
      size: {
        default: '100px',
      },
      height: {
        default: '5rem',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'image-text-component',
        getAttrs: (element) => ({
          imageUrl: element.getAttribute('imageUrl'),
          text: element.getAttribute('text'),
          position: element.getAttribute('position'),
          size: element.getAttribute('size'),
          height: element.getAttribute('height'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-text-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BandImageComponent);
  },
});