import { Container } from "@/components/ui/container";
import { FlashcardSession } from "@/components/practice/FlashcardSession";
import { getCurrentUser } from "@/lib/auth";
import { getSessionCards } from "@/actions/practice";
import { redirect } from "next/navigation";
import { userRepository } from "@/repositories";

export default async function MyPracticePage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  // Fetch full user details to satisfy the User type requirement
  const fullUser = await userRepository.findById(sessionUser.id);

  if (!fullUser) {
    // Handle edge case where user is in session but not in DB (rare)
    redirect("/login");
  }

  // Serialize user object to remove non-serializable fields like Firestore Timestamps
  const serializedUser = JSON.parse(JSON.stringify(fullUser));

  // Fetch cards from server action
  const { cards } = await getSessionCards();

  return (
    <Container className="min-h-[calc(100vh-120px)] flex flex-col py-4">
      <FlashcardSession 
        cards={cards || []} 
        initialUser={serializedUser}
      />
    </Container>
  );
}
