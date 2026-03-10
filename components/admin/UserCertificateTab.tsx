"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { FullUserDetails } from "@/types/users/userDetails";
import { ClassStatus, StudentClass } from "@/types/classes/class";
import { myFont } from "@/components/fonts/fonts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserCertificateTabProps {
  user: FullUserDetails;
  classes: StudentClass[];
}

type CourseLanguageOption = {
  value: string;
  label: string;
};

const getDefaultGenericMessage = (locale: string) => {
  if (locale === "en") {
    return "Throughout the course, the student practiced conversation, vocabulary, grammar, listening, reading, and writing, focusing on real-life situations.";
  }
  return "Durante o curso, o aluno desenvolveu conversação, vocabulário, gramática, listening, reading e writing, com foco em situações do dia a dia.";
};

const coordinatorName = "Matheus Fernandes";

async function fetchAsDataUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch asset");
  const blob = await res.blob();

  const reader = new FileReader();
  const dataUrl: string = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read asset"));
    reader.readAsDataURL(blob);
  });

  return dataUrl;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

async function registerSignatureFont(doc: jsPDF) {
  const res = await fetch("/api/assets/fonts/brittany-signature");
  if (!res.ok) throw new Error("Font not found");
  const buffer = await res.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  const fontFileName = "BrittanySignature.ttf";
  const fontName = "BrittanySignature";
  doc.addFileToVFS(fontFileName, base64);
  doc.addFont(fontFileName, fontName, "normal");
  return fontName;
}

