import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert, Home } from "lucide-react";

export default function NotAllowedPage() {
  const t = useTranslations("NotAllowed");

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background p-4 text-center space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full">
            <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          {t("description")}
        </p>
      </div>
      <Button asChild size="lg" variant="primary">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          {t("backButton")}
        </Link>
      </Button>
    </div>
  );
}
