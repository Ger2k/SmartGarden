import type { APIRoute } from 'astro';
import type { WeatherSnapshot } from '../../../types/domain';

type OpenMeteoPayload = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_sum?: number[];
  };
};

function weatherCodeDescription(code?: number): string {
  const map: Record<number, string> = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla escarchada',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nieve ligera',
    73: 'Nieve moderada',
    75: 'Nieve intensa',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos intensos',
    95: 'Tormenta',
  };

  if (typeof code !== 'number') return 'Pronostico';
  return map[code] ?? `Codigo clima ${code}`;
}

function normalizeWeather(data: OpenMeteoPayload, lat: number, lon: number): WeatherSnapshot {
  const dates = data.daily?.time ?? [];
  const mins = data.daily?.temperature_2m_min ?? [];
  const maxs = data.daily?.temperature_2m_max ?? [];
  const rains = data.daily?.precipitation_sum ?? [];

  const forecast = dates.slice(0, 5).map((date, index) => ({
    date,
    tempMin: Number((mins[index] ?? 15).toFixed(1)),
    tempMax: Number((maxs[index] ?? 22).toFixed(1)),
    humidity: Number((data.current?.relative_humidity_2m ?? 60).toFixed(0)),
    rainMm: Number((rains[index] ?? 0).toFixed(1)),
  }));

  return {
    fetchedAt: new Date().toISOString(),
    source: 'open-meteo',
    location: { lat, lon, city: 'Open-Meteo' },
    current: {
      temp: Number((data.current?.temperature_2m ?? forecast[0]?.tempMax ?? 20).toFixed(1)),
      humidity: Number((data.current?.relative_humidity_2m ?? forecast[0]?.humidity ?? 60).toFixed(0)),
      description: weatherCodeDescription(data.current?.weather_code),
    },
    forecast,
  };
}

function fallbackWeather(lat: number, lon: number, reason: string): WeatherSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  return {
    fetchedAt: new Date().toISOString(),
    source: 'fallback',
    fallbackReason: reason,
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

  try {
    const endpoint =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code` +
      `&daily=temperature_2m_min,temperature_2m_max,precipitation_sum` +
      `&timezone=auto&forecast_days=5`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.warn(`[weather] Open-Meteo status ${response.status}, usando fallback`);
      return new Response(JSON.stringify(fallbackWeather(lat, lon, `upstream-status-${response.status}`)), { status: 200 });
    }

    const payload = (await response.json()) as OpenMeteoPayload;
    if (!payload?.daily?.time?.length) {
      console.warn('[weather] Payload invalido de Open-Meteo, usando fallback');
      return new Response(JSON.stringify(fallbackWeather(lat, lon, 'invalid-payload')), { status: 200 });
    }

    const normalized = normalizeWeather(payload, lat, lon);
    return new Response(JSON.stringify(normalized), { status: 200 });
  } catch (error) {
    console.warn('[weather] Error consultando Open-Meteo, usando fallback', error);
    return new Response(JSON.stringify(fallbackWeather(lat, lon, 'fetch-error')), { status: 200 });
  }
};
