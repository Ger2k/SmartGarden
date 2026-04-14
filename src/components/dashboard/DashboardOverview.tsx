import type { CarePlan, Plant, Task } from '../../types/domain';

type DashboardOverviewProps = {
  plants: Plant[];
  dailyTasks: Task[];
  latestPlan?: CarePlan;
};

export default function DashboardOverview({ plants, dailyTasks, latestPlan }: DashboardOverviewProps) {
  const healthLabels = {
    Healthy: 'Saludable',
    'Needs attention': 'Necesita atencion',
    'At risk': 'En riesgo',
  } as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-xl border border-emerald-200 bg-white p-4">
        <p className="text-sm text-slate-500">Plantas activas</p>
        <p className="mt-2 text-3xl font-semibold">{plants.length}</p>
      </article>

      <article className="rounded-xl border border-emerald-200 bg-white p-4">
        <p className="text-sm text-slate-500">Tareas de hoy</p>
        <p className="mt-2 text-3xl font-semibold">{dailyTasks.length}</p>
      </article>

      <article className="rounded-xl border border-emerald-200 bg-white p-4">
        <p className="text-sm text-slate-500">Salud de la planta</p>
        <p className="mt-2 text-xl font-semibold">
          {latestPlan ? healthLabels[latestPlan.healthStatus] : 'Aun no hay plan generado'}
        </p>
      </article>

      <article className="rounded-xl border border-emerald-200 bg-white p-4 md:col-span-3">
        <p className="text-sm text-slate-500">Recomendaciones contextuales</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {(latestPlan?.insights ?? []).map((insight) => (
            <li key={insight.code}>{insight.message}</li>
          ))}
          {!latestPlan?.insights?.length ? <li>Aun no hay recomendaciones. Genera un plan de cuidado primero.</li> : null}
        </ul>
      </article>
    </div>
  );
}
