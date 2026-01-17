'use client';

import { useState, useRef } from 'react';
import { createContent } from '@/actions/content-processing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, X, FileAudio } from 'lucide-react';

export function CreateContentForm() {
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const MAX_AUDIO_SIZE_BYTES = 6* 1024 * 1024;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error('Audio file is too large. Max size is 10MB.');
        return;
      }
      setAudioFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error('Audio file is too large. Max size is 10MB.');
        e.target.value = '';
        return;
      }
      setAudioFile(file);
    }
  };

  const uploadAudio = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await fetch('/api/editor/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !transcript || isUploading) {
      toast.error('Title and transcript are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let audioUrl: string | undefined = undefined;
      
      if (audioFile) {
        const url = await uploadAudio(audioFile);
        if (!url) {
          setIsSubmitting(false);
          return;
        }
        audioUrl = url;
      }

      toast.info('Creating content...');
      const result = await createContent(title, transcript, language, audioUrl);
      
      if (result.success) {
        toast.success('Content created successfully');
        setTitle('');
        setTranscript('');
        setAudioFile(null);
        setLanguage('en');
        router.refresh();
      } else {
        toast.error('Failed to create content');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 card-base">
      <h3 className="text-lg font-semibold">New Content</h3>
      
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Content Title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audio">Audio File (Optional)</Label>
        
        {!audioFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
            `}
          >
            <Input 
              id="audio" 
              type="file" 
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden" 
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs">MP3, WAV, OGG up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 flex items-center justify-between bg-card">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <FileAudio className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(audioFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isUploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAudioFile(null)}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transcript">Transcript / Text</Label>
        <Textarea 
          id="transcript" 
          value={transcript} 
          onChange={(e) => setTranscript(e.target.value)} 
          placeholder="Paste text or transcript here..."
          rows={10}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Create Content'
        )}
      </Button>
    </form>
  );
}
