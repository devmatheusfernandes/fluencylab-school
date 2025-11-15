import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TextStudentModal = ({ isOpen, onClose, initialText, editor }) => {
  // State to manage the input text
  const [text, setText] = useState(initialText);

    const handleText = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'studentComponent', // This must match the name in your Node.create()
          attrs: {
            text: text,
          },
        })
        .run();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Texto de Instrução para aluno</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o texto para aluno aqui"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="success"
              onClick={() => {
                handleText(text);
                onClose();
              }}
            >
              Salvar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

TextStudentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialText: PropTypes.string.isRequired, // Renamed to initialText
  editor: PropTypes.object.isRequired, // Assuming editor is an object
};

export default TextStudentModal;
