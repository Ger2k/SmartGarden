import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { completeTask, listTasks, skipTask } from '../features/tasks/taskService';
import type { Task } from '../types/domain';

export function useTasks(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setTasks(await listTasks(userId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [userId]);

  const complete = async (taskId: string) => {
    if (!userId) return;
    await completeTask(userId, taskId);
    await refresh();
  };

  const skip = async (taskId: string) => {
    if (!userId) return;
    await skipTask(userId, taskId);
    await refresh();
  };

  const dailyTasks = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return tasks.filter((task) => dayjs(task.dueDate).format('YYYY-MM-DD') === today);
  }, [tasks]);

  return { tasks, dailyTasks, loading, refresh, complete, skip };
}
