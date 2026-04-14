import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Task } from '../../types/domain';

type TaskHistoryListProps = {
  tasks: Task[];
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

export default function TaskHistoryList({ tasks }: TaskHistoryListProps) {
  const [filter, setFilter] = useState<'all' | Task['status']>('all');
  const [range, setRange] = useState<'all' | '7d' | '30d'>('all');

  const filteredByStatus = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  const filtered = useMemo(() => {
    if (range === 'all') return filteredByStatus;
    const days = range === '7d' ? 7 : 30;
    const limit = dayjs().subtract(days, 'day');
    return filteredByStatus.filter((task) => dayjs(task.dueDate).isAfter(limit));
  }, [filteredByStatus, range]);

  const ordered = useMemo(
    () => [...filtered].sort((a, b) => dayjs(b.dueDate).valueOf() - dayjs(a.dueDate).valueOf()),
    [filtered]
  );

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historial de tareas</h3>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as 'all' | Task['status'])}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
            <option value="skipped">Omitidas</option>
          </select>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as 'all' | '7d' | '30d')}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">Todo</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
          </select>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {ordered.slice(0, 12).map((task) => (
          <li key={task.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <p className="font-medium">{typeLabels[task.type]}</p>
            <p className="text-slate-600">Estado: {statusLabels[task.status]}</p>
            <p className="text-slate-500">Vence: {dayjs(task.dueDate).format('DD/MM/YYYY')}</p>
            {task.completedAt ? <p className="text-slate-500">Completada: {dayjs(task.completedAt).format('DD/MM/YYYY HH:mm')}</p> : null}
          </li>
        ))}
        {!ordered.length ? <li className="text-sm text-slate-500">No hay historial para mostrar.</li> : null}
      </ul>
    </section>
  );
}
