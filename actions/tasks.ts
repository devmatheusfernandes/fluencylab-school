'use server'

import { adminDb } from '@/lib/firebase/admin';
import { Task } from '@/types/tasks/task';
import { announcementService } from '@/services/announcementService';
import { revalidatePath } from 'next/cache';
import { UserAdminRepository } from '@/repositories/user.admin.repository';

const userRepo = new UserAdminRepository();

export async function getStaffUsers() {
    try {
        const [admins, managers, matManagers] = await Promise.all([
            userRepo.findUsersByRole('admin'),
            userRepo.findUsersByRole('manager'),
            userRepo.findUsersByRole('material_manager')
        ]);
        
        const all = [...admins, ...managers, ...matManagers];
        // Deduplicate by ID
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        
        return unique.map(u => ({
            id: u.id,
            name: u.name || u.email,
            email: u.email,
            avatarUrl: u.avatarUrl,
            role: u.role
        }));
    } catch (error) {
        console.error('Error fetching staff users:', error);
        return [];
    }
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const ref = adminDb.collection('tasks').doc();
    const task: Task = {
      ...data,
      id: ref.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ref.set(task);

    if (task.assignedToId) {
      // Don't await push to not block UI if it fails or is slow
      announcementService.createSystemAnnouncement(
        'Nova Tarefa Atribuída',
        `Você foi designado para: ${task.title}`,
        task.assignedToId,
        `/hub/admin/tasks?id=${task.id}`
      ).catch(console.error);
    }

    revalidatePath('/hub'); 
    return { success: true, data: task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  try {
    const ref = adminDb.collection('tasks').doc(taskId);
    const snap = await ref.get();
    
    if (!snap.exists) throw new Error('Task not found');
    
    const currentTask = snap.data() as Task;
    const updatedTask = { ...currentTask, ...data, updatedAt: new Date().toISOString() };
    
    await ref.update(updatedTask);

    // Notifications logic
    if (data.assignedToId && data.assignedToId !== currentTask.assignedToId) {
       announcementService.createSystemAnnouncement(
         'Nova Tarefa Atribuída',
         `Você foi designado para: ${updatedTask.title}`,
         data.assignedToId,
         `/hub/admin/tasks?id=${updatedTask.id}`
       ).catch(console.error);
    }
    
    // Notify subscribers of important changes
    if (data.status && data.status !== currentTask.status) {
        const recipients = updatedTask.subscriberIds || [];
        if (recipients.length > 0) {
            announcementService.createSystemAnnouncement(
              'Atualização de Tarefa',
              `${updatedTask.title}: Status alterado para ${data.status}`,
              recipients,
              `/hub/admin/tasks?id=${updatedTask.id}`
            ).catch(console.error);
        }
    }

    revalidatePath('/hub');
    return { success: true, data: updatedTask };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await adminDb.collection('tasks').doc(taskId).delete();
    revalidatePath('/hub');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function toggleTaskSubscription(taskId: string, userId: string) {
    try {
        const ref = adminDb.collection('tasks').doc(taskId);
        const snap = await ref.get();
        if (!snap.exists) throw new Error('Task not found');
        const task = snap.data() as Task;
        
        const subscribers = new Set(task.subscriberIds || []);
        if (subscribers.has(userId)) {
            subscribers.delete(userId);
        } else {
            subscribers.add(userId);
        }
        
        await ref.update({ subscriberIds: Array.from(subscribers) });
        revalidatePath('/hub');
        return { success: true, subscribed: subscribers.has(userId) };
    } catch (error) {
        console.error('Error toggling subscription:', error);
        return { success: false, error: 'Failed to toggle subscription' };
    }
}
