import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { immersionService } from "@/services/learning/immersionService";
import { PodcastPlayerView } from "@/components/immersion/PodcastPlayerView";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";

interface PodcastPageProps {
  params: Promise<{
    podcastId: string;
  }>;
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { podcastId } = await params;
  const user = await requireAuth();

  if (!podcastId || typeof podcastId !== "string") {
    notFound();
  }

  const podcast = await immersionService.getPodcastById(podcastId);
  const progress = await immersionService.getPodcastProgress(
    user.id,
    podcastId,
  );

  if (!podcast) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header
        heading="Now Playing"
        subheading={podcast.title}
        backHref="/hub/student/my-immersion/podcasts"
      />

      <PodcastPlayerView
        podcast={podcast}
        initialProgress={progress?.lastPosition || 0}
      />
    </div>
  );
}
