import { useEffect, useState } from 'react';
import { createPlant, deletePlant, listPlants } from '../features/plants/plantService';
import type { Plant } from '../types/domain';
import type { CreatePlantInput } from '../utils/validation';

export function usePlants(userId?: string) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setPlants(await listPlants(userId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [userId]);

  const addPlant = async (input: CreatePlantInput) => {
    if (!userId) return;
    await createPlant(userId, input);
    await refresh();
  };

  const removePlant = async (plantId: string) => {
    if (!userId) return;
    await deletePlant(userId, plantId);
    await refresh();
  };

  return { plants, loading, refresh, addPlant, removePlant };
}
