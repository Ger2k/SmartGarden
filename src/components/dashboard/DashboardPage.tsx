import { useEffect, useState } from 'react';
import type { CarePlan, Task } from '../../types/domain';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { useTasks } from '../../hooks/useTasks';
import { useWeather } from '../../hooks/useWeather';
import { useGeolocation } from '../../hooks/useGeolocation';
import { saveCarePlan } from '../../features/care-plan/carePlanService';
import { createTasks } from '../../features/tasks/taskService';
import AppShell from '../common/AppShell';
import DashboardOverview from './DashboardOverview';
import DailyTaskList from '../tasks/DailyTaskList';
import TaskHistoryList from '../tasks/TaskHistoryList';
import PlantManager from '../plants/PlantManager';
import WeatherCard from './WeatherCard';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const { plants } = usePlants(user?.uid);
  const { tasks, dailyTasks, complete, skip, refresh } = useTasks(user?.uid);
  const [latestPlan, setLatestPlan] = useState<CarePlan | undefined>(undefined);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const { lat, lon, error: geoError } = useGeolocation();
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(lat, lon);

  useEffect(() => {
    setLatestPlan(undefined);
  }, [user?.uid]);

  const handleGeneratePlan = async () => {
    const firstPlant = plants[0];
    if (!user || !firstPlant) return;
    setGeneratingPlan(true);
    const run = async () => {
      const response = await fetch('/api/care-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          plant: firstPlant,
          overdueCriticalTasks: 0,
          lat,
          lon,
        }),
      });

      if (!response.ok) return;
      const payload = (await response.json()) as { plan: CarePlan; tasks: Array<Omit<Task, 'id'>> };

      await saveCarePlan(payload.plan);
      await createTasks(payload.tasks);
      setLatestPlan(payload.plan);
      await refresh();
    };

    try {
      await run();
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return <p className="p-6">Cargando sesion...</p>;
  }

  if (!user) {
    return <p className="p-6">Inicia sesion en /login</p>;
  }

  return (
    <AppShell title="Panel Smart Garden">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleGeneratePlan()}
          disabled={generatingPlan || !plants.length}
          className="mr-2 rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {generatingPlan ? 'Generando...' : 'Generar plan de cuidado'}
        </button>
        <button type="button" onClick={() => void signOut()} className="rounded bg-slate-800 px-4 py-2 text-sm text-white">
          Cerrar sesion
        </button>
      </div>

      {geoError ? <p className="mb-4 text-sm text-amber-700">{geoError}</p> : null}

      <DashboardOverview plants={plants} dailyTasks={dailyTasks} latestPlan={latestPlan} />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <WeatherCard weather={weather} loading={weatherLoading} error={weatherError} />
        <PlantManager />
        <DailyTaskList tasks={dailyTasks} onComplete={complete} onSkip={skip} />
        <TaskHistoryList tasks={tasks} />
      </div>
    </AppShell>
  );
}
