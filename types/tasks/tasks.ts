// types/tasks/tasks.ts

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
  dueDate?: Date; // Add dueDate field for Google Calendar integration
}
