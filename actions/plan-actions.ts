'use server';

import { planRepository, classRepository } from "@/repositories";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { Plan } from "@/types/plan";

export async function connectPlanToClasses(planId: string, studentId: string) {
  try {
    // 1. Fetch Plan and Student Classes
    const plan = await planRepository.findById(planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.studentId !== studentId) throw new Error("Plan does not belong to this student");

    // Fetch ONLY future scheduled classes
    const futureClasses = await classRepository.findClassesByStudentId(studentId);
    
    // Filter only truly available classes (not cancelled, rescheduled, etc - handled by repository mostly)
    // But let's be safe and ensure they are sorted by date (repo does this)
    
    // 2. Prepare Updates
    const batch = adminDb.batch();
    const planRef = adminDb.collection("plans").doc(planId);
    
    const updatedLessons = [...plan.lessons];
    let classIndex = 0;

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

        classIndex++;
      } else {
        // No more classes available
        // Should we clear previous schedules if they don't exist anymore?
        // For now, let's keep it additive.
      }
    }

    // 3. Update Plan with new lesson schedule
    batch.update(planRef, {
      lessons: updatedLessons,
      updatedAt: Timestamp.now()
    });

    await batch.commit();
    
    revalidatePath(`/hub/manager/users/${studentId}`);
    return { success: true, message: "Plan connected to scheduled classes successfully" };

  } catch (error: any) {
    console.error("Error connecting plan:", error);
    return { success: false, error: error.message };
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
    await connectPlanToClasses(newPlanId, studentId);

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
      lessons: data.lessons?.map(l => ({
        ...l,
        learningItemsIds: l.learningItemsIds || [],
        learningStructureIds: l.learningStructureIds || [],
      })) || []
    };

    const id = await planRepository.create(planData as any); // Type casting due to some missing props being optional in interface but required in creation logic
    
    // If it's a student plan, connect to classes immediately
    if (data.type === 'student' && data.studentId) {
       await connectPlanToClasses(id, data.studentId);
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
    // 1. First update the plan document itself
    await planRepository.update(id, data);
    
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
