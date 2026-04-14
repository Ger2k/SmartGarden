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
  where,
  writeBatch,
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
      perenualSpeciesId: typeof data.perenualSpeciesId === 'number' ? data.perenualSpeciesId : undefined,
      nickname: typeof data.nickname === 'string' ? data.nickname : undefined,
      plantingDate: toIso(data.plantingDate),
      wateringMode: data.wateringMode as Plant['wateringMode'],
      wateringFrequencySpringDays:
        typeof data.wateringFrequencySpringDays === 'number' ? data.wateringFrequencySpringDays : undefined,
      wateringFrequencySummerDays:
        typeof data.wateringFrequencySummerDays === 'number' ? data.wateringFrequencySummerDays : undefined,
      wateringFrequencyAutumnDays:
        typeof data.wateringFrequencyAutumnDays === 'number' ? data.wateringFrequencyAutumnDays : undefined,
      wateringFrequencyWinterDays:
        typeof data.wateringFrequencyWinterDays === 'number' ? data.wateringFrequencyWinterDays : undefined,
      rainAlertLevel: data.rainAlertLevel as Plant['rainAlertLevel'],
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
    perenualSpeciesId: parsed.data.perenualSpeciesId ?? null,
    nickname: parsed.data.nickname || '',
    plantingDate,
    wateringMode: parsed.data.wateringMode,
    wateringFrequencySpringDays: parsed.data.wateringFrequencySpringDays ?? null,
    wateringFrequencySummerDays: parsed.data.wateringFrequencySummerDays ?? null,
    wateringFrequencyAutumnDays: parsed.data.wateringFrequencyAutumnDays ?? null,
    wateringFrequencyWinterDays: parsed.data.wateringFrequencyWinterDays ?? null,
    rainAlertLevel: parsed.data.rainAlertLevel,
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
  const patchForDb: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      patchForDb[key] = value;
    }
  }
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
  const batch = writeBatch(firestore);

  const plantRef = doc(firestore, 'users', userId, 'plants', plantId);
  batch.delete(plantRef);

  const tasksRef = collection(firestore, 'users', userId, 'tasks');
  const tasksSnapshot = await getDocs(query(tasksRef, where('plantId', '==', plantId)));
  for (const taskDoc of tasksSnapshot.docs) {
    batch.delete(taskDoc.ref);
  }

  const plansRef = collection(firestore, 'users', userId, 'carePlans');
  const plansSnapshot = await getDocs(query(plansRef, where('plantId', '==', plantId)));
  for (const planDoc of plansSnapshot.docs) {
    batch.delete(planDoc.ref);
  }

  await batch.commit();
}
