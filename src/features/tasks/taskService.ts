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

function getDbOrThrow() {
  if (!db) {
    throw new Error('Firestore no esta configurado. Revisa variables de entorno de Firebase.');
  }
  return db;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function listTasks(userId: string): Promise<Task[]> {
  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', userId, 'tasks');
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

  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', parsed.data.userId, 'tasks');
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
  const firestore = getDbOrThrow();
  const ref = doc(firestore, 'users', userId, 'tasks', taskId);
  await updateDoc(ref, {
    status: 'completed',
    completedAt: Timestamp.now(),
    updatedAt: serverTimestamp(),
  });
}

export async function skipTask(userId: string, taskId: string): Promise<void> {
  const firestore = getDbOrThrow();
  const ref = doc(firestore, 'users', userId, 'tasks', taskId);
  await updateDoc(ref, {
    status: 'skipped',
    updatedAt: serverTimestamp(),
  });
}
