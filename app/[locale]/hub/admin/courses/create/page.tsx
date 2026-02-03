"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Save,
  UploadCloud,
  ImageIcon,
  Loader2,
  Globe,
  Clock,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";

interface NewCourseData {
  title: string;
  language: string;
  description: string;
  duration: string;
  role: string;
}

export default function CreateCoursePage() {
  const t = useTranslations("AdminCourses.create");
  const tRoles = useTranslations("AdminCourses.roles");
  const { data: session, status } = useSession();
  const router = useRouter();

  // States
  const [formData, setFormData] = useState<NewCourseData>({
    title: "",
    language: "",
    description: "",
    duration: "",
    role: "student",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth Check
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Removido HTMLFormElement para flexibilidade
    e.preventDefault();

    if (!formData.title || !formData.description)
      return toast.error(t("toasts.fillRequired"));
    if (!imageFile) return toast.error(t("toasts.selectImage"));
    if (isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading(t("toasts.creating"));

    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("language", formData.language);
      form.append("description", formData.description);
      form.append("duration", formData.duration);
      form.append("role", formData.role);
      form.append("image", imageFile);

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Falha na API");

      toast.success(t("toasts.success"), { id: toastId });
      router.push("/hub/admin/courses/create");
    } catch (error) {
      console.error("Error creating course: ", error);
      toast.error(t("toasts.error"), { id: toastId });
      setIsSubmitting(false);
    }
  };

  if (loading || !session || session.user.role !== "admin") {
    return (
      <Container className="p-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64 col-span-1" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1 w-full">
            <Header
              heading={t("title")}
              subheading={t("subtitle")}
              backHref="/hub/admin/courses"
            />
          </div>
          <div className="hidden md:block">
            <Button
              className="flex-1 min-w-max"
              onClick={(e) => handleSubmit(e as any)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t("saveButton")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="mb-2">
                <CardTitle>{t("mainDetails")}</CardTitle>
                <CardDescription>{t("mainDetailsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("labels.title")}</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.title")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("labels.description")}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder={t("placeholders.description")}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings & Media */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="mb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> {t("labels.cover")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg overflow-hidden h-48 bg-muted/10 flex items-center justify-center">
                  <input
                    id="courseImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover transition-opacity group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UploadCloud className="w-8 h-8" />
                      <span className="text-xs font-medium">
                        {t("upload.click")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {t("upload.formats")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="mb-2">
                <CardTitle className="text-base">
                  {t("settingsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="text-xs flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" /> {t("labels.language")}
                  </Label>
                  <Input
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.language")}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="duration"
                    className="text-xs flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" /> {t("labels.duration")}
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.duration")}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-xs flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" /> {t("labels.visibility")}
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("placeholders.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        {tRoles("student")}
                      </SelectItem>
                      <SelectItem value="teacher">
                        {tRoles("teacher")}
                      </SelectItem>
                      <SelectItem value="all">{tRoles("all")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Mobile only submit button */}
            <div className="md:hidden pt-2">
              <Button
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("saveButton")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}
