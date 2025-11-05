"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Carrega o editor dinamicamente para evitar SSR de libs client-only
const TiptapEditor = dynamic(() => import("@/components/editor/tiptap"), {
  ssr: false,
});

export default function TestCommentsPage() {
  const [content, setContent] = useState<string>("<p>Selecione um trecho e clique no botão de comentário.</p>");

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-2xl font-semibold">Teste de Comentários</h1>
      <TiptapEditor
        content={content}
        onSave={(html) => setContent(html)}
        className="rounded-md border"
      />
    </div>
  );
}