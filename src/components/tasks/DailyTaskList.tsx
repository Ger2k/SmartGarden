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
    if (filter === 'today') {
      return tasks.filter((task) => dayjs(task.dueDate).isSame(today, 'day'));
    }
    if (filter === 'overdue') {
      return tasks.filter((task) => task.status === 'pending' && dayjs(task.dueDate).isBefore(today, 'day'));
    }
    return tasks.filter((task) => dayjs(task.dueDate).isAfter(today, 'day'));
  }, [tasks, filter]);

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
