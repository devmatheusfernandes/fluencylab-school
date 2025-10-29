// hooks/useStudentPanel.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types/users/users';
import { StudentClass, ClassStatus } from '@/types/classes/class';

// Define local types for notebook and task since we don't have them in the global types yet
interface Notebook {
  id: string;
  title: string;
  description: string;
  content: any;
  student: string;
  studentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Helper function to convert string dates to Date objects
const parseTaskDates = (task: any): Task => {
  return {
    ...task,
    createdAt: typeof task.createdAt === 'string' ? new Date(task.createdAt) : task.createdAt,
    updatedAt: task.updatedAt ? (typeof task.updatedAt === 'string' ? new Date(task.updatedAt) : task.updatedAt) : undefined,
    dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : undefined, // Add dueDate
  };
};

// Helper function to convert string dates to Date objects for classes
const parseClassDates = (cls: any): StudentClass => {
  return {
    ...cls,
    scheduledAt: typeof cls.scheduledAt === 'string' ? new Date(cls.scheduledAt) : cls.scheduledAt,
  };
};

export const useStudentPanel = (studentId: string) => {
  const [student, setStudent] = useState<Partial<User> | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   const fetchStudentInfo = useCallback(async () => {
    if (!studentId) return;
    
    try {
      // First, try to get student info from teacher endpoint
      const teacherResponse = await fetch(`/api/teacher/students/${studentId}/notebooks`);
      if (teacherResponse.ok) {
        const notebooksData = await teacherResponse.json();
        if (notebooksData.length > 0 && notebooksData[0].studentName) {
          setStudent({
            id: studentId,
            name: notebooksData[0].studentName,
            email: "Email não disponível",
          });
        } else {
          setStudent({
            id: studentId,
            name: "Aluno",
            email: "Email não disponível",
          });
        }
        // Return early since we successfully got the student info
        return;
      }
      
      // Only try admin endpoint if teacher endpoint failed
      // For students, this will fail with 403, but that's expected
      const response = await fetch(`/api/admin/users/${studentId}/details`);
      if (!response.ok) {
        return;
      }
      
      const studentData = await response.json();
      setStudent({
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        avatarUrl: studentData.avatarUrl,
        isActive: studentData.isActive,
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [studentId]);

  const fetchNotebooks = useCallback(async () => {
    if (!studentId) return;
    
    try {
      // For students, use their own endpoint
      if (typeof window !== 'undefined') {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.id === studentId && session?.user?.role === 'student') {
          // Student accessing their own data
          const response = await fetch(`/api/student/notebooks`);
          if (!response.ok) throw new Error('Failed to fetch notebooks');
          const data = await response.json();
          setNotebooks(data);
          return;
        }
      }
      
      // For teachers/admins accessing student data
      const response = await fetch(`/api/teacher/students/${studentId}/notebooks`);
      if (!response.ok) throw new Error('Failed to fetch notebooks');
      
      const data = await response.json();
      setNotebooks(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [studentId]);

  const fetchTasks = useCallback(async () => {
    if (!studentId) return;
    
    try {
      // For students, use their own endpoint
      if (typeof window !== 'undefined') {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.id === studentId && session?.user?.role === 'student') {
          // Student accessing their own data
          const response = await fetch(`/api/student/tasks`);
          if (!response.ok) throw new Error('Failed to fetch tasks');
          
          const data = await response.json();
          
          setTasks(data.map(parseTaskDates));
          return;
        }
      }
      
      // For teachers/admins accessing student data
      const response = await fetch(`/api/teacher/students/${studentId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.map(parseTaskDates));
    } catch (err: any) {
      setError(err.message);
    }
  }, [studentId]);

  const fetchClasses = useCallback(async (month: number, year: number) => {
    if (!studentId) return;
    
    try {
      // For students, use their own endpoint
      if (typeof window !== 'undefined') {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.id === studentId && session?.user?.role === 'student') {
          // Student accessing their own data
          const response = await fetch(`/api/student/classes/list`);
          if (!response.ok) throw new Error('Failed to fetch classes');
          
          const data = await response.json();
          setClasses(data.map(parseClassDates));
          return;
        }
      }
      
      // For teachers/admins accessing student data
      const response = await fetch(`/api/teacher/students/${studentId}/classes`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      setClasses(data.map(parseClassDates));
    } catch (err: any) {
      setError(err.message);
    }
  }, [studentId]);

  const addTask = useCallback(async (taskText: string, dueDate?: Date) => {
    if (!studentId || !taskText.trim()) return false;
    
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: taskText,
          completed: false,
          dueDate: dueDate ? dueDate.toISOString() : null, // Add dueDate
          createdAt: new Date(),
          isDeleted: false,
          updatedAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [studentId]);

  const createNotebook = useCallback(async (title: string) => {
    if (!studentId || !title.trim()) return false;
    
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/notebooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: '',
          content: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create notebook');
      }

      const newNotebook = await response.json();
      setNotebooks(prev => [newNotebook, ...prev]);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [studentId]);

    const updateClassStatus = useCallback(async (classId: string, newStatus: ClassStatus) => {
    try {
      // For students, use their own endpoint for canceling classes
      if (typeof window !== 'undefined') {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.id && session?.user?.role === 'student') {
          // Student canceling their own class
          if (newStatus === ClassStatus.CANCELED_STUDENT) {
            // Instead of directly calling the API, we'll return data for the UI to handle
            // the cancellation flow with rescheduling options
            return {
              requiresConfirmation: true,
              classId
            };
          } else {
            // Students can only cancel classes, not change to other statuses
            throw new Error('Students can only cancel their own classes');
          }
        }
      }
      
      // For teachers/admins, check if this is a special cancellation with makeup
      if (newStatus === ClassStatus.CANCELED_TEACHER_MAKEUP || newStatus === ClassStatus.CANCELED_TEACHER) {
        // Use the specific teacher cancel endpoint which handles makeup credits and emails
        const response = await fetch(`/api/teacher/cancel-class`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            classId, 
            reason: 'Cancelamento pelo professor', // Default reason
            allowMakeup: newStatus === ClassStatus.CANCELED_TEACHER_MAKEUP
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel class');
        }

        // Update the class status in the local state
        setClasses(prev => 
          prev.map(cls => 
            cls.id === classId ? { ...cls, status: newStatus } : cls
          )
        );
        
        return true;
      } else {
        // For other status updates, use the general endpoint
        const response = await fetch(`/api/classes/${classId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update class status');
        }

        // Update the class status in the local state
        setClasses(prev => 
          prev.map(cls => 
            cls.id === classId ? { ...cls, status: newStatus } : cls
          )
        );
        
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const updateClassFeedback = useCallback(async (classId: string, feedback: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update class feedback');
      }

      // Update the class feedback in the local state
      setClasses(prev => 
        prev.map(cls => 
          cls.id === classId ? { ...cls, feedback } : cls
        )
      );
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!studentId) return false;
    
    try {
      // For students, use their own endpoint
      if (typeof window !== 'undefined') {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.id === studentId && session?.user?.role === 'student') {
          // Student updating their own task
          const response = await fetch(`/api/student/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Failed to update task');
          }

          // Update the task in the local state
          setTasks(prev => 
            prev.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          );
          
          return true;
        }
      }
      
      // For teachers/admins accessing student data
      const response = await fetch(`/api/teacher/students/${studentId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Update the task in the local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [studentId]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!studentId) return false;
    
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Remove the task from the local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [studentId]);

  const deleteAllTasks = useCallback(async () => {
    if (!studentId) return false;
    
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/tasks`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete all tasks');
      }

      // Clear all tasks from the local state
      setTasks([]);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [studentId]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStudentInfo(),
          fetchNotebooks(),
          fetchTasks(),
          fetchClasses(new Date().getMonth(), new Date().getFullYear())
        ]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadData();
    }
  }, [studentId, fetchStudentInfo, fetchNotebooks, fetchTasks, fetchClasses]);

  return {
    // Data
    student,
    notebooks,
    tasks,
    classes,
    
    // Loading and error states
    loading,
    error,
    
    // Actions
    fetchStudentInfo,
    fetchNotebooks,
    fetchTasks,
    fetchClasses,
    addTask,
    createNotebook,
    updateClassStatus,
    updateClassFeedback,
    updateTask,
    deleteTask,
    deleteAllTasks,
    
    // Setters for local state management
    setNotebooks,
    setTasks,
    setClasses,
  };
};




























