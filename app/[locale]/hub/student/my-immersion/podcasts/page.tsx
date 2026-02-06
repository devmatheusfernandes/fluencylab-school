import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { immersionService } from "@/services/learning/immersionService";
import { PodcastListClient } from "@/components/immersion/PodcastListClient";
import { requireAuth } from "@/lib/auth";

export default async function StudentPodcastsPage() {
  const user = await requireAuth();
  const podcasts = await immersionService.getAllPodcasts();
  const progressList = await immersionService.getAllUserPodcastProgress(
    user.id,
  );

  // Convert array to map for easier lookup: podcastId -> UserPodcastProgress
  const progressMap = progressList.reduce(
    (acc, progress) => {
      acc[progress.podcastId] = progress;
      return acc;
    },
    {} as Record<string, (typeof progressList)[0]>,
  );

  return (
    <div className="container-padding space-y-6">
      <Header
        heading="Podcasts"
        subheading="Listen and learn."
        backHref="/hub/student/my-immersion"
      />

      <PodcastListClient podcasts={podcasts} progressMap={progressMap} />
    </div>
  );
}
