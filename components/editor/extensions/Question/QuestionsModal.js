import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AlignHorizontalDistributeEndIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const QuestionsModal = ({ isOpen, onClose, editor }) => {
  const [sentences, setSentences] = useState([{ sentence: '' }]);
  const [canAddSentence, setCanAddSentence] = useState(false);

  const handleSentenceChange = (index, value) => {
    const newSentences = [...sentences];
    newSentences[index].sentence = value;
    setSentences(newSentences);

    // Check if the current sentence has a valid answer in curly braces
    const hasAnswer = /\{.*?\}/.test(value);
    setCanAddSentence(hasAnswer);
  };

  const addSentence = () => {
    if (canAddSentence) {
      setSentences([...sentences, { sentence: '' }]);
      setCanAddSentence(false); // Reset the flag after adding a sentence
      toast.success(`A valid answer detected in sentence ${sentences.length}`);
    } else {
    }
  };

  const extractAnswer = (sentence) => {
    const match = sentence.match(/\{(.*?)\}/);
    return match ? match[1] : '';
  };

  const handleSave = () => {
    // Filter out empty sentences
    const filteredSentences = sentences.filter(({ sentence }) => {
      return sentence.trim() !== '' && /\{.*?\}/.test(sentence);
    });

    if (filteredSentences.length === 0) {
      return;
    }

    const content = filteredSentences.map(({ sentence }, index) => {
      const answer = extractAnswer(sentence);
      const cleanedSentence = sentence.replace(/\{.*?\}/, '{{gap}}');
      return `<exercise-component sentence="${index + 1}. ${cleanedSentence}" answer="${answer}"></exercise-component>`;
    }).join('');
    
    if (content) {
      editor.chain().focus().insertContent(content).run();
    }

    clearInputs();
    onClose();
  };

  const clearInputs = () => {
    setSentences([{ sentence: '' }]);
    setCanAddSentence(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Exercício</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-2 w-full'>
          {sentences.map((item, index) => (
            <div key={index} className="w-full">
              <Textarea
                value={item.sentence}
                onChange={(e) => handleSentenceChange(index, e.target.value)}
                placeholder={`Digite a ${index + 1}ª frase com a resposta entre chaves { }`}
                rows={1}
              />
            </div>
          ))}
          <Button onClick={addSentence} size="icon" variant="success">
            <AlignHorizontalDistributeEndIcon className='size-6' />
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="success" onClick={handleSave}>Inserir</Button>
          <Button variant="outline" onClick={() => { clearInputs(); onClose(); }}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

QuestionsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default QuestionsModal;
