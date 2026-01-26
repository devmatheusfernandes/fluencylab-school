import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`))
    .default as Record<string, Record<string, string>>;
  const title = messages?.Home?.title ?? "Home";
  const session = await getServerSession(authOptions);

  return (
    <BubbleBackground interactive={true}>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-3">
        <h1 className="text-3xl font-bold text-center">{title}</h1>
        <div className="flex flex-wrap flex-row items-center justify-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
           <div>
          {session?.user ? (
            <Link href={`/${locale}/hub`}>
              <Button variant="glass">Continuar como {session.user.name}</Button>
            </Link>
          ) : (
            <Link href={`/${locale}/signin`}>
              <Button variant="glass">Entrar</Button>
            </Link>
          )}
        </div>
        </div>
      </div>
    </BubbleBackground>
  );
}
