import type { WeatherSnapshot } from '../../types/domain';

type WeatherCardProps = {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
};

export default function WeatherCard({ weather, loading, error }: WeatherCardProps) {
  return (
    <article className="rounded-xl border border-emerald-200 bg-white p-4">
      <p className="text-sm text-slate-500">Pronostico del clima</p>
      {loading ? <p className="mt-2 text-sm">Cargando clima...</p> : null}
      {error ? <p className="mt-2 text-sm text-amber-700">{error}</p> : null}
      {weather ? (
        <>
          <p className="mt-2 text-2xl font-semibold">{weather.current.temp} C</p>
          <p className="text-sm text-slate-600">Humedad {weather.current.humidity}%</p>
          <p className="text-sm text-slate-600">{weather.current.description}</p>
        </>
      ) : null}
    </article>
  );
}
