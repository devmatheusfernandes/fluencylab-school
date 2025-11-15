import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TranslationModal = ({ isOpen, onClose, editor }) => {
  const [header, setHeader] = useState(''); // Input for instruction/header
  const [sentences, setSentences] = useState(['']); // List of sentences
  const [feedback, setFeedback] = useState('');

  const handleAddSentence = () => {
    setSentences([...sentences, '']);
  };

  const handleSentenceChange = (index, value) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  const handleSave = () => {
    if (!sentences.every(sentence => sentence.trim())) {
      toast.error('All sentences are required.');
      return;
    }

    const sentencesContent = sentences
      .map((sentence, index) => {
        return `<translation-component originalSentence="${sentence}" sentenceNumber="${index + 1}"></translation-component>`;
      })
      .join('');

    const content = `<div>${header ? `<p>${header}</p>` : ''}${sentencesContent}</div>`;

    editor.chain().focus().insertContent(content).run();
    toast.success('Translation exercise saved successfully!');
    clearInputs();
    onClose();
  };

  const clearInputs = () => {
    setHeader('');
    setSentences(['']);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crie um exercício de tradução</DialogTitle>
        </DialogHeader>
        <Toaster />
        <div className="mb-4 w-full">
          <Textarea
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            placeholder="Coloque o enunciado (e.g., 'Traduza as frases abaixo')"
            rows={2}
          />
        </div>
        {sentences.map((sentence, index) => (
          <div key={index} className="mb-4 w-full">
            <Textarea
              value={sentence}
              onChange={(e) => handleSentenceChange(index, e.target.value)}
              placeholder={`Coloque a frase - ${index + 1}`}
              rows={2}
            />
          </div>
        ))}
        <Button variant="success" onClick={handleAddSentence}>Adicionar outra</Button>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="success" onClick={handleSave}>Inserir</Button>
          <Button variant="outline" onClick={() => { clearInputs(); onClose(); }}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

TranslationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default TranslationModal;
