import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import AppShell from '../common/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types/domain';

dayjs.extend(isoWeek);
dayjs.locale('es');

type CalendarView = 'month' | 'week';

function buildMonthGrid(currentMonth: dayjs.Dayjs) {
  const monthStart = currentMonth.startOf('month');
  const monthEnd = currentMonth.endOf('month');
  const gridStart = monthStart.startOf('isoWeek');
  const gridEnd = monthEnd.endOf('isoWeek');

  const days: dayjs.Dayjs[] = [];
  let cursor = gridStart;
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, 'day')) {
    days.push(cursor);
    cursor = cursor.add(1, 'day');
  }

  return days;
}

function buildWeekGrid(currentDate: dayjs.Dayjs) {
  const weekStart = currentDate.startOf('isoWeek');
  const days: dayjs.Dayjs[] = [];

  for (let i = 0; i < 7; i += 1) {
    days.push(weekStart.add(i, 'day'));
  }

  return days;
}

function taskTypeLabel(type: Task['type']) {
  const labels: Record<Task['type'], string> = {
    watering: 'Riego',
    harvest: 'Cosecha',
    monitoring: 'Monitoreo',
  };
  return labels[type];
}

function taskStatusLabel(status: Task['status']) {
  const labels: Record<Task['status'], string> = {
    pending: 'Pendiente',
    completed: 'Completada',
    skipped: 'Omitida',
  };
  return labels[status];
}

function taskPriorityLabel(priority: Task['priority']) {
  if (priority === 'high') return 'Alta';
  if (priority === 'low') return 'Baja';
  return 'Media';
}

function taskPriorityClasses(priority: Task['priority']) {
  if (priority === 'high') return 'bg-rose-100 text-rose-900';
  if (priority === 'low') return 'bg-sky-100 text-sky-900';
  return 'bg-amber-100 text-amber-900';
}

function weatherGuidanceLabel(guidance: Task['weatherGuidance']) {
  if (guidance === 'skip_recommended') return 'No regar por lluvia';
  if (guidance === 'suggest_postpone') return 'Podrias posponer por lluvia';
  return 'Sin alerta de lluvia';
}

export default function CalendarPage() {
  const { user, loading, signOut } = useAuth();
  const { tasks, complete, skip } = useTasks(user?.uid);
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(dayjs().startOf('day'));
  const [selectedDay, setSelectedDay] = useState(dayjs().format('YYYY-MM-DD'));

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = dayjs(task.dueDate).format('YYYY-MM-DD');
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    if (view === 'week') return buildWeekGrid(currentDate);
    return buildMonthGrid(currentDate.startOf('month'));
  }, [currentDate, view]);

  const periodLabel = useMemo(() => {
    if (view === 'month') return currentDate.startOf('month').format('MMMM YYYY');

    const start = currentDate.startOf('isoWeek');
    const end = currentDate.endOf('isoWeek');
    return `Semana del ${start.format('DD MMM')} al ${end.format('DD MMM')}`;
  }, [currentDate, view]);

  const selectedTasks = useMemo(() => grouped.get(selectedDay) ?? [], [grouped, selectedDay]);

  const selectedTasksOrdered = useMemo(() => {
    const weight = (priority: Task['priority']) => {
      if (priority === 'high') return 0;
      if (priority === 'medium') return 1;
      return 2;
    };

    return [...selectedTasks].sort((a, b) => {
      const byPriority = weight(a.priority) - weight(b.priority);
      if (byPriority !== 0) return byPriority;
      return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
    });
  }, [selectedTasks]);

  const goPrev = () => {
    setCurrentDate((prev) => (view === 'month' ? prev.subtract(1, 'month') : prev.subtract(1, 'week')));
  };

  const goNext = () => {
    setCurrentDate((prev) => (view === 'month' ? prev.add(1, 'month') : prev.add(1, 'week')));
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace('/login');
    }
  }, [loading, user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.replace('/login');
  };

  if (loading) {
    return <p className="p-6">Cargando sesion...</p>;
  }

  if (!user) {
    return <p className="p-6">Redirigiendo a /login...</p>;
  }

  return (
    <AppShell title="Calendario de tareas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView('month')}
            className={`rounded px-3 py-2 text-sm text-white ${view === 'month' ? 'bg-emerald-700' : 'bg-slate-600'}`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => setView('week')}
            className={`rounded px-3 py-2 text-sm text-white ${view === 'week' ? 'bg-emerald-700' : 'bg-slate-600'}`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={goPrev}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
          >
            Siguiente
          </button>
          <button
            type="button"
            onClick={() => {
              const today = dayjs().startOf('day');
              setCurrentDate(today);
              setSelectedDay(today.format('YYYY-MM-DD'));
            }}
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            Hoy
          </button>
        </div>

        <p className="text-lg font-semibold capitalize">{periodLabel}</p>

        <button type="button" onClick={() => void handleSignOut()} className="rounded bg-slate-800 px-4 py-2 text-sm text-white">
          Cerrar sesion
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-600">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mie</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sab</div>
        <div>Dom</div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const tasksOfDay = grouped.get(key) ?? [];
          const inCurrentMonth = view === 'week' || day.month() === currentDate.month();
          const isSelected = key === selectedDay;

          return (
            <article
              key={key}
              className={`min-h-28 rounded-lg border p-2 ${inCurrentMonth ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50'} ${isSelected ? 'ring-2 ring-emerald-400' : ''}`}
            >
              <button
                type="button"
                onClick={() => setSelectedDay(key)}
                className="w-full text-left text-sm font-medium"
              >
                {day.format('D')}
              </button>
              <ul className="mt-2 space-y-1">
                {tasksOfDay.slice(0, 3).map((task) => (
                  <li key={task.id} className={`truncate rounded px-2 py-1 text-xs ${taskPriorityClasses(task.priority)}`}>
                    {taskTypeLabel(task.type)}
                  </li>
                ))}
                {tasksOfDay.length > 3 ? <li className="text-xs text-slate-500">+{tasksOfDay.length - 3} mas</li> : null}
              </ul>
            </article>
          );
        })}
      </div>

      <section className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Detalle del dia {dayjs(selectedDay).format('DD/MM/YYYY')}</h3>
        <ul className="mt-3 space-y-2">
          {selectedTasksOrdered.map((task) => (
            <li key={task.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
              <p className="font-medium">{taskTypeLabel(task.type)}</p>
              <p className="text-slate-600">Estado: {taskStatusLabel(task.status)}</p>
              <p className="text-slate-600">Prioridad: {taskPriorityLabel(task.priority)}</p>
              {task.type === 'watering' ? <p className="text-slate-600">{weatherGuidanceLabel(task.weatherGuidance)}</p> : null}
              {task.weatherReason ? <p className="text-slate-500">Motivo: {task.weatherReason}</p> : null}
              {task.completedAt ? (
                <p className="text-slate-500">Completada: {dayjs(task.completedAt).format('DD/MM/YYYY HH:mm')}</p>
              ) : null}
              {task.status === 'pending' ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void complete(task.id)}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                  >
                    Completar
                  </button>
                  <button
                    type="button"
                    onClick={() => void skip(task.id)}
                    className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
                  >
                    Omitir
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {!selectedTasksOrdered.length ? <li className="text-sm text-slate-500">No hay tareas en esta fecha.</li> : null}
        </ul>
      </section>
    </AppShell>
  );
}
