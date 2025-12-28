"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { NoResults } from "@/components/ui/no-results";
import { SearchBar } from "@/components/ui/search-bar";
import StudentCard from "@/components/teacher/StudentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentWithNextClass {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nextClass: {
    scheduledAt: string | Date;
    language: string;
  } | null;
}

export default function MeusAlunos() {
  const t = useTranslations("MyStudentsPage");
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentWithNextClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/teacher/my-students`);

        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }

        const data = await response.json();
        setStudents(data);
      } catch (error: any) {
        console.error("Error fetching students:", error);
        setError(t("errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [session?.user?.id]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return <NoResults customMessage={{ withoutSearch: t("genericError") }} />;
  }

  return (
    <div className="mx-1 sm:mx-0">
      {/* Search Bar */}
      <SearchBar
        placeholder={t("searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Students List */}
      <div className="flex-1 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40" />
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
