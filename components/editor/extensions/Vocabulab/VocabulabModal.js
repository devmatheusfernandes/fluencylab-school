import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const VocabLabModal = ({ isOpen, onClose, editor }) => {
  const [sentences1, setSentences1] = useState('Are you __?\nHow are you?\nI am __.\nWhere are you?');
  const [words, setWords] = useState('tired, happy, sad, hungry, angry, sleepy, scared, good, sick');
  const [sentences2, setSentences2] = useState('We are __.\nYou are __.\nThey are not __.');

  const handleInsert = () => {
    if (editor) {
      editor
        .chain().focus().insertContent(
          `<vocab-lab-component sentences1="${sentences1}" words="${words}" sentences2="${sentences2}"></vocab-lab-component>`
        ).run();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar VocabuLab</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <div className='w-full flex flex-col items-start justify-center gap-2'>
            <p className='font-bold'>Primeiros comandos ou frases</p>
            <Textarea
              value={sentences1}
              onChange={(e) => setSentences1(e.target.value)}
              placeholder="First Section Sentences"
              rows={4}
            />
          </div>
          <div className='w-full flex flex-col items-start justify-center gap-2'>
            <p className='font-bold'>Word Bank</p>
            <Input
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="Word Bank (comma-separated)"
            />
          </div>
          <div className='w-full flex flex-col items-start justify-center gap-2'>
            <p className='font-bold'>Sessão de prática</p>
            <Textarea
              value={sentences2}
              onChange={(e) => setSentences2(e.target.value)}
              placeholder="Second Section Sentences"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="success" onClick={handleInsert}>Inserir</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

VocabLabModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default VocabLabModal;
