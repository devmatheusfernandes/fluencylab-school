"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {Header} from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CertificateVerifyResponse = {
  id: string;
  code: string;
  studentName: string;
  courseLanguage: string;
  hours: number;
  message: string;
  issuedAt: string;
  coordinatorName: string;
  pdfUrl: string | null;
};

export default function CertificatePage() {
  const t = useTranslations("CertificateValidation");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const initialCode = useMemo(() => {
    return (searchParams.get("code") || "").trim().toUpperCase();
  }, [searchParams]);

  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerifyResponse | null>(null);

  const verify = useCallback(
    async (forcedCode?: string) => {
      const finalCode = (forcedCode ?? code).trim().toUpperCase();
      if (!finalCode) return;

      try {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const res = await fetch(
          `/api/certificates/verify?code=${encodeURIComponent(finalCode)}`,
        );
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || t("errors.generic"));
        }
        setResult(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.generic"));
      } finally {
        setIsLoading(false);
      }
    },
    [code, t],
  );

  useEffect(() => {
    if (initialCode) verify(initialCode);
  }, [initialCode, verify]);

  const issuedAtLabel = useMemo(() => {
    if (!result?.issuedAt) return null;
    const date = new Date(result.issuedAt);
    if (Number.isNaN(date.getTime())) return result.issuedAt;
    return date.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [locale, result?.issuedAt]);

  return (
    <div className="container-padding space-y-6 max-w-4xl mx-auto">
      <Header heading={t("title")} subheading={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificate-code">{t("form.codeLabel")}</Label>
            <Input
              id="certificate-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("form.codePlaceholder")}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => verify()}
              disabled={!code.trim() || isLoading}
            >
              {isLoading ? t("form.verifying") : t("form.verify")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCode("");
                setResult(null);
                setError(null);
              }}
              disabled={isLoading}
            >
              {t("form.clear")}
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
            >
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{t("result.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">{t("result.code")}</div>
                <div className="font-medium">{result.code}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  {t("result.student")}
                </div>
                <div className="font-medium">{result.studentName}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  {t("result.language")}
                </div>
                <div className="font-medium">{result.courseLanguage}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">{t("result.hours")}</div>
                <div className="font-medium">
                  {t("result.hoursValue", { hours: result.hours })}
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-muted-foreground">
                  {t("result.issuedAt")}
                </div>
                <div className="font-medium">{issuedAtLabel}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-muted-foreground">
                  {t("result.coordinator")}
                </div>
                <div className="font-medium">{result.coordinatorName}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-muted-foreground">
                  {t("result.message")}
                </div>
                <div className="whitespace-pre-wrap">{result.message}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
