'use server';

import { planRepository, classRepository } from "@/repositories";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { Plan } from "@/types/financial/plan";

import { startOfDay } from "date-fns";

// Helper to remove undefined values recursively for Firestore
function cleanFirestoreData(obj: any): any {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  
  if (Array.isArray(obj)) {
    // For arrays, map and keep nulls but filter undefineds if strictly needed, 
    // or just transform undefined to null to maintain index matching if that matters.
    // Usually for Firestore arrays, we want to remove undefined items or convert to null.
    // Let's convert undefined to null inside arrays to be safe with indexes, 
    // BUT for "lessons", removing an item might be bad.
    // However, the error is usually about a PROPERTY of an object inside an array being undefined.
    return obj.map(v => cleanFirestoreData(v));
  }
  
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const value = cleanFirestoreData(obj[key]);
      if (value !== undefined) {
        newObj[key] = value;
      }
    });
    return newObj;
  }
  
  return obj;
}

export async function connectPlanToClasses(planId: string, studentId: string) {
  try {
    console.log(`[connectPlanToClasses] Starting for plan ${planId} and student ${studentId}`);
    
    // 1. Fetch Plan and Student Classes
    const plan = await planRepository.findById(planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.studentId !== studentId) throw new Error("Plan does not belong to this student");

    // Fetch future scheduled classes (including today)
    // We use a custom query here to ensure we get classes from start of today
    const today = startOfDay(new Date());
    const snapshot = await adminDb.collection("classes")
      .where("studentId", "==", studentId)
      .where("scheduledAt", ">=", today)
      .orderBy("scheduledAt", "asc")
      .get();
      
    // Filter only truly available classes
    // We should exclude canceled/rescheduled classes.
    // Completed classes from today MIGHT be relevant if we are logging past lessons, 
    // but usually we plan for "scheduled" classes. 
    // If the user wants to attach to a class that just happened today, we might include 'completed'.
    // Let's stick to 'scheduled' for now as it's safer for "planning".
    const futureClasses = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: (doc.data().scheduledAt as Timestamp).toDate(),
        status: doc.data().status
      }))
      .filter(c => c.status === 'scheduled'); // Filter in memory to avoid complex compound queries index issues if not needed

    console.log(`[connectPlanToClasses] Found ${futureClasses.length} valid scheduled classes starting from ${today.toISOString()}`);

    
    // 2. Prepare Updates
    const batch = adminDb.batch();
    const planRef = adminDb.collection("plans").doc(planId);
    
    const updatedLessons = [...plan.lessons];
    let classIndex = 0;
    let updatesCount = 0;

    // Iterate through lessons to assign classes
    for (let i = 0; i < updatedLessons.length; i++) {
      const lesson = updatedLessons[i];

      // Skip lessons already scheduled if the class is still valid/future?
      // For this feature, we might want to "Resync" everything from today onwards.
      // Strategy: Only fill "empty" slots or overwrite?
      // User request: "The manager will choose lessons... or choose a ready plan... finally a function connects"
      // Simplest robust approach: Fill sequentially starting from the first available class.
      
      if (classIndex < futureClasses.length) {
        const studentClass = futureClasses[classIndex];
        
        // Update Lesson in Plan
        updatedLessons[i] = {
          ...lesson,
          scheduledClassId: studentClass.id,
          scheduledDate: studentClass.scheduledAt
        };

        // Update Class in Firestore
        const classRef = adminDb.collection("classes").doc(studentClass.id);
        batch.update(classRef, {
          planId: plan.id,
          planName: plan.name,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          updatedAt: Timestamp.now()
        });
        
        updatesCount++;
        classIndex++;
      } else {
        // No more classes available
        // Clear schedule info if it was set but no class is available now?
        // For now, let's keep it additive or just stop.
        // If we are re-syncing, maybe we should clear future lessons that lost their class?
        if (updatedLessons[i].scheduledClassId) {
             // Optional: Clear if we want strict sync
             // updatedLessons[i].scheduledClassId = undefined;
             // updatedLessons[i].scheduledDate = undefined;
        }
      }
    }

    // 3. Update Plan with new lesson schedule
    batch.update(planRef, cleanFirestoreData({
      lessons: updatedLessons,
      updatedAt: Timestamp.now()
    }));

    console.log(`[connectPlanToClasses] Committing batch with ${updatesCount} class updates`);
    await batch.commit();
    
    revalidatePath(`/hub/manager/users/${studentId}`);
    return { success: true, message: `Plan connected to ${updatesCount} classes successfully`, updatesCount };

  } catch (error: any) {
    console.error("Error connecting plan:", error);
    return { success: false, error: error.message, updatesCount: 0 };
  }
}

