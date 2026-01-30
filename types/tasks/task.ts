export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Relations
  creatorId: string;
  assignedToId?: string; // The staff member responsible
  subscriberIds: string[]; // Users who get notifications
  
  subTasks?: SubTask[];

  // Timestamps
  dueDate?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  
  // Metadata
  tags?: string[];
}
