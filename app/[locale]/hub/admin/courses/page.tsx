"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Icons
import { useTranslations } from "next-intl";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Clock,
  Globe,
  AlertCircle,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";

import { Header } from "@/components/ui/header";
import { Course } from "../../../../../types/quiz/types";

export default function AdminCoursesPage() {
  const t = useTranslations("AdminCourses.list");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [search, setSearch] = useState("");

  // States para exclusão
  const [courseToDeleteId, setCourseToDeleteId] = useState<string | null>(null);

  // Redirecionamento de segurança
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Fetch dos dados
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch("/api/admin/courses");
        if (!res.ok) throw new Error("Falha na API");
        const data = await res.json();
        setCourses(data as Course[]);
      } catch (error) {
        toast.error(t("toasts.loadError"));
      } finally {
        setLoadingCourses(false);
      }
    };

    if (session?.user.role === "admin") {
      fetchCourses();
    }
  }, [session, t]);

  // Lógica de filtro local (Praticidade)
  const filteredCourses = useMemo(() => {
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.language.toLowerCase().includes(search.toLowerCase()),
    );
  }, [courses, search]);

  // Lógica de exclusão
  const handleDeleteCourse = async () => {
    if (!courseToDeleteId) return;

    const toastId = toast.loading(t("toasts.deleting"));
    try {
      const res = await fetch(`/api/admin/courses/${courseToDeleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha na API");

      setCourses((prev) => prev.filter((c) => c.id !== courseToDeleteId));
      toast.success(t("toasts.deleteSuccess"), { id: toastId });
    } catch (error) {
      toast.error(t("toasts.deleteError"), { id: toastId });
    } finally {
      setCourseToDeleteId(null);
    }
  };

  // Se não estiver autorizado (evita flash de conteúdo)
  if (status !== "loading" && (!session || session.user.role !== "admin")) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <Header
            heading={t("title")}
            subheading={t("subtitle")}
            headingSize="3xl"
          />

          <Link href={`/hub/admin/courses/criar`}>
            <Button className="w-full md:w-auto gap-2">
              <Plus className="w-4 h-4 mr-1" />
              {t("newCourse")}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-muted/30   border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("totalCourses")}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <div className="text-2xl font-bold">{courses.length}</div>
              )}
            </CardContent>
          </Card>
          {/* Você pode adicionar mais cards aqui se tiver dados, ex: Total Alunos, Cursos Ativos */}
        </div>

        {/* Search & Content */}
        <Card className="border  ">
          <CardHeader className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">{t("catalog")}</CardTitle>
              <CardDescription>{t("catalogDescription")}</CardDescription>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="pl-6">{t("headers.title")}</TableHead>
                  <TableHead>{t("headers.language")}</TableHead>
                  <TableHead>{t("headers.duration")}</TableHead>
                  <TableHead>{t("headers.access")}</TableHead>
                  <TableHead className="text-right pr-6">
                    {t("headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCourses ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="pr-6">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                        <p>{t("empty")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow
                      key={course.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="pl-6 font-medium text-foreground">
                        {course.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-sm">{course.language}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm">{course.duration}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            course.role === "student" ? "secondary" : "default"
                          }
                          className="font-normal"
                        >
                          {course.role === "student"
                            ? t("roles.studentBasic")
                            : t("roles.studentPremium")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/hub/admin/courses/edit?id=${course.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setCourseToDeleteId(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      <Modal
        open={!!courseToDeleteId}
        onOpenChange={(open) => !open && setCourseToDeleteId(null)}
      >
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>{t("deleteModal.title")}</ModalTitle>
            <ModalDescription>{t("deleteModal.description")}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setCourseToDeleteId(null)}>
              {t("deleteModal.cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={handleDeleteCourse}
            >
              {t("deleteModal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