export async function assignTemplateToStudent(templateId: string, studentId: string) {
  try {
    // 1. Get Template
    const template = await planRepository.findById(templateId);
    if (!template) throw new Error("Template not found");

    // 2. Create new Plan for Student
    const newPlanId = await planRepository.create({
      ...template,
      type: 'student',
      status: 'active',
      studentId: studentId,
      // Clear any previous scheduling info from template (if any dirty data)
      lessons: template.lessons.map(l => ({
        ...l,
        scheduledClassId: undefined,
        scheduledDate: undefined
      }))
    });

    // 3. Connect to classes immediately
    const connectResult = await connectPlanToClasses(newPlanId, studentId);

    if (!connectResult.success || (connectResult.updatesCount === 0 && template.lessons.length > 0)) {
        await adminDb.collection("plans").doc(newPlanId).delete();
        throw new Error(connectResult.error || "Não foi possível agendar as aulas do template. Verifique se o aluno possui aulas futuras.");
    }

    revalidatePath(`/hub/manager/users/${studentId}`);
    return { success: true, planId: newPlanId };

  } catch (error: any) {
    console.error("Error assigning template:", error);
    return { success: false, error: error.message };
  }
}

export async function createPlan(data: Partial<Plan>) {
  try {
    // Basic validation
    if (!data.name) throw new Error("Name is required");
    if (!data.lessons || data.lessons.length === 0) throw new Error("At least one lesson is required");

    const planData = {
      ...data,
      learnedComponentsIds: [],
      reviewLearnedComponentsIds: [],
      // Ensure lessons have necessary structure
      lessons: data.lessons?.map((l: any) => ({
        ...l,
        learningItemsIds: l.learningItemsIds || (l.relatedLearningItemIds ? l.relatedLearningItemIds.map((id: string) => ({ id, updatedAt: new Date() })) : []),
        learningStructureIds: l.learningStructureIds || (l.relatedLearningStructureIds ? l.relatedLearningStructureIds.map((id: string) => ({ id, updatedAt: new Date() })) : []),
      })) || []
    };

    const id = await planRepository.create(cleanFirestoreData(planData) as any); // Type casting due to some missing props being optional in interface but required in creation logic
    
    // If it's a student plan, connect to classes immediately
    if (data.type === 'student' && data.studentId) {
       const connectResult = await connectPlanToClasses(id, data.studentId);

       // Strict validation: If connection failed or no classes were connected (and we have lessons), rollback
       if (!connectResult.success || (connectResult.updatesCount === 0 && planData.lessons.length > 0)) {
          console.warn(`[createPlan] Connection failed or no classes scheduled (updates: ${connectResult.updatesCount}). Rolling back plan ${id}.`);
          // Delete the created plan to ensure atomicity/consistency with user requirements
          await adminDb.collection("plans").doc(id).delete();
          
          const errorMessage = !connectResult.success 
            ? connectResult.error 
            : "Não há aulas agendadas disponíveis para vincular a este plano. Agende aulas futuras para o aluno antes de criar o plano.";
            
          throw new Error(errorMessage);
       }
    }

    revalidatePath("/hub/material-manager/plans");
    if (data.studentId) revalidatePath(`/hub/manager/users/${data.studentId}`);

    return { success: true, plan: { ...planData, id } as Plan };
  } catch (error: any) {
    console.error("Error creating plan:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePlan(id: string, data: Partial<Plan>) {
  try {
    const updateData = { ...data };
    
    // Ensure lessons have necessary structure if they are being updated
    if (data.lessons) {
      updateData.lessons = data.lessons.map((l: any) => ({
        ...l,
        learningItemsIds: l.learningItemsIds || (l.relatedLearningItemIds ? l.relatedLearningItemIds.map((id: string) => ({ id, updatedAt: new Date() })) : []),
        learningStructureIds: l.learningStructureIds || (l.relatedLearningStructureIds ? l.relatedLearningStructureIds.map((id: string) => ({ id, updatedAt: new Date() })) : []),
      }));
    }

    // 1. First update the plan document itself
    await planRepository.update(id, cleanFirestoreData(updateData));
    
    // 2. Fetch the updated plan to check if it's a student plan that needs syncing
    const updatedPlan = await planRepository.findById(id);
    
    if (updatedPlan && updatedPlan.type === 'student' && updatedPlan.studentId && data.lessons) {
       // If lessons changed for a student plan, re-sync with classes
       // This ensures reordering or content changes are reflected in the classes
       await connectPlanToClasses(id, updatedPlan.studentId);
    }
    
    revalidatePath("/hub/material-manager/plans");
    if (updatedPlan?.studentId) revalidatePath(`/hub/manager/users/${updatedPlan.studentId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating plan:", error);
    return { success: false, error: error.message };
  }
}

export async function archivePlan(planId: string, studentId: string) {
  try {
    await planRepository.update(planId, { status: "archived" });
    revalidatePath(`/hub/manager/users/${studentId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error archiving plan:", error);
    return { success: false, error: error.message };
  }
}
