// FlashcardExtension.js
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FlashcardComponent from './FlashcardComponent'

export default Node.create({
  name: 'flashcard',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

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
      tag: 'div[data-flashcard]',
      getAttrs: dom => {
        const deckId = dom.getAttribute('data-deck-id')
        return deckId ? { deckId } : false
      }
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      'data-flashcard': '',
      'data-deck-id': HTMLAttributes.deckId,
      'class': 'flashcard-node'
    }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlashcardComponent, {
      // Ensure proper DOM handling
      as: 'div',
      contentDOMElementTag: 'div',
      
      // Add proper cleanup
      destroy() {
        // Cleanup any event listeners or timers here if needed
      }
    })
  },

  // Add keyboard shortcuts for deletion
  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => {
        const { selection } = editor.state
        const { $from } = selection
        
        // Check if we're at a flashcard node
        if ($from.parent.type.name === this.name) {
          return editor.commands.deleteSelection()
        }
        
        return false
      },
      'Delete': ({ editor }) => {
        const { selection } = editor.state
        const { $from } = selection
        
        // Check if we're at a flashcard node
        if ($from.parent.type.name === this.name) {
          return editor.commands.deleteSelection()
        }
        
        return false
      }
    }
  },

  // Add commands for better node management
  addCommands() {
    return {
      insertFlashcard: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
      
      updateFlashcard: (attributes) => ({ commands }) => {
        return commands.updateAttributes(this.name, attributes)
      },
      
      deleteFlashcard: () => ({ commands }) => {
        return commands.deleteSelection()
      }
    }
  }
})