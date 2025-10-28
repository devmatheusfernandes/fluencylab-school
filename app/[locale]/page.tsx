import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`))
    .default as Record<string, Record<string, string>>;
  const title = messages?.Home?.title ?? "Home";

  return (
    <BubbleBackground interactive={true}>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex flex-row items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </BubbleBackground>
  );
}
