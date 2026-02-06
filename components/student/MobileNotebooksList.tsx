"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Notebook } from "@/types/notebooks/notebooks";
import { SearchBar } from "@/components/ui/search-bar";
import { NoResults } from "@/components/ui/no-results";
import { useTranslations } from "next-intl";

interface MobileNotebooksListProps {
  notebooks: Notebook[];
}

export default function MobileNotebooksList({
  notebooks,
}: MobileNotebooksListProps) {
  const t = useTranslations("NotebooksCard");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotebooks = notebooks.filter(
    (notebook) =>
      notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <SearchBar
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNotebooks.length > 0 ? (
          filteredNotebooks
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((notebook) => (
              <Link
                key={notebook.id}
                href={`/hub/student/my-notebook/notebook/${notebook.id}`}
                className="block p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary transition-colors"
              >
                <h3 className="font-semibold text-sm mb-1">{notebook.title}</h3>
                <div className="text-xs text-muted-foreground">
                  {notebook.createdAt &&
                    new Date(notebook.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </Link>
            ))
        ) : (
          <NoResults
            searchQuery={searchQuery}
            customMessage={{
              withSearch: t("noResultsSearch", { query: searchQuery }),
              withoutSearch: t("noResultsEmpty"),
            }}
            className="p-4"
          />
        )}
      </div>
    </div>
  );
}
