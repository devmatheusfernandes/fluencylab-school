'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export const useAvatar = (userId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Por favor, selecione uma imagem (JPEG, PNG, GIF, WEBP).');
        return null;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error(`A imagem deve ter menos de 5MB. Tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return null;
      }

      // Check if user is authenticated
      if (!userId) {
        toast.error('Você precisa estar logado para atualizar a foto de perfil.');
        return null;
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload file through API
      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar o avatar.');
      }

      toast.success('Foto de perfil atualizada com sucesso!');
      return data.avatarUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Erro ao atualizar a foto de perfil.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
};