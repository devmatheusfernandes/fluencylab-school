"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { NoResults } from "@/components/ui/no-results";
import { SearchBar } from "@/components/ui/search-bar";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import StudentCard from "@/components/teacher/student-card";

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
        setError("Erro ao carregar os alunos. Por favor, tente novamente.");
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
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Erro! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <Container className="p-3">
      {/* Search Bar */}
      <SearchBar
        placeholder="Procure seus alunos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Students List */}
      <div className="flex-1 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <Spinner key={index} />)
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))
          ) : (
            <NoResults searchQuery={searchQuery} className="col-span-full" />
          )}
        </div>
      </div>
    </Container>
  );
}
