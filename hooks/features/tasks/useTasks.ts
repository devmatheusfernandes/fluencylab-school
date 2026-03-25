import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Task } from "@/types/tasks/task";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskSubscription,
} from "@/actions/tasks";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];

        setTasks(items);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao buscar a lista de tarefas:", err);
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar tarefas"),
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskSubscription,
  };
}
