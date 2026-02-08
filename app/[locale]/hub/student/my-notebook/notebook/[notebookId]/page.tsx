"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import NotebookViewer from "@/components/notebooks/NotebookViewer";

export default function VisualizarCaderno() {
  const { notebookId } = useParams();
  const { data: session } = useSession();
  const alunoId = session?.user?.id as string;

  return (
    <NotebookViewer
      studentId={alunoId}
      notebookId={notebookId as string}
      enableFullscreenOnScroll={true}
    />
  );
}
