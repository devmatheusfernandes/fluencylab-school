import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MultipleChoiceModal = ({ isOpen, onClose, editor }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(null);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectOptionChange = (index) => {
    setCorrectOption(index);
  };

  const handleSave = () => {
    if (!question.trim()) {
      toast.error('Please enter a question.');
      return;
    }

    if (options.some((option) => option.trim() === '') || correctOption === null) {
      toast.error('Please provide all options and select the correct answer.');
      return;
    }

    const content = `<multiple-choice question="${question}" options='${JSON.stringify(options)}' correctOption="${correctOption}"></multiple-choice>`;

    editor.chain().focus().insertContent(content).run();
    toast.success('Multiple choice question saved successfully!');

    clearInputs();
    onClose();
  };

  const clearInputs = () => {
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectOption(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Pergunta de Múltipla Escolha</DialogTitle>
        </DialogHeader>
        <Toaster />
        <div className="mb-4 w-full">
          <Textarea
            value={question}
            onChange={handleQuestionChange}
            placeholder="Digite a pergunta"
            rows={2}
          />
        </div>
        {options.map((option, index) => (
          <div key={index} className="mb-4 w-full flex flex-row items-start gap-2">
            <Textarea
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Opção ${index + 1}`}
              rows={2}
            />
            <input
              type="radio"
              name="correctOption"
              value={index}
              checked={correctOption === index}
              onChange={() => handleCorrectOptionChange(index)}
              className="mt-2"
            />
            <label className="ml-2">Marcar como correta</label>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button variant="success" onClick={handleSave}>Salvar</Button>
          <Button variant="outline" onClick={() => { clearInputs(); onClose(); }}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

MultipleChoiceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default MultipleChoiceModal;
