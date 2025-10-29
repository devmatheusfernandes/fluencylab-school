import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  availabilityRepository,
  classTemplateRepository,
  userAdminRepository,
} from "@/repositories";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has proper permissions
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  // Only admins and managers can assign schedules
  if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Permissão insuficiente." },
      { status: 403 }
    );
  }

  try {
    const { studentId, teacherId, slotId, language, day, startTime } =
      await request.json();

    // Validate required fields
    if (
      !studentId ||
      !teacherId ||
      !slotId ||
      !language ||
      !day ||
      !startTime
    ) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios não fornecidos.",
        },
        { status: 400 }
      );
    }

    // Remove the availability slot from teacher
    await availabilityRepository.deleteById(slotId);

    // Create the class template for the student
    const templateEntry = {
      day,
      hour: startTime,
      teacherId,
      language,
      id: `template-${Date.now()}`,
    };

    // Get existing student template or create new one
    let existingTemplate;
    try {
      existingTemplate = await classTemplateRepository.get(studentId);
    } catch (error) {
      console.log("Error fetching existing template:", error);
    }

    if (existingTemplate) {
      // Add to existing template
      const updatedDays = [...(existingTemplate.days || []), templateEntry];
      await classTemplateRepository.upsert(studentId, {
        ...existingTemplate,
        days: updatedDays,
      });
    } else {
      // Create new template
      await classTemplateRepository.upsert(studentId, {
        days: [templateEntry],
      });
    }

    // Update student's teachersIds array to establish teacher-student relationship
    try {
      const student = await userAdminRepository.findUserById(studentId);
      if (student) {
        const currentTeacherIds = student.teachersIds || [];

        // Add the teacher to the student's teachersIds array if not already present
        if (!currentTeacherIds.includes(teacherId)) {
          const updatedTeacherIds = [...currentTeacherIds, teacherId];
          await userAdminRepository.update(studentId, {
            teachersIds: updatedTeacherIds,
          });
          console.log(
            `Added teacher ${teacherId} to student ${studentId} teachersIds array`
          );
        }
      }
    } catch (error) {
      console.error("Error updating student teachersIds:", error);
      // Don't fail the entire operation if this update fails
    }

    return NextResponse.json({
      message: "Horário atribuído com sucesso!",
      templateEntry,
    });
  } catch (error: any) {
    console.error("Erro ao atribuir horário:", error);
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}

function getDayOfWeekNumber(dayName: string): number {
  const days: Record<string, number> = {
    Domingo: 0,
    Segunda: 1,
    Terça: 2,
    Quarta: 3,
    Quinta: 4,
    Sexta: 5,
    Sábado: 6,
  };
  return days[dayName] || 0;
}
