import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const storage = getStorage();

const DownloadModal = ({ isOpen, onClose, editor }) => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `files/${file.name}-${Date.now()}`);

    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFileUrl(url);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleInsert = async () => {
    const uploadedFileUrl = await handleFileUpload();

    if (uploadedFileUrl && editor) {
      editor.chain().focus().insertContent(
        `<file-snippet description="${description}" fileUrl="${uploadedFileUrl}" fileName="${file.name}"></file-snippet>`
      ).run();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download de arquivos</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
          {file && <p className="text-sm text-muted-foreground">Selecione o arquivo: {file.name}</p>}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="success"
              onClick={handleInsert}
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Inserir'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;