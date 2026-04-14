import { z } from 'zod';

export const createPlantSchema = z.object({
  plantTypeId: z.string().min(1),
  nickname: z.string().trim().max(60).optional().default(''),
  plantingDate: z.string().datetime(),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
