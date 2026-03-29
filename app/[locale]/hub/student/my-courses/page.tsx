"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  BookOpen,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/ui/search-bar";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbSearch from "@/components/shared/Breadcrum/BreadcrumbSearch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookmarkIcon } from "@/public/animated/bookmark";
import { useStudentCourses } from "@/hooks/student/useStudentCourses";

export default function StudentCoursesPage() {
  const t = useTranslations("StudentCourses");
  const { status } = useSession();
  const [search, setSearch] = useState("");

  const {
    data: courses,
    isLoading,
    error,
    mutate,
  } = useStudentCourses(status === "authenticated");

  const filteredCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q),
    );
  }, [courses, search]);

  if (isLoading) {
    return (
      <div className="container-padding space-y-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="space-y-2 px-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Header
          heading={t("title")}
          subheading={t("subtitle")}
          icon={
            <div className="flex items-center gap-2">
              <BreadcrumbActions placement="start">
                <BreadcrumbSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t("searchPlaceholder")}
                />
              </BreadcrumbActions>
              <div className="hidden md:block w-72">
                <SearchBar
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          }
        />
      </motion.div>

      {error ? (
        <Empty className="py-24">
          <EmptyMedia>
            <BookmarkIcon size={48} className="text-primary" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("errorLoading")}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="link" onClick={() => mutate()}>
              {t("retry")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : filteredCourses.length === 0 ? (
        <Empty className="py-24">
          <EmptyMedia>
            <BookmarkIcon size={48} className="text-primary" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("noCoursesFound")}</EmptyTitle>
            <EmptyDescription>
              {search ? t("trySearching") : t("comingSoon")}
            </EmptyDescription>
          </EmptyHeader>
          {search && (
            <EmptyContent>
              <Button variant="link" onClick={() => setSearch("")}>
                {t("clearSearch")}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 group border-border/50 p-0!">
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image
                    src={course.imageUrl || "/images/course-placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <Badge
                      variant="secondary"
                      className="backdrop-blur-md bg-background/80 shadow-sm border-0"
                    >
                      {course.language}
                    </Badge>
                    {course.isEnrolled && (
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-0 flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> {t("enrolled")}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="p-4 pb-2 space-y-1 flex flex-row items-start justify-between">
                  <h2 className="text-lg font-bold text-foreground">
                    {course.title}
                  </h2>
                  <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                    <div
                      className="flex items-center gap-1"
                      title={t("duration")}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{course.duration}</span>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      title={t("modules")}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{course.sectionCount}</span>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      title={t("lessons")}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{course.lessonCount}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-grow space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Link
                    href={`my-courses/course?id=${course.id}`}
                    className="w-full"
                  >
                    <Button
                      className="w-full group/btn"
                      variant={course.isEnrolled ? "primary" : "secondary"}
                    >
                      {course.isEnrolled
                        ? t("continueCourse")
                        : t("viewDetails")}
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
