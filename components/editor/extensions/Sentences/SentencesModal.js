import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SentencesModal = ({ isOpen, onClose, editor }) => {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) {
      alert('Please enter a valid text.');
      return;
    }
    editor.chain().focus().insertContent(`<sentences-component text="${text}" sentences="[]" feedback="[]"></sentences-component>`).run();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exercício de escrita</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Coloque um texto ou frase de exemplo aqui. Seu aluno terá que fazer frases baseadas no exemplo que você prover. Quantas ele conseguir."
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <Button variant="success" onClick={handleSave}>Inserir</Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

SentencesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default SentencesModal;
