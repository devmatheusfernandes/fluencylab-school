import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TextTeacherComponent from './TextTeacherComponent';

export default Node.create({
  name: 'teacherComponent',

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
        tag: 'teacher-component',
        getAttrs: (element) => ({
          text: element.getAttribute('text'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['teacher-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextTeacherComponent);
  },
});

