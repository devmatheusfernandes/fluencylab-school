import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { immersionService } from "@/services/learning/immersionService";
import Link from "next/link";
import { Plus, Edit, Trash, Container } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function PodcastsPage() {
  const podcasts = await immersionService.getAllPodcasts();

  return (
    <div className="container-padding">
      <Header
        heading="Podcasts"
        subheading="Manage your podcasts here."
        icon={
          <Link href="/hub/material-manager/immersion/podcasts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Podcast
            </Button>
          </Link>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {podcasts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No podcasts found.
                </TableCell>
              </TableRow>
            ) : (
              podcasts.map((podcast) => (
                <TableRow key={podcast.id}>
                  <TableCell className="font-medium">{podcast.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {podcast.description}
                  </TableCell>
                  <TableCell>
                    {Math.floor(podcast.duration / 60)}:
                    {(podcast.duration % 60).toString().padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    {format(podcast.createdAt as Date, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/hub/material-manager/immersion/podcasts/${podcast.id}`}
                      >
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {/* Delete logic usually requires a client component or a form with server action. 
                          For simplicity here, I'll assume the Edit page has the delete button. 
                      */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
