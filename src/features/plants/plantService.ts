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
import type { CreatePlantInput } from '../../utils/validation';
import type { Plant } from '../../types/domain';
import { db } from '../../services/firebase';

function demoPlantsKey(userId: string): string {
  return `sg_demo_plants_${userId}`;
}

function readDemoPlants(userId: string): Plant[] {
  const raw = localStorage.getItem(demoPlantsKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Plant[];
  } catch {
    return [];
  }
}

function writeDemoPlants(userId: string, plants: Plant[]) {
  localStorage.setItem(demoPlantsKey(userId), JSON.stringify(plants));
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function listPlants(userId: string): Promise<Plant[]> {
  if (!db) {
    return readDemoPlants(userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const ref = collection(db, 'users', userId, 'plants');
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
  if (!db) {
    const now = new Date().toISOString();
    const plants = readDemoPlants(userId);
    const plant: Plant = {
      id: makeId('plant'),
      userId,
      plantTypeId: input.plantTypeId,
      nickname: input.nickname || '',
      plantingDate: input.plantingDate,
      healthStatus: 'Healthy',
      healthScore: 85,
      createdAt: now,
      updatedAt: now,
    };
    writeDemoPlants(userId, [plant, ...plants]);
    return;
  }

  const ref = collection(db, 'users', userId, 'plants');
  const plantingDate = Timestamp.fromDate(new Date(input.plantingDate));
  await addDoc(ref, {
    userId,
    plantTypeId: input.plantTypeId,
    nickname: input.nickname || '',
    plantingDate,
    healthStatus: 'Healthy',
    healthScore: 85,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlant(userId: string, plantId: string, patch: Partial<Plant>): Promise<void> {
  if (!db) {
    const plants = readDemoPlants(userId);
    const next = plants.map((plant) =>
      plant.id === plantId ? { ...plant, ...patch, updatedAt: new Date().toISOString() } : plant
    );
    writeDemoPlants(userId, next);
    return;
  }

  const ref = doc(db, 'users', userId, 'plants', plantId);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlant(userId: string, plantId: string): Promise<void> {
  if (!db) {
    const plants = readDemoPlants(userId).filter((plant) => plant.id !== plantId);
    writeDemoPlants(userId, plants);
    return;
  }

  const ref = doc(db, 'users', userId, 'plants', plantId);
  await deleteDoc(ref);
}