export default function UserCertificateTab({
  user,
  classes,
}: UserCertificateTabProps) {
  const t = useTranslations("UserDetails.certificate");
  const locale = useLocale();

  const completedClassesCount = useMemo(() => {
    return (classes || []).filter((c) => c.status === ClassStatus.COMPLETED)
      .length;
  }, [classes]);

  const availableCourseLanguages = useMemo<CourseLanguageOption[]>(() => {
    const langs = new Set<string>();

    (classes || []).forEach((c) => {
      if (c?.language) langs.add(c.language);
    });

    (user.languages || []).forEach((l) => {
      if (l) langs.add(l);
    });

    const list = Array.from(langs).map((l) => ({ value: l, label: l }));
    list.sort((a, b) => a.label.localeCompare(b.label));

    if (list.length === 0) {
      return [
        { value: "Inglês", label: "Inglês" },
        { value: "Espanhol", label: "Espanhol" },
        { value: "Português", label: "Português" },
      ];
    }

    return list;
  }, [classes, user.languages]);

  const defaultCourseLanguage = useMemo(() => {
    if (availableCourseLanguages.length === 0) return "Inglês";

    const counts = new Map<string, number>();
    (classes || [])
      .filter((c) => c.status === ClassStatus.COMPLETED)
      .forEach((c) => {
        if (!c?.language) return;
        counts.set(c.language, (counts.get(c.language) || 0) + 1);
      });

    let best = availableCourseLanguages[0].value;
    let bestCount = -1;
    counts.forEach((count, lang) => {
      if (count > bestCount) {
        best = lang;
        bestCount = count;
      }
    });

    return best;
  }, [availableCourseLanguages, classes]);

  const [courseLanguage, setCourseLanguage] = useState(defaultCourseLanguage);
  const [message, setMessage] = useState(() =>
    getDefaultGenericMessage(locale),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const totalHours = completedClassesCount;

  const issueDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [locale]);

  const downloadCertificate = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      const now = new Date();
      const issuedAt = now.toISOString();
      const issuedAtLabel = now.toLocaleDateString(
        locale === "en" ? "en-US" : "pt-BR",
        { day: "2-digit", month: "long", year: "numeric" },
      );

      const createRes = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          courseLanguage,
          hours: totalHours,
          message,
          issuedAt,
        }),
      });

      const createJson = await createRes.json().catch(() => null);
      if (!createRes.ok) {
        throw new Error(createJson?.error || "Failed to create certificate");
      }

      const code: string = createJson?.code;
      if (!code) {
        throw new Error("Missing certificate code");
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const [logoDataUrl, signatureFont] = await Promise.all([
        fetchAsDataUrl("/brand/Group.png"),
        registerSignatureFont(doc),
      ]);

      doc.setFillColor(238, 242, 255);
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1.2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.6);
      doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text(t("pdf.title"), pageWidth / 2, 28, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81);
      doc.text(t("pdf.subtitle"), pageWidth / 2, 38, { align: "center" });

      doc.setFont(signatureFont, "normal");
      doc.setFontSize(44);
      doc.setTextColor(15, 23, 42);
      doc.text(user.name || "", pageWidth / 2, 76, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(55, 65, 81);

      const body = t("pdf.body", {
        studentName: user.name,
        courseLanguage,
        hours: totalHours,
      });
      const bodyLines = doc.splitTextToSize(body, pageWidth - 70);
      let y = 92;
      bodyLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 7;
      });

      y += 4;
      doc.setFontSize(11.5);
      const messageLines = doc.splitTextToSize(message, pageWidth - 80);
      messageLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 6;
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(107, 114, 128);
      doc.text(t("pdf.issuedAt", { date: issuedAtLabel }), 20, pageHeight - 24);

      doc.setDrawColor(148, 163, 184);
      doc.line(30, pageHeight - 38, 115, pageHeight - 38);
      doc.setFont(signatureFont, "normal");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      doc.text(coordinatorName, 72.5, pageHeight - 41, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(t("pdf.coordinatorRole"), 72.5, pageHeight - 30, {
        align: "center",
      });

      const logoW = 34;
      const logoH = 20;
      doc.addImage(
        logoDataUrl,
        "PNG",
        pageWidth - 20 - logoW,
        pageHeight - 20 - logoH,
        logoW,
        logoH,
      );

      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(t("pdf.authTitle"), pageWidth / 2, 12, { align: "center" });

      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const verifyUrl = origin
        ? `${origin}/${locale}/certificate?code=${code}`
        : "";

      const authBody = t("pdf.authBody");
      doc.text(doc.splitTextToSize(authBody, pageWidth - 40), 20, 34);

      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(t("pdf.codeLabel"), 20, 74);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text(code, 20, 92);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.text(t("pdf.verifyUrlLabel"), 20, 114);

      doc.setTextColor(37, 99, 235);
      doc.text(verifyUrl || "-", 20, 124);

      doc.addImage(
        logoDataUrl,
        "PNG",
        pageWidth - 20 - logoW,
        pageHeight - 20 - logoH,
        logoW,
        logoH,
      );

      const safeName = (user.name || "aluno")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "");

      const pdfBase64 = doc.output("datauristring");
      fetch(`/api/admin/certificates/${code}/pdf`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      }).catch(() => {});

      doc.save(`certificado-${safeName}.pdf`);
      toast.success(t("toasts.success"));
    } catch {
      toast.error(t("toasts.error"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("courseLanguageLabel")}</Label>
              <Select value={courseLanguage} onValueChange={setCourseLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t("courseLanguagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableCourseLanguages.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("hoursLabel")}</Label>
              <div className="h-10 px-3 rounded-md border bg-background flex items-center text-sm">
                {t("hoursValue", {
                  classes: completedClassesCount,
                  hours: totalHours,
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("messageLabel")}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={6}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={downloadCertificate}
              disabled={completedClassesCount === 0 || isGenerating}
            >
              {isGenerating ? t("generatingButton") : t("downloadButton")}
            </Button>
            {completedClassesCount === 0 && (
              <span className="text-xs text-muted-foreground">
                {t("noCompletedClasses")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit overflow-hidden">
        <CardHeader>
          <CardTitle>{t("previewTitle")}</CardTitle>
          <CardDescription>{t("previewDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white text-black rounded-lg border p-6 md:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-10 bg-indigo-50" />
            <div className="relative text-center space-y-2">
              <div className="text-2xl md:text-3xl font-bold">
                {t("pdf.title")}
              </div>
              <div className="text-sm text-gray-600">{t("pdf.subtitle")}</div>
            </div>

            <div className="mt-6 text-center">
              <div className={`${myFont.className} text-4xl md:text-5xl`}>
                {user.name}
              </div>
            </div>

            <div className="mt-5 text-center space-y-3">
              <div className="text-sm md:text-base text-gray-700">
                {t("pdf.body", {
                  studentName: user.name,
                  courseLanguage,
                  hours: totalHours,
                })}
              </div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {message}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div className="text-left text-xs text-gray-500">
                {t("pdf.issuedAt", { date: issueDate })}
              </div>

              <div className="text-center">
                <div className="mx-auto w-64 border-t border-gray-300" />
                <div className={`${myFont.className} text-2xl -mt-3`}>
                  {coordinatorName}
                </div>
                <div className="text-xs text-gray-500">
                  {t("pdf.coordinatorRole")}
                </div>
              </div>
            </div>

            <img
              src="/brand/Group.png"
              alt="Fluency Lab School"
              className="absolute bottom-4 right-4 h-7 w-auto opacity-90"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
