
import { adminDb } from "@/lib/firebase/admin";
import { Plan, PlanStatus, PlanType } from "@/types/plan";
import { Timestamp } from "firebase-admin/firestore";

export class PlanRepository {
  private collectionRef = adminDb.collection("plans");

  private convertTimestamps(data: any, docId: string): Plan {
    const toDate = (val: any) => {
      if (!val) return undefined;
      if (typeof val.toDate === "function") return val.toDate();
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    return {
      id: docId,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lessons: data.lessons.map((lesson: any) => ({
        ...lesson,
        scheduledDate: toDate(lesson.scheduledDate),
        learningItemsIds: lesson.learningItemsIds?.map((item: any) => ({
          ...item,
          updatedAt: toDate(item.updatedAt),
          lastReviewedAt: toDate(item.lastReviewedAt),
          srsData: item.srsData
            ? {
                ...item.srsData,
                dueDate: toDate(item.srsData.dueDate),
              }
            : undefined,
        })) || [],
        learningStructureIds: lesson.learningStructureIds?.map((item: any) => ({
          ...item,
          updatedAt: toDate(item.updatedAt),
          lastReviewedAt: toDate(item.lastReviewedAt),
          srsData: item.srsData
            ? {
                ...item.srsData,
                dueDate: toDate(item.srsData.dueDate),
              }
            : undefined,
        })) || [],
      })),
    } as Plan;
  }

  async create(plan: Omit<Plan, "id">): Promise<string> {
    const docRef = this.collectionRef.doc();
    await docRef.set({
      ...plan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async findById(id: string): Promise<Plan | null> {
    const doc = await this.collectionRef.doc(id).get();
    if (!doc.exists) return null;
    return this.convertTimestamps(doc.data(), doc.id);
  }

  async findActivePlanByStudent(studentId: string): Promise<Plan | null> {
    const snapshot = await this.collectionRef
      .where("studentId", "==", studentId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.convertTimestamps(snapshot.docs[0].data(), snapshot.docs[0].id);
  }

  async findTemplates(): Promise<Plan[]> {
    const snapshot = await this.collectionRef
      .where("type", "==", "template")
      .get();

    return snapshot.docs.map((doc) =>
      this.convertTimestamps(doc.data(), doc.id)
    );
  }

  async update(id: string, data: Partial<Plan>): Promise<void> {
    await this.collectionRef.doc(id).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }
}

export const planRepository = new PlanRepository();
