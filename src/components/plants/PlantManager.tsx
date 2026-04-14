import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import type { Plant } from '../../types/domain';
import { createPlantSchema } from '../../utils/validation';

type PlantOption = {
  id: string;
  name: string;
};

export default function PlantManager() {
  const { user } = useAuth();
  const { plants, addPlant, removePlant, editPlant, loading } = usePlants(user?.uid);
  const [plantTypeId, setPlantTypeId] = useState('');
  const [plantSearch, setPlantSearch] = useState('');
  const [plantOptions, setPlantOptions] = useState<PlantOption[]>([]);
  const [plantSource, setPlantSource] = useState<'perenual' | 'local' | 'local-fallback'>('local');
  const [nickname, setNickname] = useState('');
  const [newPlantingDate, setNewPlantingDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [newWateringMode, setNewWateringMode] = useState<Plant['wateringMode']>('auto');
  const [newSpringDays, setNewSpringDays] = useState('');
  const [newSummerDays, setNewSummerDays] = useState('');
  const [newAutumnDays, setNewAutumnDays] = useState('');
  const [newWinterDays, setNewWinterDays] = useState('');
  const [newRainAlertLevel, setNewRainAlertLevel] = useState<Plant['rainAlertLevel']>('medium');
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editHealthStatus, setEditHealthStatus] = useState<Plant['healthStatus']>('Healthy');
  const [editPlantingDate, setEditPlantingDate] = useState('');
  const [editWateringMode, setEditWateringMode] = useState<Plant['wateringMode']>('auto');
  const [editSpringDays, setEditSpringDays] = useState('');
  const [editSummerDays, setEditSummerDays] = useState('');
  const [editAutumnDays, setEditAutumnDays] = useState('');
  const [editWinterDays, setEditWinterDays] = useState('');
  const [editRainAlertLevel, setEditRainAlertLevel] = useState<Plant['rainAlertLevel']>('medium');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const healthLabels = {
    Healthy: 'Saludable',
    'Needs attention': 'Necesita atencion',
    'At risk': 'En riesgo',
  } as const;

  const handleAdd = async () => {
    setAddError(null);
    setAddSuccess(null);
    const plantingDate = new Date(`${newPlantingDate}T00:00:00`).toISOString();
    const parsed = createPlantSchema.safeParse({
      plantTypeId,
      nickname,
      plantingDate,
      wateringMode: newWateringMode,
      wateringFrequencySpringDays: newSpringDays ? Number(newSpringDays) : undefined,
      wateringFrequencySummerDays: newSummerDays ? Number(newSummerDays) : undefined,
      wateringFrequencyAutumnDays: newAutumnDays ? Number(newAutumnDays) : undefined,
      wateringFrequencyWinterDays: newWinterDays ? Number(newWinterDays) : undefined,
      rainAlertLevel: newRainAlertLevel,
    });

    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? 'No se pudo validar la planta.');
      return;
    }

    try {
      await addPlant(parsed.data);
      setPlantTypeId('');
      setPlantSearch('');
      setNickname('');
      setNewWateringMode('auto');
      setNewSpringDays('');
      setNewSummerDays('');
      setNewAutumnDays('');
      setNewWinterDays('');
      setNewRainAlertLevel('medium');
      setAddSuccess('Planta anadida correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo anadir la planta.';
      setAddError(message);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const run = async () => {
        try {
          const response = await fetch(`/api/plants/search?q=${encodeURIComponent(plantSearch)}`, {
            signal: controller.signal,
          });
          if (!response.ok) return;
          const payload = (await response.json()) as { options?: PlantOption[]; source?: 'perenual' | 'local' | 'local-fallback' };
          setPlantOptions(payload.options ?? []);
          setPlantSource(payload.source ?? 'local');
          if (!plantTypeId && (payload.options?.length ?? 0) > 0) {
            setPlantTypeId(payload.options?.[0]?.id ?? '');
          }
        } catch {
          // No-op: fallback visual se resuelve con opciones previas.
        }
      };

      void run();
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [plantSearch, plantTypeId]);

  const startEdit = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setEditNickname(plant.nickname ?? '');
    setEditHealthStatus(plant.healthStatus ?? 'Healthy');
    setEditPlantingDate((plant.plantingDate ?? '').slice(0, 10));
    setEditWateringMode(plant.wateringMode ?? 'auto');
    setEditSpringDays(plant.wateringFrequencySpringDays ? String(plant.wateringFrequencySpringDays) : '');
    setEditSummerDays(plant.wateringFrequencySummerDays ? String(plant.wateringFrequencySummerDays) : '');
    setEditAutumnDays(plant.wateringFrequencyAutumnDays ? String(plant.wateringFrequencyAutumnDays) : '');
    setEditWinterDays(plant.wateringFrequencyWinterDays ? String(plant.wateringFrequencyWinterDays) : '');
    setEditRainAlertLevel(plant.rainAlertLevel ?? 'medium');
  };

  const cancelEdit = () => {
    setEditingPlantId(null);
    setEditNickname('');
    setEditHealthStatus('Healthy');
    setEditPlantingDate('');
    setEditWateringMode('auto');
    setEditSpringDays('');
    setEditSummerDays('');
    setEditAutumnDays('');
    setEditWinterDays('');
    setEditRainAlertLevel('medium');
  };

  const saveEdit = async (plantId: string) => {
    const plantingIso = editPlantingDate ? new Date(`${editPlantingDate}T00:00:00`).toISOString() : undefined;
    await editPlant(plantId, {
      nickname: editNickname,
      healthStatus: editHealthStatus,
      plantingDate: plantingIso,
      wateringMode: editWateringMode,
      wateringFrequencySpringDays: editSpringDays ? Number(editSpringDays) : undefined,
      wateringFrequencySummerDays: editSummerDays ? Number(editSummerDays) : undefined,
      wateringFrequencyAutumnDays: editAutumnDays ? Number(editAutumnDays) : undefined,
      wateringFrequencyWinterDays: editWinterDays ? Number(editWinterDays) : undefined,
      rainAlertLevel: editRainAlertLevel,
    });
    cancelEdit();
  };

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Mis plantas</h3>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <input
          list="plant-options"
          value={plantSearch}
          onChange={(event) => {
            setPlantSearch(event.target.value);
            setPlantTypeId(event.target.value);
          }}
          placeholder="Buscar planta real (ej. Lavanda)"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <datalist id="plant-options">
          {plantOptions.map((option) => (
            <option key={option.id} value={option.name} />
          ))}
        </datalist>

        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Apodo"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />

        <input
          type="date"
          value={newPlantingDate}
          onChange={(event) => setNewPlantingDate(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={loading || !plantTypeId.trim()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-white"
        >
          Anadir planta
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Fuente de catalogo: {plantSource === 'perenual' ? 'Perenual' : 'Catalogo local'}
      </p>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <select
          value={newWateringMode ?? 'auto'}
          onChange={(event) => setNewWateringMode(event.target.value as Plant['wateringMode'])}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="auto">Riego automatico recomendado</option>
          <option value="manual">Riego manual por temporada</option>
        </select>

        <select
          value={newRainAlertLevel ?? 'medium'}
          onChange={(event) => setNewRainAlertLevel(event.target.value as Plant['rainAlertLevel'])}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="low">Lluvia: baja sensibilidad</option>
          <option value="medium">Lluvia: sensibilidad media</option>
          <option value="high">Lluvia: alta sensibilidad</option>
        </select>

        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Consejo: en modo manual define cada cuantos dias regar segun temporada.
        </p>
      </div>

      {newWateringMode === 'manual' ? (
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input
            type="number"
            min={1}
            max={30}
            placeholder="Primavera (dias)"
            value={newSpringDays}
            onChange={(event) => setNewSpringDays(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            max={30}
            placeholder="Verano (dias)"
            value={newSummerDays}
            onChange={(event) => setNewSummerDays(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            max={30}
            placeholder="Otono (dias)"
            value={newAutumnDays}
            onChange={(event) => setNewAutumnDays(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            max={30}
            placeholder="Invierno (dias)"
            value={newWinterDays}
            onChange={(event) => setNewWinterDays(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      ) : null}

      {addError ? <p className="mt-2 text-sm text-rose-700">{addError}</p> : null}
      {addSuccess ? <p className="mt-2 text-sm text-emerald-700">{addSuccess}</p> : null}

      <ul className="mt-4 space-y-2">
        {plants.map((plant) => (
          <li key={plant.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            {editingPlantId === plant.id ? (
              <div className="w-full">
                <div className="grid gap-2 md:grid-cols-3">
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
                  <select
                    value={editWateringMode ?? 'auto'}
                    onChange={(event) => setEditWateringMode(event.target.value as Plant['wateringMode'])}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="auto">Riego automatico</option>
                    <option value="manual">Riego manual por temporada</option>
                  </select>
                  <select
                    value={editRainAlertLevel ?? 'medium'}
                    onChange={(event) => setEditRainAlertLevel(event.target.value as Plant['rainAlertLevel'])}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="low">Lluvia: baja sensibilidad</option>
                    <option value="medium">Lluvia: sensibilidad media</option>
                    <option value="high">Lluvia: alta sensibilidad</option>
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
                {editWateringMode === 'manual' ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-4">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Primavera (dias)"
                      value={editSpringDays}
                      onChange={(event) => setEditSpringDays(event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Verano (dias)"
                      value={editSummerDays}
                      onChange={(event) => setEditSummerDays(event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Otono (dias)"
                      value={editAutumnDays}
                      onChange={(event) => setEditAutumnDays(event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Invierno (dias)"
                      value={editWinterDays}
                      onChange={(event) => setEditWinterDays(event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">{plant.nickname || plant.plantTypeId}</p>
                  <p className="text-xs text-slate-500">Estado: {healthLabels[plant.healthStatus ?? 'Healthy']}</p>
                  <p className="text-xs text-slate-500">Plantada: {dayjs(plant.plantingDate).format('DD/MM/YYYY')}</p>
                  <p className="text-xs text-slate-500">Riego: {plant.wateringMode === 'manual' ? 'Manual por temporada' : 'Automatico'}</p>
                  <p className="text-xs text-slate-500">Lluvia: {plant.rainAlertLevel ?? 'medium'}</p>
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
