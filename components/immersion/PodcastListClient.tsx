"use client";

import { Podcast, UserPodcastProgress } from "@/types/learning/immersion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { useState, useMemo } from "react";
import { FloatingPodcastPlayer } from "./FloatingPodcastPlayer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BreadcrumbActions from "../shared/Breadcrum/BreadcrumbActions";
import BreadcrumbActionIcon from "../shared/Breadcrum/BreadcrumbActionIcon";
import Link from "next/link";

interface PodcastListClientProps {
  podcasts: Podcast[];
  progressMap: Record<string, UserPodcastProgress>;
}

const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficiency" },
];

export function PodcastListClient({
  podcasts,
  progressMap,
}: PodcastListClientProps) {
  const [activePodcast, setActivePodcast] = useState<Podcast | null>(null);
  const [initialProgress, setInitialProgress] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [level, setLevel] = useState("all");

  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((podcast) => {
      const matchesSearch =
        podcast.title.toLowerCase().includes(search.toLowerCase()) ||
        podcast.description.toLowerCase().includes(search.toLowerCase());

      const matchesLanguage =
        language === "all" || podcast.language === language;
      const matchesLevel =
        level === "all" ||
        (podcast.level && podcast.level === level) ||
        (!podcast.level && level === "all");

      return matchesSearch && matchesLanguage && matchesLevel;
    });
  }, [podcasts, search, language, level]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayFromStart = (podcast: Podcast) => {
    setInitialProgress(0);
    setActivePodcast(podcast);
  };

  const handleResume = (
    e: React.MouseEvent,
    podcast: Podcast,
    progress: number,
  ) => {
    e.stopPropagation();
    setInitialProgress(progress);
    setActivePodcast(podcast);
  };

  return (
    <>
      <BreadcrumbActions placement="start">
        <Link href="/hub/student/my-immersion">
          <BreadcrumbActionIcon icon={ArrowLeft} />
        </Link>
      </BreadcrumbActions>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search podcasts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Level" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPodcasts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No podcasts found</p>
            <p className="text-sm">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          filteredPodcasts.map((podcast) => {
            const progress = progressMap[podcast.id];
            const isCompleted = progress?.isCompleted;
            const inProgress =
              progress && !isCompleted && progress.lastPosition > 0;

            return (
              <Card
                key={podcast.id}
                className={`hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col relative group overflow-hidden ${
                  activePodcast?.id === podcast.id
                    ? "border-primary ring-1 ring-primary"
                    : ""
                }`}
                onClick={() => handlePlayFromStart(podcast)}
              >
                {podcast.coverImageUrl && (
                  <div className="aspect-video w-full relative overflow-hidden bg-muted">
                    <img
                      src={podcast.coverImageUrl}
                      alt={podcast.title}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {podcast.language && (
                        <Badge
                          variant="secondary"
                          className="bg-background/80 backdrop-blur-sm text-xs"
                        >
                          {podcast.language.toUpperCase()}
                        </Badge>
                      )}
                      {podcast.level && (
                        <Badge
                          variant="secondary"
                          className="bg-background/80 backdrop-blur-sm text-xs"
                        >
                          {podcast.level}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <CardHeader className={podcast.coverImageUrl ? "pt-4" : ""}>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!podcast.coverImageUrl && (
                        <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                      )}
                      <span className="line-clamp-2">{podcast.title}</span>
                    </div>
                    {isCompleted && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {podcast.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Duration: {formatTime(podcast.duration)}</span>
                    {!podcast.coverImageUrl && (
                      <div className="flex gap-2">
                        {podcast.language && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-5"
                          >
                            {podcast.language.toUpperCase()}
                          </Badge>
                        )}
                        {podcast.level && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-5"
                          >
                            {podcast.level}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {inProgress && (
                    <div
                      className="mt-4 pt-3 border-t cursor-pointer hover:bg-muted/80 transition-colors rounded-b-lg -mx-6 -mb-6 px-6 pb-6"
                      onClick={(e) =>
                        handleResume(e, podcast, progress.lastPosition)
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Continue from {formatTime(progress.lastPosition)}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(progress.lastPosition / podcast.duration) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {activePodcast && (
        <FloatingPodcastPlayer
          key={`${activePodcast.id}-${initialProgress}`}
          podcast={activePodcast}
          initialProgress={initialProgress}
          onClose={() => setActivePodcast(null)}
        />
      )}
    </>
  );
}
