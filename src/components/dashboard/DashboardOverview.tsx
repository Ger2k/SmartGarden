import dayjs from 'dayjs';
import type { CarePlan, Plant, Task } from '../../types/domain';

type DashboardOverviewProps = {
  plants: Plant[];
  dailyTasks: Task[];
  tasks: Task[];
  latestPlan?: CarePlan;
};

export default function DashboardOverview({ plants, dailyTasks, tasks, latestPlan }: DashboardOverviewProps) {
  const healthLabels = {
    Healthy: 'Saludable',
    'Needs attention': 'Necesita atencion',
    'At risk': 'En riesgo',
  } as const;

  const priorityTasks = [...tasks]
    .filter((task) => task.status === 'pending')
    .sort((a, b) => {
      const aDue = dayjs(a.dueDate);
      const bDue = dayjs(b.dueDate);
      const today = dayjs().startOf('day');
      const aOverdue = aDue.isBefore(today, 'day');
      const bOverdue = bDue.isBefore(today, 'day');
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return aDue.valueOf() - bDue.valueOf();
    })
    .slice(0, 3);

  const taskTypeLabels: Record<Task['type'], string> = {
    watering: 'Riego',
    harvest: 'Cosecha',
    monitoring: 'Monitoreo',
  };

  const wateringToday = dailyTasks.filter((task) => task.type === 'watering' && task.status === 'pending');
  const strongRainWarnings = wateringToday.filter((task) => task.weatherGuidance === 'skip_recommended').length;
  const mildRainWarnings = wateringToday.filter((task) => task.weatherGuidance === 'suggest_postpone').length;
  const noRainWarnings = wateringToday.filter((task) => !task.weatherGuidance || task.weatherGuidance === 'none').length;

  const getUrgency = (dueDate: string) => {
    const due = dayjs(dueDate).startOf('day');
    const today = dayjs().startOf('day');
    if (due.isBefore(today)) {
      return { label: 'Vencida', className: 'bg-rose-100 text-rose-700' };
    }
    if (due.isSame(today, 'day')) {
      return { label: 'Hoy', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Proxima', className: 'bg-sky-100 text-sky-700' };
  };

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

      <article className="rounded-xl border border-emerald-200 bg-white p-4 md:col-span-3">
        <p className="text-sm text-slate-500">Prioridades del dia</p>
        <ul className="mt-2 space-y-1 text-sm">
          {priorityTasks.map((task) => (
            <li key={task.id} className="rounded border border-slate-200 px-2 py-1">
              <div className="flex items-center justify-between gap-2">
                <span>{taskTypeLabels[task.type]} - vence {dayjs(task.dueDate).format('DD/MM/YYYY')}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${getUrgency(task.dueDate).className}`}>
                  {getUrgency(task.dueDate).label}
                </span>
              </div>
            </li>
          ))}
          {!priorityTasks.length ? <li>No hay prioridades pendientes por ahora.</li> : null}
        </ul>
      </article>

      <article className="rounded-xl border border-emerald-200 bg-white p-4 md:col-span-3">
        <p className="text-sm text-slate-500">Decision de riego hoy</p>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">No regar por lluvia: {strongRainWarnings}</p>
          <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">Evaluar posponer: {mildRainWarnings}</p>
          <p className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">Riego normal: {noRainWarnings}</p>
        </div>
        {!wateringToday.length ? <p className="mt-2 text-sm text-slate-500">No hay tareas de riego pendientes para hoy.</p> : null}
      </article>
    </div>
  );
}
