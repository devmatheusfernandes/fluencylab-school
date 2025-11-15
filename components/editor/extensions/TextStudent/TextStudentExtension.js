import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TextStudentComponent from './TextStudentComponent';

export default Node.create({
  name: 'studentComponent',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'student-component',
        getAttrs: (element) => ({
          text: element.getAttribute('text'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['student-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextStudentComponent);
  },
});

