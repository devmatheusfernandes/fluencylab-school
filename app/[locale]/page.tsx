import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`))
    .default as any;
  const title = messages?.Home?.title ?? "Home";
  return (
    <BubbleBackground interactive={true}>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <LanguageSwitcher />
      </div>
    </BubbleBackground>
  );
}
