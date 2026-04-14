import { useAuth } from '../../hooks/useAuth';

export default function LoginCard() {
  const { signIn, loading, error } = useAuth();

  const handleSignIn = async () => {
    const ok = await signIn();
    if (ok) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <section className="mx-auto mt-24 max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Smart Garden</h2>
      <p className="mt-2 text-sm text-slate-600">Inicia sesion con Google para gestionar tus plantas y tareas de cuidado.</p>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void handleSignIn()}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? 'Comprobando sesion...' : 'Continuar con Google'}
      </button>
    </section>
  );
}
