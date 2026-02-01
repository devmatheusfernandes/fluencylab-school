import { userAdminRepository, classRepository } from "@/repositories";
import { PopulatedStudentClass } from "@/types/classes/class";

// Usando instâncias singleton centralizadas
const userAdminRepo = userAdminRepository;

export class TeacherService {
  async getPopulatedScheduledClasses(
    teacherId: string
  ): Promise<PopulatedStudentClass[]> {
    // 1. Busca todas as aulas futuras do professor
    const classes = await classRepository.findFutureClassesByTeacherId(
      teacherId
    );
    if (classes.length === 0) {
      return [];
    }

    // 2. Extrai os IDs únicos dos alunos dessas aulas
    const studentIds = [...new Set(classes.map((c) => c.studentId))];

    // 3. Busca os perfis de todos esses alunos de uma só vez
    const students = await userAdminRepo.findUsersByIds(studentIds);

    // 4. Cria um "mapa" para facilitar a busca do aluno pelo ID
    const studentMap = new Map(students.map((s) => [s.id, s]));

    // 5. Combina os dados da aula com os dados do aluno
    const populatedClasses = classes.map((cls) => {
      const student = studentMap.get(cls.studentId);
      return {
        ...cls,
        studentName: student?.name || "Aluno Desconhecido",
        studentAvatarUrl: student?.avatarUrl,
      };
    });

    return populatedClasses;
  }

  async getMyStudentsWithNextClass(teacherId: string) {
    try {
      console.log(`Fetching future classes for teacher: ${teacherId}`);
      // 1. Busca todas as aulas futuras do professor
      const classes = await classRepository.findFutureClassesByTeacherId(
        teacherId
      );
      console.log(
        `Found ${classes.length} future classes for teacher: ${teacherId}`
      );

      if (classes.length === 0) {
        return [];
      }

      // 2. Extrai os IDs únicos dos alunos dessas aulas
      const studentIds = [...new Set(classes.map((c) => c.studentId))];

      // 3. Busca os perfis de todos esses alunos de uma só vez
      const students = await userAdminRepo.findUsersByIds(studentIds);
      console.log(
        `Found ${students.length} students for teacher: ${teacherId}`
      );

      // 4. Cria um "mapa" para facilitar a busca do aluno pelo ID
      const studentMap = new Map(students.map((s) => [s.id, s]));

      // 5. Para cada aluno, encontra a próxima aula
      const studentsWithNextClass = students.map((student) => {
        // Filtra as aulas deste aluno e ordena por data
        const studentClasses = classes
          .filter((cls) => cls.studentId === student.id)
          .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

        // Pega a próxima aula (a primeira da lista ordenada)
        const nextClass = studentClasses.length > 0 ? studentClasses[0] : null;

        return {
          id: student.id,
          name: student.name,
          email: student.email || "",
          avatarUrl: student.avatarUrl,
          nextClass: nextClass
            ? {
                scheduledAt: nextClass.scheduledAt.toISOString(), // Convert to ISO string for proper serialization
                language: nextClass.language,
              }
            : null,
        };
      });

      // Ordena os alunos pela data da próxima aula (os que têm aula mais próxima primeiro)
      const sortedStudents = studentsWithNextClass.sort((a, b) => {
        // Se ambos têm próxima aula, ordena por data
        if (a.nextClass && b.nextClass) {
          const dateA = new Date(a.nextClass.scheduledAt);
          const dateB = new Date(b.nextClass.scheduledAt);
          return dateA.getTime() - dateB.getTime();
        }
        // Se apenas um tem próxima aula, ele vem primeiro
        if (a.nextClass) return -1;
        if (b.nextClass) return 1;
        // Se nenhum tem próxima aula, mantém a ordem
        return 0;
      });

      // console.log(
      //   `Returning ${sortedStudents.length} students with next class info for teacher: ${teacherId}`
      // );

      return sortedStudents;
    } catch (error) {
      console.error("Error in getMyStudentsWithNextClass:", error);
      throw error;
    }
  }
}

export const teacherService = new TeacherService();

export default TeacherService;
