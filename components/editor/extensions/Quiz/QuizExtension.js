// QuizExtension.js
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import QuizComponent from './QuizComponent'

export default Node.create({
  name: 'quiz',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      deckId: {
        default: null,
        parseHTML: element => element.getAttribute('data-deck-id'),
        renderHTML: attributes => {
          if (!attributes.deckId) {
            return {}
          }
          return {
            'data-deck-id': attributes.deckId
          }
        }
      }
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-quiz]',
      getAttrs: dom => ({
        deckId: dom.getAttribute('data-deck-id')
      })
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      'data-quiz': '',
      'data-deck-id': HTMLAttributes.deckId,
      class: 'quiz-node'
    }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuizComponent, {
      // Configurações para melhor compatibilidade
      as: 'div',
      className: 'quiz-node-wrapper',
      // Passa as props necessárias para o componente
      contentDOMElementTag: 'div'
    })
  },

  addCommands() {
    return {
      setQuiz: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
      
      removeQuiz: () => ({ tr, state }) => {
        const { selection } = state
        const { from, to } = selection
        
        // Procura por nós de quiz na seleção atual
        let quizNodePos = null
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === 'quiz') {
            quizNodePos = pos
            return false // Para a busca
          }
        })
        
        if (quizNodePos !== null) {
          tr.delete(quizNodePos, quizNodePos + 1)
          return true
        }
        
        return false
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => {
        const { selection } = editor.state
        const { $from } = selection
        
        // Verifica se estamos em um nó de quiz
        if ($from.parent.type.name === 'quiz') {
          return editor.commands.deleteSelection()
        }
        
        return false
      },
      
      'Delete': ({ editor }) => {
        const { selection } = editor.state
        const { $from } = selection
        
        // Verifica se estamos em um nó de quiz
        if ($from.parent.type.name === 'quiz') {
          return editor.commands.deleteSelection()
        }
        
        return false
      }
    }
  }
})