import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ReviewModal = ({ isOpen, onClose, editor }) => {
  const [title, setTitle] = useState('Personal Pronouns');
  const [reviewContent, setReviewContent] = useState(
    'Vimos que os pronomes são palavras bem úteis.\nHoje vimos: I, **you**, **we**, **they**. Ainda lembra o significado deles? Se não lembra, a atividade de casa vai te ajudar a memorizar.'
  );

  const handleInsert = () => {
    if (editor) {
      // Instead of inserting an HTML string, insert a JSON object
      // representing the node and its attributes. Tiptap will handle
      // the correct rendering and escaping.
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'review-component', // This must match the name in your Node.create()
          attrs: {
            title: title,
            reviewContent: reviewContent,
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
          <DialogTitle>Faixa de Revisão</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
          />
          <Textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            placeholder="Conteúdo"
            rows={6}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="success" onClick={handleInsert}>
              Inserir
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

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired, // Consider more specific shape if available
};

export default ReviewModal;
