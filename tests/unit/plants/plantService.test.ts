import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => {
  const deleteFn = vi.fn();
  const commitFn = vi.fn().mockResolvedValue(undefined);
  const batch = { delete: deleteFn, commit: commitFn };
  const docFn = vi.fn((...segments: unknown[]) => ({ kind: 'doc', segments }));
  const collectionFn = vi.fn((...segments: unknown[]) => ({ kind: 'collection', segments }));
  const whereFn = vi.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
  const queryFn = vi.fn((target: unknown, filter: unknown) => ({ target, filter }));
  const getDocsFn = vi.fn();
  const writeBatchFn = vi.fn(() => batch);

  return {
    deleteFn,
    commitFn,
    docFn,
    collectionFn,
    whereFn,
    queryFn,
    getDocsFn,
    writeBatchFn,
  };
});

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: firestoreMocks.collectionFn,
  deleteDoc: vi.fn(),
  doc: firestoreMocks.docFn,
  getDocs: firestoreMocks.getDocsFn,
  orderBy: vi.fn(),
  query: firestoreMocks.queryFn,
  serverTimestamp: vi.fn(),
  Timestamp: class Timestamp {},
  updateDoc: vi.fn(),
  where: firestoreMocks.whereFn,
  writeBatch: firestoreMocks.writeBatchFn,
}));

vi.mock('../../../src/services/firebase', () => ({
  db: { app: 'test-db' },
}));

describe('plantService.deletePlant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes plant and cascades related tasks and care plans', async () => {
    firestoreMocks.getDocsFn
      .mockResolvedValueOnce({
        docs: [{ ref: { path: 'users/user_1/tasks/task_1' } }, { ref: { path: 'users/user_1/tasks/task_2' } }],
      })
      .mockResolvedValueOnce({
        docs: [{ ref: { path: 'users/user_1/carePlans/plan_1' } }],
      });

    const { deletePlant } = await import('../../../src/features/plants/plantService');

    await deletePlant('user_1', 'plant_123');

    expect(firestoreMocks.whereFn).toHaveBeenCalledWith('plantId', '==', 'plant_123');
    expect(firestoreMocks.getDocsFn).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.deleteFn).toHaveBeenCalledTimes(4);
    expect(firestoreMocks.commitFn).toHaveBeenCalledTimes(1);
  });
});
