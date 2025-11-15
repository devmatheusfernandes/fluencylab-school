import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ReviewComponent from './ReviewComponent';

export default Node.create({
  name: 'reviewComponent',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: 'Personal Pronouns',
      },
      reviewContent: {
        default:
          'Vimos que os pronomes são palavras bem úteis.\nHoje vimos: I, **you**, **we**, **they**. Ainda lembra o significado deles? Se não lembra, a atividade de casa vai te ajudar a memorizar.',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'review-component',
        getAttrs: (element) => ({
          title: element.getAttribute('title'),
          reviewContent: element.getAttribute('reviewContent'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['review-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReviewComponent);
  },
});
