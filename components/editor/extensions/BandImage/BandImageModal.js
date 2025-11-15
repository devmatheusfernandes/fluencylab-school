import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const storage = getStorage();

const BandImageModal = ({ isOpen, onClose, editor }) => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [position, setPosition] = useState('left');
  const [size, setSize] = useState('100px');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [previewHeight, setPreviewHeight] = useState('auto');

  const handleImageUpload = async () => {
    if (!image) return;

    setUploading(true);
    const storageRef = ref(storage, `images/${image.name}-${Date.now()}`);

    try {
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleInsert = async () => {
    const imageUrl = await handleImageUpload();

    if (imageUrl && editor) {
      editor.chain().focus().insertContent(
        `<image-text-component imageUrl="${imageUrl}" text="${text}" position="${position}" size="${size}"></image-text-component>`
      ).run();
      onClose();
    }
  };

  const handleImagePreview = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar imagem e adicionar texto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input type="file" onChange={handleImagePreview} />
          {imagePreview && (
            <div className="border p-2 rounded-lg">
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: size, height: previewHeight }}
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.target;
                  setPreviewHeight((parseInt(size) / naturalWidth) * naturalHeight + 'px');
                }}
              />
            </div>
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texto (opcional)"
          />
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue placeholder="Posição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Tamanho da imagem (ex.: 100px)"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="success"
              onClick={handleInsert}
              disabled={uploading || !image}
            >
              {uploading ? 'Uploading...' : 'Inserir'}
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

BandImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
};

export default BandImageModal;
