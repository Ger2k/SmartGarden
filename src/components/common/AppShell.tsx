import type { PropsWithChildren } from 'react';

type AppShellProps = PropsWithChildren<{
  title: string;
}>;

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <header className="border-b border-emerald-200 bg-white/90">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <nav className="mt-3 flex flex-wrap gap-2 text-sm">
            <a className="rounded bg-emerald-100 px-3 py-1 text-emerald-900" href="/dashboard">
              Panel
            </a>
            <a className="rounded bg-emerald-100 px-3 py-1 text-emerald-900" href="/plants">
              Plantas
            </a>
            <a className="rounded bg-emerald-100 px-3 py-1 text-emerald-900" href="/tasks">
              Tareas
            </a>
            <a className="rounded bg-emerald-100 px-3 py-1 text-emerald-900" href="/calendar">
              Calendario
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
