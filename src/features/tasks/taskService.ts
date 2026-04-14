import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Task } from '../../types/domain';
import { createTaskSchema } from '../../utils/validation';

function demoTasksKey(userId: string): string {
  return `sg_demo_tasks_${userId}`;
}

function readDemoTasks(userId: string): Task[] {
  const raw = localStorage.getItem(demoTasksKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function writeDemoTasks(userId: string, tasks: Task[]) {
  localStorage.setItem(demoTasksKey(userId), JSON.stringify(tasks));
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function listTasks(userId: string): Promise<Task[]> {
  if (!db) {
    return readDemoTasks(userId).sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
  }

  const ref = collection(db, 'users', userId, 'tasks');
  const snapshot = await getDocs(query(ref, orderBy('dueDate', 'asc')));

  return snapshot.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      userId: String(data.userId ?? userId),
      plantId: String(data.plantId ?? ''),
      carePlanId: String(data.carePlanId ?? ''),
      type: data.type as Task['type'],
      dueDate: toIso(data.dueDate),
      status: data.status as Task['status'],
      completedAt: data.completedAt ? toIso(data.completedAt) : undefined,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  });
}

export async function createTask(task: Omit<Task, 'id'>): Promise<void> {
  const parsed = createTaskSchema.safeParse(task);
  if (!parsed.success) {
    throw new Error(`Task payload invalido: ${parsed.error.issues[0]?.message ?? 'error de validacion'}`);
  }

  if (!db) {
    const tasks = readDemoTasks(parsed.data.userId);
    const next: Task = { ...parsed.data, id: makeId('task') };
    writeDemoTasks(parsed.data.userId, [...tasks, next]);
    return;
  }

  const ref = collection(db, 'users', parsed.data.userId, 'tasks');
  const dueDate = Timestamp.fromDate(new Date(parsed.data.dueDate));
  await addDoc(ref, {
    ...parsed.data,
    dueDate,
    completedAt: parsed.data.completedAt ? Timestamp.fromDate(new Date(parsed.data.completedAt)) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createTasks(tasks: Array<Omit<Task, 'id'>>): Promise<void> {
  await Promise.all(tasks.map((task) => createTask(task)));
}

export async function completeTask(userId: string, taskId: string): Promise<void> {
  if (!db) {
    const tasks = readDemoTasks(userId).map((task) =>
      task.id === taskId
        ? { ...task, status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : task
    );
    writeDemoTasks(userId, tasks);
    return;
  }

  const ref = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(ref, {
    status: 'completed',
    completedAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  });
}

export async function skipTask(userId: string, taskId: string): Promise<void> {
  if (!db) {
    const tasks = readDemoTasks(userId).map((task) =>
      task.id === taskId ? { ...task, status: 'skipped', updatedAt: new Date().toISOString() } : task
    );
    writeDemoTasks(userId, tasks);
    return;
  }

  const ref = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(ref, {
    status: 'skipped',
    updatedAt: serverTimestamp(),
  });
}
