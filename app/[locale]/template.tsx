import { PageTransition } from "@/components/ui/page-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition effect="premium">{children}</PageTransition>;
}
