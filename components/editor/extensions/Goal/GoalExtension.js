// TipTap Node Definition
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import GoalComponent from './GoalComponent';

export default Node.create({
  name: 'goalComponent',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: 'Weekly Goals',
      },
      description: {
        default: 'Objetivo: Estudar todos os dias pelo menos 10 minutos.',
      },
      schedule: {
        default: 'Dia 1 - Criar Flashcards dos pronomes.\nDia 2 - Ler os flashcards em voz alta.\nDia 3 - Fazer atividade 1.\nDia 4 - Revisar anotações e flashcards.\nDia 5 - Fazer atividade 2.\nDia 6 - Revisar flashcards e terminar o homework.',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'goal-component',
        getAttrs: (element) => ({
          title: element.getAttribute('title'),
          description: element.getAttribute('description'),
          schedule: element.getAttribute('schedule'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['goal-component', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GoalComponent);
  },
});