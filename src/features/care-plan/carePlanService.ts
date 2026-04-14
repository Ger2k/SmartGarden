import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { CarePlan } from '../../types/domain';

function getDbOrThrow() {
  if (!db) {
    throw new Error('Firestore no esta configurado. Revisa variables de entorno de Firebase.');
  }
  return db;
}

export async function saveCarePlan(plan: CarePlan): Promise<void> {
  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', plan.userId, 'carePlans');
  await addDoc(ref, plan);
}

export async function getLatestCarePlan(userId: string, plantId: string): Promise<CarePlan | null> {
  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', userId, 'carePlans');
  const snapshot = await getDocs(query(ref, orderBy('generatedAt', 'desc'), limit(10)));
  const match = snapshot.docs
    .map((item) => item.data() as CarePlan)
    .find((plan) => plan.plantId === plantId);

  return match ?? null;
}

export async function listCarePlans(userId: string): Promise<CarePlan[]> {
  const firestore = getDbOrThrow();
  const ref = collection(firestore, 'users', userId, 'carePlans');
  const snapshot = await getDocs(query(ref, orderBy('generatedAt', 'desc'), limit(200)));
  return snapshot.docs.map((item) => item.data() as CarePlan);
}
