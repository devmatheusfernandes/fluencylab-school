"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../public/brand/Group.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

export function PwaWelcomeScreen() {
  const t = useTranslations("PwaWelcome");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background pattern similar to landing page */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center pt-10 pb-10 px-6 text-center space-y-6">
            <div className="relative w-42 h-20 mb-2">
              <Image
                src={Logo}
                alt={t("logoAlt")}
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("description")}
              </p>
            </div>

            <div className="w-full pt-4">
              <Link href="/signin" className="w-full">
                <Button
                  className="w-full h-12 text-base font-medium gap-2"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  {t("enterButton")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-muted-foreground/50">
        &copy; {new Date().getFullYear()} FluencyLab School
      </div>
    </div>
  );
}
