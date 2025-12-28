import { SignInClient } from "../../../../components/auth/SignInClient";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (
    await import(`../../../../messages/${locale}.json`)
  ).default as Record<string, Record<string, string>>;

  return <SignInClient messages={messages} />;
}