import { useMemo, useState } from 'react';
import plantTypes from '../../data/plants.json';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { createPlantSchema } from '../../utils/validation';

export default function PlantManager() {
  const { user } = useAuth();
  const { plants, addPlant, removePlant, loading } = usePlants(user?.uid);
  const [plantTypeId, setPlantTypeId] = useState(plantTypes[0]?.id ?? '');
  const [nickname, setNickname] = useState('');
  const healthLabels = {
    Healthy: 'Saludable',
    'Needs attention': 'Necesita atencion',
    'At risk': 'En riesgo',
  } as const;

  const plantingDate = useMemo(() => new Date().toISOString(), []);

  const handleAdd = async () => {
    const parsed = createPlantSchema.safeParse({
      plantTypeId,
      nickname,
      plantingDate,
    });

    if (!parsed.success) return;
    await addPlant(parsed.data);
    setNickname('');
  };

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Mis plantas</h3>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <select
          value={plantTypeId}
          onChange={(event) => setPlantTypeId(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {plantTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>

        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Apodo"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-white"
        >
          Anadir planta
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {plants.map((plant) => (
          <li key={plant.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div>
              <p className="font-medium">{plant.nickname || plant.plantTypeId}</p>
              <p className="text-xs text-slate-500">Estado: {healthLabels[plant.healthStatus ?? 'Healthy']}</p>
            </div>
            <button
              type="button"
              onClick={() => void removePlant(plant.id)}
              className="rounded bg-rose-600 px-3 py-1 text-sm text-white"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
