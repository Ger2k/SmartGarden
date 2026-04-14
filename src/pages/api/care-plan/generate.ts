import type { APIRoute } from 'astro';
import plantTypes from '../../../data/plants.json';
import { generateCarePlan } from '../../../features/care-plan/carePlanGenerator';
import { getPerenualWateringFrequencyDays } from '../../../features/plants/perenualService';
import type { Plant, PlantType, WeatherSnapshot } from '../../../types/domain';

function fallbackWeather(lat: number, lon: number): WeatherSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  return {
    fetchedAt: new Date().toISOString(),
    source: 'fallback',
    fallbackReason: 'care-plan-local-fallback',
    location: { lat, lon, city: 'Unknown' },
    current: { temp: 20, humidity: 60, description: 'fallback' },
    forecast: [
      { date: today, tempMin: 15, tempMax: 22, humidity: 60, rainMm: 0 },
      { date: today, tempMin: 16, tempMax: 24, humidity: 58, rainMm: 1 },
      { date: today, tempMin: 17, tempMax: 26, humidity: 55, rainMm: 0 },
    ],
  };
}

function isWeatherSnapshot(value: unknown): value is WeatherSnapshot {
  const data = value as WeatherSnapshot;
  return Boolean(data?.current && Array.isArray(data?.forecast));
}

export const POST: APIRoute = async ({ request, fetch }) => {
  try {
    const body = (await request.json()) as {
      userId: string;
      plant: Plant;
      overdueCriticalTasks?: number;
      lat?: number;
      lon?: number;
    };

    if (!body.userId || !body.plant) {
      return new Response(JSON.stringify({ error: 'userId y plant son obligatorios' }), { status: 400 });
    }

    const plantType = (plantTypes as PlantType[]).find((item) => item.id === body.plant.plantTypeId);
    if (!plantType) {
      return new Response(JSON.stringify({ error: 'Tipo de planta desconocido' }), { status: 400 });
    }

    const lat = Number.isFinite(body.lat) ? (body.lat as number) : 40.4168;
    const lon = Number.isFinite(body.lon) ? (body.lon as number) : -3.7038;

    let weather: WeatherSnapshot = fallbackWeather(lat, lon);
    try {
      const weatherResponse = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      if (weatherResponse.ok) {
        const payload = (await weatherResponse.json()) as unknown;
        if (isWeatherSnapshot(payload)) {
          weather = payload;
        }
      }
    } catch {
      weather = fallbackWeather(lat, lon);
    }

    const output = generateCarePlan({
      userId: body.userId,
      plant: body.plant,
      plantType,
      weather,
      overdueCriticalTasks: body.overdueCriticalTasks ?? 0,
      externalWateringEveryDays: await getPerenualWateringFrequencyDays(plantType.name),
    });

    return new Response(JSON.stringify(output), { status: 200 });
  } catch (error) {
    console.error('Error en /api/care-plan/generate', error);
    return new Response(JSON.stringify({ error: 'No se pudo generar el plan de cuidado' }), { status: 500 });
  }
};
