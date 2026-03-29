"use client";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/ui/header";
import { NoResults } from "@/components/ui/no-results";
import { SearchBar } from "@/components/ui/search-bar";
import StudentCard from "@/components/teacher/StudentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbSearch from "@/components/shared/Breadcrum/BreadcrumbSearch";
import {
  useTeacherStudents,
  type TeacherStudentWithNextClass,
} from "@/hooks/teacher/useTeacherStudents";

const StudentCardSkeleton = () => (
  <Card>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-6 w-1/2 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-5 rounded shrink-0" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  </Card>
);

export default function MeusAlunos() {
  const t = useTranslations("MyStudentsPage");
  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: students,
    isLoading,
    error,
  } = useTeacherStudents(status === "authenticated");

  const filteredStudents = useMemo(() => {
    const list: TeacherStudentWithNextClass[] = Array.isArray(students)
      ? students
      : [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q),
    );
  }, [students, searchQuery]);

  if (error) {
    return <NoResults customMessage={{ withoutSearch: t("genericError") }} />;
  }

  return (
    <div className="container-padding">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Header
          heading={t("title")}
          subheading={t("subheading")}
          icon={
            <BreadcrumbActions placement="start">
              <BreadcrumbSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t("searchPlaceholder")}
              />
            </BreadcrumbActions>
          }
        />
        <div className="hidden md:block w-full md:w-auto md:min-w-[300px]">
          <SearchBar
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <StudentCardSkeleton key={index} />
            ))
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))
          ) : (
            <NoResults
              searchQuery={searchQuery}
              customMessage={{ withSearch: t("noResults") }}
              className="col-span-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
