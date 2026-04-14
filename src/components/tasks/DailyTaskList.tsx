import type { Task } from '../../types/domain';

type DailyTaskListProps = {
  tasks: Task[];
  onComplete: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
};

export default function DailyTaskList({ tasks, onComplete, onSkip }: DailyTaskListProps) {
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

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Tareas diarias</h3>
      <ul className="mt-3 space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium capitalize">{typeLabels[task.type]}</p>
            <p className="text-sm text-slate-600">Estado: {statusLabels[task.status]}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void onComplete(task.id)}
                className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
              >
                Completar
              </button>
              <button
                type="button"
                onClick={() => void onSkip(task.id)}
                className="rounded bg-slate-600 px-3 py-1 text-sm text-white"
              >
                Omitir
              </button>
            </div>
          </li>
        ))}
        {!tasks.length ? <li className="text-sm text-slate-500">No hay tareas para hoy.</li> : null}
      </ul>
    </section>
  );
}
