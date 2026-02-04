import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BlogLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 animate-pulse">
      {/* Botão Voltar Fake */}
      <div className="w-24 h-10 flex items-center">
        <div className="h-4 w-4 bg-muted rounded mr-2" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Header Loading */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2" />
      </div>

      {/* Image Loading */}
      <Skeleton className="aspect-video w-full rounded-2xl" />

      {/* Content Loading */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <br />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
