import { PodcastForm } from "@/components/immersion/PodcastForm";
import { immersionService } from "@/services/learning/immersionService";
import { notFound } from "next/navigation";

interface EditPodcastPageProps {
  params: Promise<{
    podcastId: string;
  }>;
}

export default async function EditPodcastPage({
  params,
}: EditPodcastPageProps) {
  const { podcastId } = await params;
  const podcast = await immersionService.getPodcastById(podcastId);

  if (!podcast) {
    notFound();
  }

  return (
    <div className="container-padding">
      <PodcastForm initialData={podcast} />
    </div>
  );
}
