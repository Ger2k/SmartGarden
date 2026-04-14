import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Task } from '../../types/domain';

type DailyTaskListProps = {
  tasks: Task[];
  onComplete: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
};

export default function DailyTaskList({ tasks, onComplete, onSkip }: DailyTaskListProps) {
  const [filter, setFilter] = useState<'today' | 'overdue' | 'upcoming'>('today');

  const priorityOrder: Record<NonNullable<Task['priority']>, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const statusLabels: Record<Task['status'], string> = {
    pending: 'Pendiente',
    completed: 'Completada',
    skipped: 'Omitida',
  };

  const typeLabels: Record<Task['type'], string> = {
    watering: 'Riego',
    harvest: 'Cosecha',
    monitoring: 'Monitoreo',
  };

  const filtered = useMemo(() => {
    const today = dayjs().startOf('day');
    const withFilter =
      filter === 'today'
        ? tasks.filter((task) => dayjs(task.dueDate).isSame(today, 'day'))
        : filter === 'overdue'
          ? tasks.filter((task) => task.status === 'pending' && dayjs(task.dueDate).isBefore(today, 'day'))
          : tasks.filter((task) => dayjs(task.dueDate).isAfter(today, 'day'));

    return [...withFilter].sort((a, b) => {
      const aPriority = priorityOrder[a.priority ?? 'medium'];
      const bPriority = priorityOrder[b.priority ?? 'medium'];
      if (aPriority !== bPriority) return aPriority - bPriority;
      return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
    });
  }, [tasks, filter]);

  const priorityLabel: Record<NonNullable<Task['priority']>, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  const guidanceLabel: Record<NonNullable<Task['weatherGuidance']>, string> = {
    none: 'Sin alerta de lluvia',
    suggest_postpone: 'Lluvia leve: podrias posponer',
    skip_recommended: 'Lluvia fuerte: mejor no regar',
  };

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tareas diarias</h3>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'today' | 'overdue' | 'upcoming')}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="today">Hoy</option>
          <option value="overdue">Vencidas</option>
          <option value="upcoming">Proximas</option>
        </select>
      </div>
      <ul className="mt-3 space-y-3">
        {filtered.map((task) => (
          <li key={task.id} className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium capitalize">{typeLabels[task.type]}</p>
            <p className="text-sm text-slate-600">Estado: {statusLabels[task.status]}</p>
            <p className="text-xs text-slate-500">Vence: {dayjs(task.dueDate).format('DD/MM/YYYY')}</p>
            <p className="text-xs text-slate-500">Prioridad: {priorityLabel[task.priority ?? 'medium']}</p>
            {task.type === 'watering' ? (
              <p className="text-xs text-slate-500">{guidanceLabel[task.weatherGuidance ?? 'none']}</p>
            ) : null}
            {task.weatherReason ? <p className="text-xs text-slate-500">Motivo: {task.weatherReason}</p> : null}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void onComplete(task.id)}
                disabled={task.status !== 'pending'}
                className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
              >
                Completar
              </button>
              <button
                type="button"
                onClick={() => void onSkip(task.id)}
                disabled={task.status !== 'pending'}
                className="rounded bg-slate-600 px-3 py-1 text-sm text-white"
              >
                Omitir
              </button>
            </div>
          </li>
        ))}
        {!filtered.length ? <li className="text-sm text-slate-500">No hay tareas para este filtro.</li> : null}
      </ul>
    </section>
  );
}
