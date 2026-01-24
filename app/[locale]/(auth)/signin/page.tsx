import { SignInClient } from "../../../../components/auth/SignInClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(`/${locale}/hub`);
  }

  const messages = (
    await import(`../../../../messages/${locale}.json`)
  ).default as Record<string, Record<string, string>>;

  return <SignInClient messages={messages} />;
}