import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { Course, Section, Lesson, QuizQuestion } from "@/types/quiz/types";

const coursesCollection = adminDb.collection("Cursos");

export class CourseRepository {
  async list(): Promise<Course[]> {
    const snapshot = await coursesCollection.get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as unknown as Course;
    });
  }

  async getById(courseId: string): Promise<Course | null> {
    const docRef = coursesCollection.doc(courseId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
      id: snap.id,
      ...data,
    } as unknown as Course;
  }

  async getSectionsWithLessons(courseId: string): Promise<Section[]> {
    const sectionsRef = coursesCollection.doc(courseId).collection("sections");
    const sectionsSnap = await sectionsRef.orderBy("order", "asc").get();
    if (sectionsSnap.empty) return [];

    const sections: Section[] = [];
    for (const sectionDoc of sectionsSnap.docs) {
      const sectionData = sectionDoc.data() as any;
      const lessonsRef = sectionsRef.doc(sectionDoc.id).collection("lessons");
      const lessonsSnap = await lessonsRef.orderBy("order", "asc").get();
      const lessons: Lesson[] = lessonsSnap.docs.map((lessonDoc) => {
        const ld = lessonDoc.data() as any;
        return {
          id: lessonDoc.id,
          sectionId: sectionDoc.id,
          title: ld.title,
          order: ld.order ?? 0,
          contentBlocks: ld.contentBlocks || [],
          quiz: (ld.quiz || []) as QuizQuestion[],
          attachments: ld.attachments || [],
        } as Lesson;
      });
      sections.push({
        id: sectionDoc.id,
        title: sectionData.title,
        order: sectionData.order ?? 0,
        lessons,
      } as Section);
    }
    return sections;
  }

  async create(data: Omit<Course, "id" | "sections" | "lessons" | "quizzes">): Promise<string> {
    const docRef = await coursesCollection.add({
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async update(courseId: string, data: Partial<Course>): Promise<void> {
    const docRef = coursesCollection.doc(courseId);
    await docRef.update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(courseId: string): Promise<void> {
    await coursesCollection.doc(courseId).delete();
  }

  async createSection(courseId: string, title: string, order: number): Promise<string> {
    const sectionsRef = coursesCollection.doc(courseId).collection("sections");
    const docRef = await sectionsRef.add({ title, order });
    return docRef.id;
  }

  async updateSection(courseId: string, sectionId: string, data: Partial<Section>): Promise<void> {
    const sectionRef = coursesCollection.doc(courseId).collection("sections").doc(sectionId);
    await sectionRef.update(data);
  }

  async deleteSection(courseId: string, sectionId: string): Promise<void> {
    const sectionRef = coursesCollection.doc(courseId).collection("sections").doc(sectionId);
    await sectionRef.delete();
  }

  async createLesson(courseId: string, sectionId: string, data: Omit<Lesson, "id">): Promise<string> {
    const lessonsRef = coursesCollection.doc(courseId).collection("sections").doc(sectionId).collection("lessons");
    const docRef = await lessonsRef.add(data);
    return docRef.id;
  }

  async updateLesson(courseId: string, sectionId: string, lessonId: string, data: Partial<Lesson>): Promise<void> {
    const lessonRef = coursesCollection.doc(courseId).collection("sections").doc(sectionId).collection("lessons").doc(lessonId);
    await lessonRef.update(data);
  }

  async deleteLesson(courseId: string, sectionId: string, lessonId: string): Promise<void> {
    const lessonRef = coursesCollection.doc(courseId).collection("sections").doc(sectionId).collection("lessons").doc(lessonId);
    await lessonRef.delete();
  }

  async swapOrderForSections(courseId: string, sectionIdA: string, orderA: number, sectionIdB: string, orderB: number): Promise<void> {
    const batch = adminDb.batch();
    const base = coursesCollection.doc(courseId).collection("sections");
    batch.update(base.doc(sectionIdA), { order: orderB });
    batch.update(base.doc(sectionIdB), { order: orderA });
    await batch.commit();
  }

  async swapOrderForLessons(courseId: string, sectionId: string, lessonIdA: string, orderA: number, lessonIdB: string, orderB: number): Promise<void> {
    const batch = adminDb.batch();
    const base = coursesCollection.doc(courseId).collection("sections").doc(sectionId).collection("lessons");
    batch.update(base.doc(lessonIdA), { order: orderB });
    batch.update(base.doc(lessonIdB), { order: orderA });
    await batch.commit();
  }
}
