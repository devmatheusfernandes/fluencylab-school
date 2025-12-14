"use client";

import { StudentClass, ClassStatus } from "@/types/classes/class";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Text } from "@/components/ui/text";
import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";

interface UserClassesTabProps {
  classes: StudentClass[];
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  role: string;
}

// Helper para gerar uma lista de anos para o filtro
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 1; i <= currentYear + 2; i++) {
    years.push(i);
  }
  return years;
};

const monthOptions = [
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

// Group classes by year and month
const groupClassesByMonth = (classes: StudentClass[]) => {
  const grouped: Record<string, StudentClass[]> = {};

  classes.forEach((cls) => {
    const date = new Date(cls.scheduledAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(cls);
  });

  // Sort by date descending
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  });

  return grouped;
};

export default function UserClassesTab({
  classes: initialClasses,
}: UserClassesTabProps) {
  const router = useRouter();
  const yearOptions = useMemo(() => generateYearOptions(), []);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [classes, setClasses] = useState<StudentClass[]>(initialClasses || []);

  // State for confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTeacherUpdate, setPendingTeacherUpdate] = useState<{
    classId: string;
    teacherId: string;
    teacherName: string;
    currentTeacherName: string;
  } | null>(null);

  // Fetch available teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("/api/admin/teachers");
        if (!response.ok) {
          throw new Error("Failed to fetch teachers");
        }
        const teacherList = await response.json();
        setTeachers(teacherList);
      } catch (error) {
        console.error("Erro ao buscar professores:", error);
        toast.error("Erro ao carregar professores");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  // Estados para controlar os filtros selecionados
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  // Group classes by month/year
  const groupedClasses = useMemo(
    () => groupClassesByMonth(classes || []),
    [classes]
  );

  // Filter classes based on selected month and year
  const filteredClasses = useMemo(() => {
    if (!classes) return [];

    return classes.filter((cls) => {
      const classDate = new Date(cls.scheduledAt);

      const monthMatch =
        selectedMonth === "all" || classDate.getMonth() === selectedMonth;
      const yearMatch =
        selectedYear === "all" || classDate.getFullYear() === selectedYear;

      return monthMatch && yearMatch;
    });
  }, [classes, selectedMonth, selectedYear]);

  // Get sorted group keys (year-month combinations)
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedClasses).sort((a, b) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);

      if (yearA !== yearB) {
        return yearB - yearA; // Sort by year descending
      }
      return monthB - monthA; // Sort by month descending
    });
  }, [groupedClasses]);

  if (!classes || classes.length === 0) {
    return <Text>Este utilizador não tem nenhuma aula agendada.</Text>;
  }

  // Function to update class teacher
  const updateClassTeacher = async (classId: string, teacherId: string) => {
    // Handle the "none" case by setting teacherId to null
    const actualTeacherId = teacherId === "none" ? null : teacherId;

    try {
      const response = await fetch(`/api/classes/${classId}/teacher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId: actualTeacherId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao atualizar professor da aula");
      }

      toast.success("Professor da aula atualizado com sucesso!");

      // Reload classes to reflect the change
      window.location.reload();
    } catch (error: any) {
      toast.error(`Erro ao atualizar professor: ${error.message}`);
    }
  };

  // Function to confirm and update class teacher
  const confirmUpdateClassTeacher = async () => {
    if (!pendingTeacherUpdate) return;

    const { classId, teacherId } = pendingTeacherUpdate;
    // Handle the "none" case by setting teacherId to null
    const actualTeacherId = teacherId === "none" ? null : teacherId;

    try {
      const response = await fetch(`/api/classes/${classId}/teacher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId: actualTeacherId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao atualizar professor da aula");
      }

      toast.success("Professor da aula atualizado com sucesso!");
      setIsModalOpen(false);
      setPendingTeacherUpdate(null);

      // Update the classes state instead of reloading the page
      setClasses((prevClasses) =>
        prevClasses.map((cls) => {
          if (cls.id === classId) {
            // Create a new object with all properties
            const updatedClass = { ...cls };
            // Add or remove teacherId based on whether it's null
            if (actualTeacherId !== null) {
              updatedClass.teacherId = actualTeacherId;
            } else {
              delete updatedClass.teacherId;
            }
            return updatedClass;
          }
          return cls;
        })
      );
    } catch (error: any) {
      toast.error(`Erro ao atualizar professor: ${error.message}`);
      setIsModalOpen(false);
      setPendingTeacherUpdate(null);
    }
  };

  // Function to handle teacher change (opens confirmation modal)
  const handleTeacherChange = (
    classId: string,
    teacherId: string,
    currentTeacherName: string
  ) => {
    // Find the new teacher name
    let newTeacherName = "Nenhum professor";
    if (teacherId !== "none") {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (teacher) {
        newTeacherName = teacher.name;
      }
    }

    setPendingTeacherUpdate({
      classId,
      teacherId,
      teacherName: newTeacherName,
      currentTeacherName,
    });
    setIsModalOpen(true);
  };

  // Get status badge with appropriate styling
  const getStatusVariant = (status: ClassStatus) => {
    switch (status) {
      case ClassStatus.SCHEDULED:
        return "primary";
      case ClassStatus.COMPLETED:
        return "success";
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
        return "warning";
      default:
        return "destructive";
    }
  };

  const getStatusBadge = (cls: StudentClass) => {
    return (
      <>
        <Badge  className="capitalize">
          {/* variant={getStatusVariant(cls.status)} */}
          {cls.status}
        </Badge>
        {cls.rescheduledFrom && (
          <Badge  className="text-xs">
            Reagendada
          </Badge>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- Confirmation Modal --- */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmar Alteração de Professor</ModalTitle>
            <ModalDescription>
              Tem certeza que deseja alterar o professor desta aula?
            </ModalDescription>
          </ModalHeader>

          {pendingTeacherUpdate && (
            <div className="py-4 space-y-2">
              <p>
                <strong>Professor atual:</strong>{" "}
                {pendingTeacherUpdate.currentTeacherName}
              </p>
              <p>
                <strong>Novo professor:</strong>{" "}
                {pendingTeacherUpdate.teacherName}
              </p>
            </div>
          )}

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </ModalClose>
            <Button onClick={confirmUpdateClassTeacher}>Confirmar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Barra de Filtros --- */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select
          value={String(selectedMonth)}
          onValueChange={(val) =>
            setSelectedMonth(val === "all" ? "all" : Number(val))
          }
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={String(month.value)}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={(val) =>
            setSelectedYear(val === "all" ? "all" : Number(val))
          }
        >
          <SelectTrigger className="w-full md:w-[120px]">
            <SelectValue placeholder="Filtrar por Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* --- Classes organized by month --- */}
      {selectedMonth === "all" && selectedYear === "all" ? (
        sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map((key) => {
            const [year, month] = key.split("-").map(Number);
            const monthClasses = groupedClasses[key];
            const monthLabel = monthOptions[month]?.label;

            return (
              <div key={key} className="space-y-3">
                <Text size="lg" weight="bold" className="border-b pb-2">
                  {monthLabel} {year}
                </Text>
                <div className="space-y-4">
                  {monthClasses.map((cls, index) => {
                    const classDate = new Date(cls.scheduledAt);
                    const formattedDate = classDate.toLocaleDateString(
                      "pt-BR",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      }
                    );
                    const formattedTime = classDate.toLocaleTimeString(
                      "pt-BR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <Card
                        key={`${cls.id}-${cls.scheduledAt}-${index}`}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div>
                              <p className="font-bold text-lg">
                                {formattedDate}
                              </p>
                              <p className="text-sm text-subtitle">
                                {formattedTime}
                              </p>
                              {cls.notes && (
                                <p className="text-sm mt-2 italic text-subtitle">
                                  {cls.notes}
                                </p>
                              )}

                              {/* Teacher Assignment Section */}
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Professor:
                                </label>
                                <div className="flex items-center space-x-2">
                                  <Select
                                    value={cls.teacherId || ""}
                                    onValueChange={(value) =>
                                      handleTeacherChange(
                                        cls.id,
                                        value,
                                        cls.teacherId
                                          ? teachers.find(
                                              (t) => t.id === cls.teacherId
                                            )?.name || "Professor desconhecido"
                                          : "Nenhum professor"
                                      )
                                    }
                                    disabled={loadingTeachers}
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="Selecionar professor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem key="none" value="none">
                                        Nenhum professor
                                      </SelectItem>
                                      {teachers.map((teacher) => (
                                        <SelectItem
                                          key={teacher.id}
                                          value={teacher.id}
                                        >
                                          {teacher.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {loadingTeachers && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(cls)}
                          </div>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/hub/plataforma/class/${cls.id}`)
                            }
                          >
                            Ver Aula
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <Text>Nenhuma aula encontrada.</Text>
        )
      ) : (
        /* --- Filtered view --- */
        <div className="space-y-4">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls, index) => {
              const classDate = new Date(cls.scheduledAt);
              const formattedDate = classDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              });
              const formattedTime = classDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={`${cls.id}-${cls.scheduledAt}-${index}`}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div>
                        <p className="font-bold text-lg">{formattedDate}</p>
                        <p className="text-sm text-subtitle">{formattedTime}</p>
                        {cls.notes && (
                          <p className="text-sm mt-2 italic text-subtitle">
                            {cls.notes}
                          </p>
                        )}

                        {/* Teacher Assignment Section */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Professor:
                          </label>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={cls.teacherId || ""}
                              onValueChange={(value) =>
                                handleTeacherChange(
                                  cls.id,
                                  value,
                                  cls.teacherId
                                    ? teachers.find(
                                        (t) => t.id === cls.teacherId
                                      )?.name || "Professor desconhecido"
                                    : "Nenhum professor"
                                )
                              }
                              disabled={loadingTeachers}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecionar professor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="none" value="none">
                                  Nenhum professor
                                </SelectItem>
                                {teachers.map((teacher) => (
                                  <SelectItem
                                    key={teacher.id}
                                    value={teacher.id}
                                  >
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {loadingTeachers && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(cls)}
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/hub/plataforma/class/${cls.id}`)
                      }
                    >
                      Ver Aula
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <Text>Nenhuma aula encontrada para o período selecionado.</Text>
          )}
        </div>
      )}
    </div>
  );
}
