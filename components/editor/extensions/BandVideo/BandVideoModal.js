import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BandVideoModal = ({ isOpen, onClose, editor }) => {
  const [url, setUrl] = useState('');

  const handleSelectVideo = (url) => {
    if (editor && url) {
      editor.chain().focus().insertContent(`<embed-component url="${url}"></embed-component>`).run();
      onClose();
      setUrl('');
    }else{
      toast.error('Please select an audio.');
      setUrl('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coloque o link</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link"
          />
          <div className="flex justify-end gap-2">
            <Button variant='success' onClick={() => handleSelectVideo(url)}>Adicionar</Button>
            <Button variant='outline' onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BandVideoModal;
