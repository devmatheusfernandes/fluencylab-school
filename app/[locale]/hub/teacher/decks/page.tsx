import { Container } from "@/components/ui/container";
import { DeckManager } from "@/components/decks/DeckManager";
import { requireAuth } from "@/lib/auth";
import { UserRoles } from "@/types/users/userRoles";
import { redirect } from "next/navigation";

export default async function DecksPage() {
  const user = await requireAuth();
  
  const allowedRoles = [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.TEACHER];
  if (!allowedRoles.includes(user.role as UserRoles)) {
    redirect('/hub');
  }

  return (
    <Container className="py-6">
      <DeckManager />
    </Container>
  );
}
