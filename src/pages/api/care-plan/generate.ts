import type { APIRoute } from 'astro';
import plantTypes from '../../../data/plants.json';
import { generateCarePlan } from '../../../features/care-plan/carePlanGenerator';
import type { Plant, PlantType, WeatherSnapshot } from '../../../types/domain';

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

    const lat = body.lat ?? 40.4168;
    const lon = body.lon ?? -3.7038;

    const weatherResponse = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
    const weather = (await weatherResponse.json()) as WeatherSnapshot;

    const output = generateCarePlan({
      userId: body.userId,
      plant: body.plant,
      plantType,
      weather,
      overdueCriticalTasks: body.overdueCriticalTasks ?? 0,
    });

    return new Response(JSON.stringify(output), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo generar el plan de cuidado' }), { status: 500 });
  }
};
