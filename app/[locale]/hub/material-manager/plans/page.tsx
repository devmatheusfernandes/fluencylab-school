import { PlanTemplatesClient } from "../../../../../components/plans/PlanTemplatesClient";
import { planRepository } from "@/repositories";

export default async function PlanTemplatesPage() {
  const templates = await planRepository.findTemplates();

  return (
    <PlanTemplatesClient
      initialTemplates={JSON.parse(JSON.stringify(templates))}
    />
  );
}
