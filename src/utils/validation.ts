import { z } from 'zod';

export const createPlantSchema = z.object({
  plantTypeId: z.string().min(1),
  perenualSpeciesId: z.number().int().positive().optional(),
  nickname: z.string().trim().max(60).optional().default(''),
  plantingDate: z.string().datetime(),
  wateringMode: z.enum(['auto', 'manual']).optional().default('auto'),
  wateringFrequencySpringDays: z.number().int().min(1).max(30).optional(),
  wateringFrequencySummerDays: z.number().int().min(1).max(30).optional(),
  wateringFrequencyAutumnDays: z.number().int().min(1).max(30).optional(),
  wateringFrequencyWinterDays: z.number().int().min(1).max(30).optional(),
  rainAlertLevel: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;

export const taskTypeSchema = z.enum(['watering', 'harvest', 'monitoring']);
export const taskStatusSchema = z.enum(['pending', 'completed', 'skipped']);

export const createTaskSchema = z
  .object({
    userId: z.string().min(1),
    plantId: z.string().min(1),
    carePlanId: z.string().min(1),
    type: taskTypeSchema,
    dueDate: z.string().datetime(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    weatherGuidance: z.enum(['none', 'suggest_postpone', 'skip_recommended']).optional(),
    weatherReason: z.string().trim().max(180).optional(),
    status: taskStatusSchema,
    completedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'completed' && !value.completedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['completedAt'],
        message: 'completedAt es obligatorio cuando status es completed',
      });
    }

    if (value.status !== 'completed' && value.completedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['completedAt'],
        message: 'completedAt solo se permite cuando status es completed',
      });
    }
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updatePlantSchema = z
  .object({
    nickname: z.string().trim().max(60).optional(),
    perenualSpeciesId: z.number().int().positive().optional(),
    plantingDate: z.string().datetime().optional(),
    wateringMode: z.enum(['auto', 'manual']).optional(),
    wateringFrequencySpringDays: z.number().int().min(1).max(30).optional(),
    wateringFrequencySummerDays: z.number().int().min(1).max(30).optional(),
    wateringFrequencyAutumnDays: z.number().int().min(1).max(30).optional(),
    wateringFrequencyWinterDays: z.number().int().min(1).max(30).optional(),
    rainAlertLevel: z.enum(['low', 'medium', 'high']).optional(),
    healthStatus: z.enum(['Healthy', 'Needs attention', 'At risk']).optional(),
    healthScore: z.number().min(0).max(100).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Se requiere al menos un campo para actualizar la planta',
  });

export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
