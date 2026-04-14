import dayjs from 'dayjs';
import type { CarePlan, Plant, Task } from '../../types/domain';

type PlantAnalyticsProps = {
  plants: Plant[];
  tasks: Task[];
  carePlans: CarePlan[];
};

type Trend = 'up' | 'down' | 'flat' | 'none';

type PlantMetric = {
  plantId: string;
  name: string;
  latestHealthScore: number | null;
  trend: Trend;
  completionRate: number;
  overduePending: number;
  totalTasks: number;
};

function trendLabel(trend: Trend): string {
  if (trend === 'up') return 'Mejorando';
  if (trend === 'down') return 'Empeorando';
  if (trend === 'flat') return 'Estable';
  return 'Sin datos';
}

function trendColor(trend: Trend): string {
  if (trend === 'up') return 'text-emerald-700';
  if (trend === 'down') return 'text-rose-700';
  if (trend === 'flat') return 'text-sky-700';
  return 'text-slate-500';
}

function buildMetrics(plants: Plant[], tasks: Task[], carePlans: CarePlan[]): PlantMetric[] {
  const today = dayjs().startOf('day');

  return plants.map((plant) => {
    const plantTasks = tasks.filter((task) => task.plantId === plant.id);
    const plans = carePlans
      .filter((plan) => plan.plantId === plant.id)
      .sort((a, b) => (a.generatedAt > b.generatedAt ? 1 : -1));

    const totalTasks = plantTasks.length;
    const completedTasks = plantTasks.filter((task) => task.status === 'completed').length;
    const pendingTasks = plantTasks.filter((task) => task.status === 'pending');
    const overduePending = pendingTasks.filter((task) => dayjs(task.dueDate).isBefore(today, 'day')).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const latest = plans[plans.length - 1];
    const previous = plans.length > 1 ? plans[plans.length - 2] : undefined;
    const latestHealthScore = latest?.healthScore ?? plant.healthScore ?? null;

    let trend: Trend = 'none';
    if (latest && previous) {
      const delta = latest.healthScore - previous.healthScore;
      if (delta >= 5) trend = 'up';
      else if (delta <= -5) trend = 'down';
      else trend = 'flat';
    }

    return {
      plantId: plant.id,
      name: plant.nickname || plant.plantTypeId,
      latestHealthScore,
      trend,
      completionRate,
      overduePending,
      totalTasks,
    };
  });
}

export default function PlantAnalytics({ plants, tasks, carePlans }: PlantAnalyticsProps) {
  const metrics = buildMetrics(plants, tasks, carePlans);

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analitica por planta</h3>
        <p className="text-xs text-slate-500">Tendencia de salud y cumplimiento</p>
      </div>

      {!metrics.length ? (
        <p className="text-sm text-slate-600">Aun no hay plantas para analizar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Planta</th>
                <th className="px-2 py-2 font-medium">Salud</th>
                <th className="px-2 py-2 font-medium">Tendencia</th>
                <th className="px-2 py-2 font-medium">Cumplimiento</th>
                <th className="px-2 py-2 font-medium">Atrasadas</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((item) => (
                <tr key={item.plantId} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-900">{item.name}</td>
                  <td className="px-2 py-2">
                    {item.latestHealthScore !== null ? `${item.latestHealthScore}/100` : 'Sin score'}
                  </td>
                  <td className={`px-2 py-2 font-medium ${trendColor(item.trend)}`}>{trendLabel(item.trend)}</td>
                  <td className="px-2 py-2">{item.totalTasks ? `${item.completionRate}%` : 'Sin tareas'}</td>
                  <td className="px-2 py-2">{item.overduePending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
