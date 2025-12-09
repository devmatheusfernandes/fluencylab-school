"use client";

import { useParams } from "next/navigation";
import NotebookViewer from "@/components/notebooks/NotebookViewer";

export default function VisualizarCaderno() {
  const { studentId, notebookId } = useParams();
  return (
    <NotebookViewer
      studentId={studentId as string}
      notebookId={notebookId as string}
    />
  );
}
