import type { APIRoute } from 'astro';
import type { WeatherSnapshot } from '../../../types/domain';

function normalizeWeather(data: any, city: string, lat: number, lon: number): WeatherSnapshot {
  const grouped = new Map<string, { tempMin: number; tempMax: number; humidity: number; rainMm: number }>();

  for (const item of data.list as any[]) {
    const key = String(item.dt_txt).slice(0, 10);
    const current = grouped.get(key) ?? {
      tempMin: Number.POSITIVE_INFINITY,
      tempMax: Number.NEGATIVE_INFINITY,
      humidity: 0,
      rainMm: 0,
    };

    current.tempMin = Math.min(current.tempMin, item.main.temp_min);
    current.tempMax = Math.max(current.tempMax, item.main.temp_max);
    current.humidity = item.main.humidity;
    current.rainMm += item.rain?.['3h'] ?? 0;
    grouped.set(key, current);
  }

  const forecast = Array.from(grouped.entries())
    .slice(0, 5)
    .map(([date, value]) => ({
      date,
      tempMin: Number(value.tempMin.toFixed(1)),
      tempMax: Number(value.tempMax.toFixed(1)),
      humidity: value.humidity,
      rainMm: Number(value.rainMm.toFixed(1)),
    }));

  return {
    fetchedAt: new Date().toISOString(),
    location: { lat, lon, city },
    current: {
      temp: forecast[0]?.tempMax ?? 20,
      humidity: forecast[0]?.humidity ?? 60,
      description: data.list?.[0]?.weather?.[0]?.description ?? 'forecast',
    },
    forecast,
  };
}

function fallbackWeather(lat: number, lon: number): WeatherSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  return {
    fetchedAt: new Date().toISOString(),
    location: { lat, lon, city: 'Unknown' },
    current: { temp: 20, humidity: 60, description: 'fallback' },
    forecast: [
      { date: today, tempMin: 15, tempMax: 22, humidity: 60, rainMm: 0 },
      { date: today, tempMin: 16, tempMax: 24, humidity: 58, rainMm: 0 },
      { date: today, tempMin: 17, tempMax: 26, humidity: 55, rainMm: 1 },
    ],
  };
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return new Response(JSON.stringify({ error: 'lat y lon son obligatorios' }), { status: 400 });
  }

  const apiKey = import.meta.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify(fallbackWeather(lat, lon)), { status: 200 });
  }

  try {
    const endpoint = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      return new Response(JSON.stringify(fallbackWeather(lat, lon)), { status: 200 });
    }

    const payload = await response.json();
    const city = payload?.city?.name ?? 'Unknown';
    const normalized = normalizeWeather(payload, city, lat, lon);
    return new Response(JSON.stringify(normalized), { status: 200 });
  } catch {
    return new Response(JSON.stringify(fallbackWeather(lat, lon)), { status: 200 });
  }
};
