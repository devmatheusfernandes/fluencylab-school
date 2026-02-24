import { SignInClient } from "../../../../components/auth/SignInClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  
  const session = await getServerSession(authOptions);
  if (session) {
    const target = callbackUrl && typeof callbackUrl === 'string' 
      ? callbackUrl 
      : `/${locale}/hub`;
    redirect(target);
  }

  const messages = (
    await import(`../../../../messages/${locale}.json`)
  ).default as Record<string, Record<string, string>>;

  return <SignInClient messages={messages} />;
}