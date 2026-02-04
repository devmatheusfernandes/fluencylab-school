"use client";

import { useState } from "react";
import { Podcast } from "@/types/learning/immersion";
import { useImmersionMutations } from "@/hooks/learning/useImmersion";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PodcastFormProps {
  initialData?: Podcast;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const LEVELS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficiency" },
];

export function PodcastForm({ initialData }: PodcastFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [transcription, setTranscription] = useState(
    initialData?.transcription || "",
  );
  const [language, setLanguage] = useState(initialData?.language || "");
  const [level, setLevel] = useState(initialData?.level || "");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    initialData?.audioUrl || null,
  );
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialData?.coverImageUrl || null,
  );

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const { createPodcast, updatePodcast, deletePodcast, isPending } =
    useImmersionMutations();
  const router = useRouter();

  const onUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    setAudioFile(file);
    setIsUploadingAudio(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads/immersion/podcast", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setAudioUrl(data.url);
      toast.success("Audio uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload audio");
      setAudioFile(null);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setCoverFile(file);
    setIsUploadingCover(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Reusing the blog cover upload endpoint or create a new one if needed
      // For now assuming we can use a generic image upload or similar
      const res = await fetch("/api/uploads/immersion/blog-cover", { // Reusing for now as requested by plan
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setCoverUrl(data.url);
      toast.success("Cover uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload cover");
      setCoverFile(null);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!audioUrl) {
      toast.error("Please upload an audio file");
      return;
    }
    if (!language) {
      toast.error("Language is required");
      return;
    }

    try {
      let duration = initialData?.duration || 0;

      if (audioFile) {
        const audio = new Audio(audioUrl);
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            duration = audio.duration;
            resolve(true);
          };
          audio.onerror = () => resolve(true);
        });
      }

      const data = {
        title,
        description,
        transcription,
        audioUrl,
        duration,
        coverImageUrl: coverUrl,
        language,
        level: level || null,
      };

      if (initialData) {
        await updatePodcast(initialData.id, data);
      } else {
        await createPodcast(data);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const onDelete = async () => {
    if (initialData) {
      if (confirm("Are you sure you want to delete this podcast?")) {
        await deletePodcast(initialData.id);
        router.push("/hub/material-manager/immersion/podcasts");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {initialData ? "Edit Podcast" : "Create Podcast"}
        </h2>
        {initialData && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            disabled={isPending}
            placeholder="Podcast title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            disabled={isPending}
            placeholder="Podcast description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Language (Required)</Label>
            <Select
              disabled={isPending}
              value={language}
              onValueChange={setLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Level (Optional)</Label>
            <Select
              disabled={isPending}
              value={level}
              onValueChange={setLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">Cover Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="cover"
              type="file"
              accept="image/*"
              disabled={isPending || isUploadingCover}
              onChange={onUploadCover}
            />
            {isUploadingCover && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {coverUrl && (
            <div className="mt-2 relative aspect-square w-32 rounded-lg overflow-hidden border">
              <img
                src={coverUrl}
                alt="Cover preview"
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio">Audio File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="audio"
              type="file"
              accept="audio/*"
              disabled={isPending || isUploadingAudio}
              onChange={onUploadAudio}
            />
            {isUploadingAudio && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          {audioUrl && (
            <div className="mt-2 text-sm text-muted-foreground">
              Current file:{" "}
              <a
                href={audioUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-primary"
              >
                Listen
              </a>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcription">Transcription (Optional)</Label>
          <Textarea
            id="transcription"
            disabled={isPending}
            placeholder="Podcast transcription"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={isPending || isUploadingAudio || isUploadingCover}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Podcast"}
        </Button>
      </form>
    </div>
  );
}
