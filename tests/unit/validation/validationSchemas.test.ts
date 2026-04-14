import { describe, expect, it } from 'vitest';
import { createPlantSchema, createTaskSchema, updatePlantSchema } from '../../../src/utils/validation';

const now = new Date().toISOString();

describe('validation schemas', () => {
  it('rejects task with completed status and no completedAt', () => {
    const result = createTaskSchema.safeParse({
      userId: 'u1',
      plantId: 'p1',
      carePlanId: 'cp1',
      type: 'watering',
      dueDate: now,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    });

    expect(result.success).toBe(false);
  });

  it('rejects task with completedAt when status is not completed', () => {
    const result = createTaskSchema.safeParse({
      userId: 'u1',
      plantId: 'p1',
      carePlanId: 'cp1',
      type: 'watering',
      dueDate: now,
      status: 'pending',
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(result.success).toBe(false);
  });

  it('rejects updatePlant payload with forbidden keys', () => {
    const result = updatePlantSchema.safeParse({
      userId: 'u1',
      healthScore: 70,
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid updatePlant payload', () => {
    const result = updatePlantSchema.safeParse({
      healthStatus: 'Needs attention',
      healthScore: 62,
    });

    expect(result.success).toBe(true);
  });

  it('accepts seasonal manual watering configuration', () => {
    const result = updatePlantSchema.safeParse({
      wateringMode: 'manual',
      wateringFrequencySpringDays: 4,
      wateringFrequencySummerDays: 2,
      rainAlertLevel: 'high',
    });

    expect(result.success).toBe(true);
  });

  it('accepts plant payload with perenualSpeciesId', () => {
    const result = createPlantSchema.safeParse({
      plantTypeId: 'Lavanda',
      perenualSpeciesId: 155,
      plantingDate: now,
    });

    expect(result.success).toBe(true);
  });
});
