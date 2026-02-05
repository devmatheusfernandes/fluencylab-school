"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  BookOpen,
  ChevronRight,
  CheckCircle,
  Lock,
  PlayCircle,
  ArrowLeft,
  Globe,
  LayoutList,
  GraduationCap,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";

import {
  Course,
  Enrollment,
  Lesson,
  Section,
} from "../../../../../../types/quiz/types";
// Firestore removido do cliente

export default function CourseDetailPageContent() {
  const t = useTranslations("CourseDetail");
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");

  // --- STATES (Lógica mantida original) ---
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // --- USE EFFECT (Lógica mantida original) ---
  const fetchCourseDetails = async () => {
    if (!session?.user?.id || !courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(t("notFound"));
          router.push(`/hub/student/my-courses`);
          return;
        }
        throw new Error(t("loadError"));
      }
      const {
        course: courseData,
        sections,
        totalLessonsCount,
        enrollment: enrollmentData,
      } = await res.json();

      const sectionsOrdered = (sections || [])
        .map((section: Section) => ({
          ...section,
          lessons: (section.lessons || []).sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          ),
        }))
        .sort((a: Section, b: Section) => (a.order ?? 0) - (b.order ?? 0));

      setCourse({
        ...(courseData as Course),
        sections: sectionsOrdered,
        totalLessons: totalLessonsCount,
      });

      if (enrollmentData) {
        const completedLessons = Object.values(
          enrollmentData.progress || {},
        ).filter(Boolean).length;
        setEnrollment(enrollmentData as Enrollment);
        setIsEnrolled(true);
        setProgressPercentage(
          totalLessonsCount > 0
            ? Math.round((completedLessons / totalLessonsCount) * 100)
            : 0,
        );
      } else {
        setIsEnrolled(false);
        setEnrollment(null);
        setProgressPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching course details: ", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!courseId) {
      toast.error(t("invalidId"));
      router.push(`/hub/student/my-courses`);
      return;
    }
    if (status === "authenticated" && session?.user?.id) {
      fetchCourseDetails();
    }
  }, [session, status, router, courseId]);

  // --- HANDLERS (Lógica mantida original) ---
  const handleEnroll = async () => {
    if (!courseId || !session?.user?.id || enrolling || isEnrolled) return;
    setEnrolling(true);
    const toastId = toast.loading(t("enrolling"));
    try {
      const res = await fetch(`/api/student/courses/${courseId}/enroll`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(t("enrollError"));
      }
      await fetchCourseDetails();
      toast.success(t("enrollSuccess"), { id: toastId });
    } catch (error) {
      console.error("Error enrolling: ", error);
      toast.error(t("enrollError"), { id: toastId });
    } finally {
      setEnrolling(false);
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return !!enrollment?.progress?.[lessonId];
  };

  const getPreviousLessonId = (
    currentSectionIndex: number,
    currentLessonIndex: number,
  ): string | null => {
    if (!course?.sections) return null;

    if (currentLessonIndex > 0) {
      return (
        course.sections[currentSectionIndex]?.lessons[currentLessonIndex - 1]
          ?.id || null
      );
    } else if (currentSectionIndex > 0) {
      const prevSection = course.sections[currentSectionIndex - 1];
      return prevSection?.lessons[prevSection.lessons.length - 1]?.id || null;
    }
    return null;
  };

  // --- LOADING STATE ---
  if (loading || status === "loading") {
    return (
      <Container className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-48 w-full md:w-1/3 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (!course)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-muted-foreground">
        {t("notFound")}
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Link */}
      <Link
        href={`/hub/student/my-courses`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> {t("backToCourses")}
      </Link>

      {/* Header / Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-none shadow-md bg-card p-0!">
          <div className="flex flex-col md:flex-row p-2">
            {/* Course Image */}
            <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0">
              <Image
                src={course.imageUrl || "/images/course-placeholder.jpg"}
                alt={course.title}
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>

            {/* Course Info */}
            <div className=" py-4 lg:px-6 md:px-4 px-2 flex flex-col justify-between flex-1 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
                  {course.title}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 md:line-clamp-none">
                  {course.description}
                </p>
              </div>

              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Globe className="w-3 h-3" /> {course.language}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <LayoutList className="w-3 h-3" /> {course.totalLessons}{" "}
                    lições
                  </Badge>
                </div>

                <Separator />

                {/* Action Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {isEnrolled ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{t("yourProgress")}</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      {progressPercentage === 100 && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium mt-1">
                          <GraduationCap className="w-3 h-3" />{" "}
                          {t("courseCompleted")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full sm:w-auto font-semibold"
                    >
                      {enrolling ? t("enrolling") : t("enrollNow")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Course Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> {t("courseContent")}
        </h2>

        {!course.sections || course.sections.length === 0 ? (
          <Card className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 border-dashed">
            <BookOpen className="w-10 h-10 mb-2 opacity-50" />
            <p>{t("noContent")}</p>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={[course.sections[0]?.id]}
            className="space-y-4"
          >
            {course.sections.map((section, sectionIndex) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg bg-card px-2"
              >
                <AccordionTrigger className="px-2 hover:no-underline hover:bg-muted/50 rounded-md transition-colors">
                  <span className="font-medium text-left flex-1">
                    {section.title}
                    <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                      {section.lessons?.length || 0} {t("classes")}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="flex flex-col gap-1 mt-2">
                    {section.lessons?.map((lesson, lessonIndex) => {
                      const completed =
                        isEnrolled && isLessonCompleted(lesson.id);
                      const prevLessonId = getPreviousLessonId(
                        sectionIndex,
                        lessonIndex,
                      );
                      // Bloqueia se não matriculado OU (tem lição anterior E ela não foi completada)
                      const isLocked =
                        !isEnrolled ||
                        (prevLessonId && !isLessonCompleted(prevLessonId));

                      return (
                        <div
                          key={lesson.id}
                          className={`
                                relative flex items-center justify-between p-3 rounded-md border border-transparent
                                ${
                                  isLocked
                                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                                    : "bg-background hover:border-border hover:shadow-sm cursor-pointer group transition-all"
                                }
                            `}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {completed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                            ) : (
                              <PlayCircle className="w-5 h-5 text-primary shrink-0 group-hover:text-primary/80" />
                            )}

                            <span
                              className={`text-sm font-medium truncate ${completed ? "text-muted-foreground line-through decoration-emerald-500/50" : ""}`}
                            >
                              {lesson.title}
                            </span>
                          </div>

                          {!isLocked && (
                            <Link
                              href={`/hub/student/my-courses/course/lesson?courseId=${courseId}&lessonId=${lesson.id}`}
                              className="absolute inset-0 z-10"
                            >
                              <span className="sr-only">
                                {t("accessClass")}
                              </span>
                            </Link>
                          )}

                          {!isLocked && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </motion.div>
    </div>
  );
}
