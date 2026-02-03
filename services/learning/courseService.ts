import { adminStorage, adminDb } from "@/lib/firebase/admin";
import { courseRepository } from "@/repositories";
import { Course, Section, Lesson, QuizQuestion } from "@/types/quiz/types";

export class CourseService {
  async getEnrolledStudentIds(courseId: string): Promise<string[]> {
    try {
      // Strategy 1: Try fetching from course's enrollments subcollection (New standard)
      const courseEnrollmentsSnapshot = await adminDb
        .collection(`courses/${courseId}/enrollments`)
        .get();

      if (!courseEnrollmentsSnapshot.empty) {
        return courseEnrollmentsSnapshot.docs.map((doc) => doc.data().userId);
      }

      // Strategy 2: Fallback to collectionGroup (Legacy/If index exists)
      // Note: This requires a composite index on 'enrollments' collection group
      const legacyEnrollmentsSnapshot = await adminDb
        .collectionGroup("enrollments")
        .where("courseId", "==", courseId)
        .get();

      const studentIds = legacyEnrollmentsSnapshot.docs
        .map((doc) => doc.data().userId)
        .filter((id) => !!id);

      return Array.from(new Set(studentIds));
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      return [];
    }
  }

  async listCourses(): Promise<Course[]> {
    return await courseRepository.list();
  }

  async getCourseWithContent(courseId: string): Promise<{ course: Course; sections: Section[] } | null> {
    const course = await courseRepository.getById(courseId);
    if (!course) return null;
    const sections = await courseRepository.getSectionsWithLessons(courseId);
    return { course, sections };
  }

  async createCourse(data: Omit<Course, "id" | "sections" | "lessons" | "quizzes">): Promise<string> {
    return await courseRepository.create(data);
  }

  async updateCourseDetails(courseId: string, data: Partial<Course>): Promise<void> {
    await courseRepository.update(courseId, data);
  }

  async deleteCourse(courseId: string): Promise<void> {
    await courseRepository.delete(courseId);
  }

  async saveSection(courseId: string, section: { id?: string; title: string; order?: number }): Promise<void> {
    if (section.id) {
      await courseRepository.updateSection(courseId, section.id, { title: section.title });
    } else {
      const order = section.order ?? 0;
      await courseRepository.createSection(courseId, section.title, order);
    }
  }

  async deleteSectionWithContent(courseId: string, sectionId: string): Promise<void> {
    const sections = await courseRepository.getSectionsWithLessons(courseId);
    const target = sections.find((s) => s.id === sectionId);
    if (target) {
      for (const lesson of target.lessons) {
        if (lesson.attachments && lesson.attachments.length > 0) {
          for (const attachment of lesson.attachments) {
            const filePath = this.extractStoragePathFromUrl(attachment.url);
            if (filePath) {
              await adminStorage.bucket().file(filePath).delete({ ignoreNotFound: true });
            }
          }
        }
        await courseRepository.deleteLesson(courseId, sectionId, lesson.id);
      }
    }
    await courseRepository.deleteSection(courseId, sectionId);
  }

  async saveLesson(courseId: string, sectionId: string, lesson: { id?: string } & Partial<Lesson>): Promise<string> {
    if (lesson.id) {
      const { id, ...payload } = lesson;
      await courseRepository.updateLesson(courseId, sectionId, id, payload);
      return id;
    } else {
      const createdId = await courseRepository.createLesson(courseId, sectionId, lesson as Omit<Lesson, "id">);
      return createdId;
    }
  }

  async deleteLesson(courseId: string, sectionId: string, lessonId: string): Promise<void> {
    await courseRepository.deleteLesson(courseId, sectionId, lessonId);
  }

  async saveQuizQuestion(courseId: string, sectionId: string, lesson: Lesson, question: Omit<QuizQuestion, "id">, existingId?: string): Promise<void> {
    const updatedQuiz: QuizQuestion[] = existingId
      ? (lesson.quiz || []).map((q) => (q.id === existingId ? { ...q, ...question } : q))
      : [...(lesson.quiz || []), { ...question, id: this.generateId() }];
    await courseRepository.updateLesson(courseId, sectionId, lesson.id, { quiz: updatedQuiz });
  }

  async deleteQuizQuestion(courseId: string, sectionId: string, lesson: Lesson, questionId: string): Promise<void> {
    const updatedQuiz = (lesson.quiz || []).filter((q) => q.id !== questionId);
    await courseRepository.updateLesson(courseId, sectionId, lesson.id, { quiz: updatedQuiz });
  }

  async swapSectionOrder(courseId: string, a: { id: string; order: number }, b: { id: string; order: number }): Promise<void> {
    await courseRepository.swapOrderForSections(courseId, a.id, a.order, b.id, b.order);
  }

  async swapLessonOrder(courseId: string, sectionId: string, a: { id: string; order: number }, b: { id: string; order: number }): Promise<void> {
    await courseRepository.swapOrderForLessons(courseId, sectionId, a.id, a.order, b.id, b.order);
  }

  async addLessonAttachment(courseId: string, sectionId: string, lessonId: string, attachment: any): Promise<void> {
    const lessonRef = adminDb
      .collection("Cursos")
      .doc(courseId)
      .collection("sections")
      .doc(sectionId)
      .collection("lessons")
      .doc(lessonId);
    const snap = await lessonRef.get();
    const data = snap.exists ? snap.data() : {};
    const attachments = Array.isArray((data as any).attachments) ? (data as any).attachments : [];
    const next = [...attachments, attachment];
    await lessonRef.update({ attachments: next });
  }

  async removeLessonAttachment(courseId: string, sectionId: string, lessonId: string, attachment: any): Promise<void> {
    const lessonRef = adminDb
      .collection("Cursos")
      .doc(courseId)
      .collection("sections")
      .doc(sectionId)
      .collection("lessons")
      .doc(lessonId);
    const snap = await lessonRef.get();
    const data = snap.exists ? snap.data() : {};
    const attachments = Array.isArray((data as any).attachments) ? (data as any).attachments : [];
    const next = attachments.filter((a: any) => a.id !== attachment.id);
    await lessonRef.update({ attachments: next });
  }

  private extractStoragePathFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const pathParam = u.pathname.includes("/o/") ? u.pathname.split("/o/")[1] : "";
      const encodedPath = pathParam || u.searchParams.get("name") || "";
      if (!encodedPath) return null;
      return decodeURIComponent(encodedPath);
    } catch {
      return null;
    }
  }

  private generateId(): string {
    return `_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export const courseService = new CourseService();
