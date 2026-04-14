import type { CarePlan, HealthStatus, Insight, Plant, PlantType, Task, WeatherSnapshot } from '../../types/domain';
import { addDays, daysBetween, isoNow } from '../../utils/date';
import { makeId } from '../../utils/id';

function forecastRainNextDays(weather: WeatherSnapshot, days = 2): number {
  return weather.forecast.slice(0, days).reduce((sum, day) => sum + day.rainMm, 0);
}

function heatTrend(weather: WeatherSnapshot): boolean {
  const nextThree = weather.forecast.slice(0, 3);
  if (nextThree.length < 2) return false;

  let risingDays = 0;
  for (let i = 1; i < nextThree.length; i += 1) {
    if (nextThree[i].tempMax > nextThree[i - 1].tempMax) {
      risingDays += 1;
    }
  }
  return risingDays >= 2;
}

function computeHealthStatus(overdueCriticalTasks: number, weather: WeatherSnapshot, plantType: PlantType): {
  status: HealthStatus;
  score: number;
} {
  const temp = weather.current.temp;
  const humidity = weather.current.humidity;

  let score = 100;
  if (overdueCriticalTasks > 0) score -= overdueCriticalTasks * 18;
  if (temp > plantType.idealTemperature.max + 6 || temp < plantType.idealTemperature.min - 6) score -= 20;
  if (humidity > plantType.idealHumidity.max + 20 || humidity < plantType.idealHumidity.min - 20) score -= 15;

  const bounded = Math.max(0, Math.min(100, score));
  if (bounded >= 70) return { status: 'Healthy', score: bounded };
  if (bounded >= 40) return { status: 'Needs attention', score: bounded };
  return { status: 'At risk', score: bounded };
}

function buildInsights(rainSoon: number, isHeatTrend: boolean, nextWateringDate: string, harvestEstimateDate: string): Insight[] {
  void nextWateringDate;
  const insights: Insight[] = [];

  if (rainSoon >= 8) {
    insights.push({ code: 'RAIN_SKIP', message: 'Se espera lluvia manana, se pospone el riego.' });
  } else {
    insights.push({ code: 'WATER_TODAY', message: 'Riego recomendado hoy o en las proximas 24 horas.' });
  }

  if (isHeatTrend) {
    insights.push({ code: 'HEAT_TREND', message: 'Tendencia de calor detectada, se aumenta la frecuencia de riego.' });
  }

  if (daysBetween(isoNow(), harvestEstimateDate) <= 7) {
    insights.push({ code: 'HARVEST_SOON', message: 'La cosecha estimada se acerca durante esta semana.' });
  }

  return insights;
}

export function generateCarePlan(input: {
  userId: string;
  plant: Plant;
  plantType: PlantType;
  weather: WeatherSnapshot;
  overdueCriticalTasks: number;
}): { plan: CarePlan; tasks: Omit<Task, 'id'>[] } {
  const now = isoNow();
  const rainSoon = forecastRainNextDays(input.weather, 2);
  const isHeatTrend = heatTrend(input.weather);

  let wateringEveryDays = input.plantType.wateringFrequencyDays;
  const decisionLog: string[] = [];

  if (rainSoon >= 8) {
    wateringEveryDays += 1;
    decisionLog.push('Pronostico de lluvia detectado, riego retrasado 1 dia.');
  }

  if (isHeatTrend) {
    wateringEveryDays = Math.max(1, wateringEveryDays - 1);
    decisionLog.push('Tendencia de calor en aumento, riego adelantado 1 dia.');
  }

  const nextWateringDate = addDays(now, wateringEveryDays);
  const harvestEstimateDate = addDays(input.plant.plantingDate, input.plantType.harvestTimeDays);

  const health = computeHealthStatus(input.overdueCriticalTasks, input.weather, input.plantType);
  const insights = buildInsights(rainSoon, isHeatTrend, nextWateringDate, harvestEstimateDate);

  const plan: CarePlan = {
    id: makeId('plan'),
    userId: input.userId,
    plantId: input.plant.id,
    generatedAt: now,
    algorithmVersion: 'v1.0.0',
    wateringEveryDays,
    nextWateringDate,
    harvestEstimateDate,
    healthStatus: health.status,
    healthScore: health.score,
    insights,
    decisionLog,
  };

  const tasks: Omit<Task, 'id'>[] = [
    {
      userId: input.userId,
      plantId: input.plant.id,
      carePlanId: plan.id,
      type: 'watering',
      dueDate: nextWateringDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: input.userId,
      plantId: input.plant.id,
      carePlanId: plan.id,
      type: 'harvest',
      dueDate: harvestEstimateDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  ];

  if (health.status !== 'Healthy') {
    tasks.push({
      userId: input.userId,
      plantId: input.plant.id,
      carePlanId: plan.id,
      type: 'monitoring',
      dueDate: addDays(now, 1),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  return { plan, tasks };
}
