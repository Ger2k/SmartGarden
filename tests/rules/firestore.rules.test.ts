import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'smart-garden-rules';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const [FIRESTORE_HOST, FIRESTORE_PORT_RAW] = emulatorHost.split(':');
const FIRESTORE_PORT = Number(FIRESTORE_PORT_RAW || 8080);

function validPlantPayload(userId: string) {
  const now = new Date();
  return {
    userId,
    plantTypeId: 'tomato',
    nickname: 'Tomate patio',
    plantingDate: now,
    healthStatus: 'Healthy',
    healthScore: 85,
    createdAt: now,
    updatedAt: now,
  };
}

function validTaskPayload(userId: string) {
  const now = new Date();
  return {
    userId,
    plantId: 'plant_1',
    carePlanId: 'plan_1',
    type: 'watering',
    dueDate: now,
    status: 'pending',
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('firestore security rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: FIRESTORE_HOST,
        port: FIRESTORE_PORT,
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows user to create and read own plant', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const plantRef = doc(userA, 'users/userA/plants/plant_1');

    await assertSucceeds(setDoc(plantRef, validPlantPayload('userA')));
    await assertSucceeds(getDoc(plantRef));
  });

  it('denies user writing plant into another user namespace', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const foreignPlantRef = doc(userA, 'users/userB/plants/plant_2');

    await assertFails(setDoc(foreignPlantRef, validPlantPayload('userB')));
  });

  it('denies malformed completed task without completedAt timestamp', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const taskRef = doc(userA, 'users/userA/tasks/task_1');

    await assertFails(
      setDoc(taskRef, {
        ...validTaskPayload('userA'),
        status: 'completed',
        completedAt: null,
      })
    );
  });

  it('denies unauthenticated read to protected user data', async () => {
    const adminDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(adminDb, 'users/userA/plants/plant_1');

    await assertFails(getDoc(docRef));
  });
});
