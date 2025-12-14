'use client'
import { Container } from "@/components/ui/container";
import AchievementsPage from "@/components/achievements/page";

export default function MyAchievementsPage() {
  return (
    <Container className="grid gap-2 grid-cols-1">
      <AchievementsPage />
    </Container>
  );
}
