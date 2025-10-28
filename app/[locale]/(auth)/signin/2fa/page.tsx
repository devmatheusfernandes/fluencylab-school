import TwoFactorClient from "./TwoFactorClient";

export default async function TwoFactorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (
    await import(`../../../../../messages/${locale}.json`)
  ).default as Record<string, Record<string, string>>;

  return <TwoFactorClient messages={messages} />;
}