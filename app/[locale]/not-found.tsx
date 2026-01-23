import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background p-4 text-center space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-muted rounded-full">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
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
