import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { CarePlan } from '../../types/domain';

function demoPlansKey(userId: string): string {
  return `sg_demo_plans_${userId}`;
}

function readDemoPlans(userId: string): CarePlan[] {
  const raw = localStorage.getItem(demoPlansKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CarePlan[];
  } catch {
    return [];
  }
}

function writeDemoPlans(userId: string, plans: CarePlan[]) {
  localStorage.setItem(demoPlansKey(userId), JSON.stringify(plans));
}

export async function saveCarePlan(plan: CarePlan): Promise<void> {
  if (!db) {
    const plans = readDemoPlans(plan.userId);
    writeDemoPlans(plan.userId, [plan, ...plans]);
    return;
  }

  const ref = collection(db, 'users', plan.userId, 'carePlans');
  await addDoc(ref, plan);
}

export async function getLatestCarePlan(userId: string, plantId: string): Promise<CarePlan | null> {
  if (!db) {
    const match = readDemoPlans(userId).find((plan) => plan.plantId === plantId);
    return match ?? null;
  }

  const ref = collection(db, 'users', userId, 'carePlans');
  const snapshot = await getDocs(query(ref, orderBy('generatedAt', 'desc'), limit(10)));
  const match = snapshot.docs
    .map((item) => item.data() as CarePlan)
    .find((plan) => plan.plantId === plantId);

  return match ?? null;
}
