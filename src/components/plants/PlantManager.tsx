import { useMemo, useState } from 'react';
import plantTypes from '../../data/plants.json';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import type { Plant } from '../../types/domain';
import { createPlantSchema } from '../../utils/validation';

export default function PlantManager() {
  const { user } = useAuth();
  const { plants, addPlant, removePlant, editPlant, loading } = usePlants(user?.uid);
  const [plantTypeId, setPlantTypeId] = useState(plantTypes[0]?.id ?? '');
  const [nickname, setNickname] = useState('');
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editHealthStatus, setEditHealthStatus] = useState<Plant['healthStatus']>('Healthy');
  const [editPlantingDate, setEditPlantingDate] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const healthLabels = {
    Healthy: 'Saludable',
    'Needs attention': 'Necesita atencion',
    'At risk': 'En riesgo',
  } as const;

  const plantingDate = useMemo(() => new Date().toISOString(), []);

  const handleAdd = async () => {
    setAddError(null);
    const parsed = createPlantSchema.safeParse({
      plantTypeId,
      nickname,
      plantingDate,
    });

    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? 'No se pudo validar la planta.');
      return;
    }

    try {
      await addPlant(parsed.data);
      setNickname('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo anadir la planta.';
      setAddError(message);
    }
  };

  const startEdit = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setEditNickname(plant.nickname ?? '');
    setEditHealthStatus(plant.healthStatus ?? 'Healthy');
    setEditPlantingDate((plant.plantingDate ?? '').slice(0, 10));
  };

  const cancelEdit = () => {
    setEditingPlantId(null);
    setEditNickname('');
    setEditHealthStatus('Healthy');
    setEditPlantingDate('');
  };

  const saveEdit = async (plantId: string) => {
    const plantingIso = editPlantingDate ? new Date(`${editPlantingDate}T00:00:00`).toISOString() : undefined;
    await editPlant(plantId, {
      nickname: editNickname,
      healthStatus: editHealthStatus,
      plantingDate: plantingIso,
    });
    cancelEdit();
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

      {addError ? <p className="mt-2 text-sm text-rose-700">{addError}</p> : null}

      <ul className="mt-4 space-y-2">
        {plants.map((plant) => (
          <li key={plant.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            {editingPlantId === plant.id ? (
              <div className="w-full">
                <div className="grid gap-2 md:grid-cols-4">
                  <input
                    value={editNickname}
                    onChange={(event) => setEditNickname(event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="date"
                    value={editPlantingDate}
                    onChange={(event) => setEditPlantingDate(event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={editHealthStatus ?? 'Healthy'}
                    onChange={(event) => setEditHealthStatus(event.target.value as Plant['healthStatus'])}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="Healthy">Saludable</option>
                    <option value="Needs attention">Necesita atencion</option>
                    <option value="At risk">En riesgo</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveEdit(plant.id)}
                      className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded bg-slate-600 px-3 py-1 text-sm text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{plant.nickname || plant.plantTypeId}</p>
                  <p className="text-xs text-slate-500">Estado: {healthLabels[plant.healthStatus ?? 'Healthy']}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(plant)}
                    className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePlant(plant.id)}
                    className="rounded bg-rose-600 px-3 py-1 text-sm text-white"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
