// Modal to Insert Weekly Goals
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GoalModal = ({ isOpen, onClose, editor }) => {
  const [title, setTitle] = useState('Weekly Goals');
  const [description, setDescription] = useState('Estudar todos os dias pelo menos 10 minutos.');
  const [schedule, setSchedule] = useState('Dia 1 - Criar Flashcards dos pronomes.\nDia 2 - Ler os flashcards em voz alta.\nDia 3 - Fazer atividade 1.\nDia 4 - Revisar anotações e flashcards.\nDia 5 - Fazer atividade 2.\nDia 6 - Revisar flashcards e terminar o homework.');

    const handleInsert = () => {
    if (editor) {
      // Instead of inserting an HTML string, insert a JSON object
      // representing the node and its attributes. Tiptap will handle
      // the correct rendering and escaping.
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'goalComponent', // This must match the name in your Node.create()
          attrs: {
            title: title,
            description: description,
            schedule: schedule,
          },
        })
        .run();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly Goals</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <div className='w-full flex flex-col items-start justify-center gap-2'>
            <p>Título:</p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
            />
          </div>
          <div className='flex flex-col items-start justify-center gap-2'>
            <p>Objetivo:</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo"
              rows={1}
            />
          </div>
          <div className='flex flex-col items-start justify-center gap-2'>
            <p>Programação por dia:</p>
            <Textarea
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Programação Semanal"
              rows={6}
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

GoalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default GoalModal;