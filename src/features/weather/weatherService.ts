import type { WeatherSnapshot } from '../../types/domain';

const cache = new Map<string, { expiresAt: number; value: WeatherSnapshot }>();
const ttlMs = 30 * 60 * 1000;

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export async function getForecast(lat: number, lon: number): Promise<WeatherSnapshot> {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const response = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error('No se pudo obtener el pronostico del clima');
  }

  const forecast = (await response.json()) as WeatherSnapshot;
  if (forecast.source === 'fallback') {
    console.warn(
      `[weatherService] Usando fallback para ${lat.toFixed(3)},${lon.toFixed(3)} (${forecast.fallbackReason ?? 'sin-reason'})`
    );
  }
  cache.set(key, { expiresAt: Date.now() + ttlMs, value: forecast });
  return forecast;
}
