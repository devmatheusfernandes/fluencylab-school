
import { Suspense } from "react";
import { PlanTemplatesClient } from "./_components/PlanTemplatesClient";
import { planRepository } from "@/repositories";
import { getTranslations } from "next-intl/server";

export default async function PlanTemplatesPage() {
  const t = await getTranslations("PlanTemplates");
  const templates = await planRepository.findTemplates();

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <PlanTemplatesClient initialTemplates={JSON.parse(JSON.stringify(templates))} />
      </Suspense>
    </div>
  );
}
