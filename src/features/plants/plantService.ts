import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { createPlantSchema, type CreatePlantInput, updatePlantSchema } from '../../utils/validation';
import type { Plant } from '../../types/domain';
import { db } from '../../services/firebase';

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

export async function listPlants(userId: string): Promise<Plant[]> {
  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', userId, 'plants');
  const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')));

  return snapshot.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    return {
      id: item.id,
      userId: String(data.userId ?? userId),
      plantTypeId: String(data.plantTypeId ?? ''),
      nickname: typeof data.nickname === 'string' ? data.nickname : undefined,
      plantingDate: toIso(data.plantingDate),
      healthStatus: data.healthStatus as Plant['healthStatus'],
      healthScore: typeof data.healthScore === 'number' ? data.healthScore : undefined,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  });
}

export async function createPlant(userId: string, input: CreatePlantInput): Promise<void> {
  const parsed = createPlantSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Plant payload invalido: ${parsed.error.issues[0]?.message ?? 'error de validacion'}`);
  }

  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', userId, 'plants');
  const plantingDate = Timestamp.fromDate(new Date(parsed.data.plantingDate));
  await addDoc(ref, {
    userId,
    plantTypeId: parsed.data.plantTypeId,
    nickname: parsed.data.nickname || '',
    plantingDate,
    healthStatus: 'Healthy',
    healthScore: 85,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlant(userId: string, plantId: string, patch: Partial<Plant>): Promise<void> {
  const parsed = updatePlantSchema.safeParse(patch);
  if (!parsed.success) {
    throw new Error(`Plant patch invalido: ${parsed.error.issues[0]?.message ?? 'error de validacion'}`);
  }

  const firestore = getDbOrThrow();
  const ref = doc(firestore, 'users', userId, 'plants', plantId);
  const patchForDb: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.plantingDate) {
    patchForDb.plantingDate = Timestamp.fromDate(new Date(parsed.data.plantingDate));
  }

  await updateDoc(ref, {
    ...patchForDb,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlant(userId: string, plantId: string): Promise<void> {
  const firestore = getDbOrThrow();
  const ref = doc(firestore, 'users', userId, 'plants', plantId);
  await deleteDoc(ref);
}
