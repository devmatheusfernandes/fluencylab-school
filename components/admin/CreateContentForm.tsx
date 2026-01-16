'use client';

import { useState } from 'react';
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
import { Upload, Loader2, X } from 'lucide-react';

export function CreateContentForm() {
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error('Audio file is too large. Max size is 6MB.');
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
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-card/50 text-card-foreground shadow-sm">
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
        <p className="text-xs text-muted-foreground">Max size: 6MB</p>
        <div className="flex items-center gap-2">
          <Input 
            id="audio" 
            type="file" 
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden" 
          />
          <Label
            htmlFor="audio"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {audioFile ? 'Change File' : 'Upload Audio'}
              </>
            )}
          </Label>
          {audioFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate max-w-[200px]">
                {audioFile.name} • {formatFileSize(audioFile.size)}
              </span>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setAudioFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
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
