import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PronounceModal = ({ isOpen, onClose, editor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableAudios, setAvailableAudios] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchAudios = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'Nivelamento'));
          const audios = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
          }));
          setAvailableAudios(audios);
        } catch (error) {
          console.error('Error fetching audios:', error);
          toast.error('Failed to fetch audios.');
        }
      };

      fetchAudios();
    }
  }, [isOpen]);

  const handleSelectTranscript = (audioId) => {
    if (editor && audioId) {
      editor.chain().focus().insertContent(`<speaking-component audioId="${audioId}"></speaking-component>`).run();
      setSelectedAudioId('');
      onClose();
    }else {
      toast.error('Please select an audio.');
      setSelectedAudioId('');
    }
  };

  const filteredAudios = availableAudios.filter(audio =>
    audio.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione um texto para prática</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Texto"
          />
          <div className="w-full max-h-60 overflow-y-auto mt-2 border rounded">
            {filteredAudios.map(audio => (
              <div
                key={audio.id}
                className={`p-2 cursor-pointer ${selectedAudioId === audio.id ? 'bg-accent' : 'hover:bg-muted'}`}
                onClick={() => setSelectedAudioId(audio.id)}
              >
                {audio.name}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant='success' onClick={() => handleSelectTranscript(selectedAudioId)}>Adicionar</Button>
            <Button variant='outline' onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PronounceModal;
