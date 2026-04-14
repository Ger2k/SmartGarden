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

function currentSeason(isoDate: string): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date(isoDate).getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function resolveRainThreshold(level: Plant['rainAlertLevel']): number {
  if (level === 'high') return 5;
  if (level === 'low') return 12;
  return 8;
}

function resolveSeasonalWateringDays(plant: Plant, nowIso: string): number | undefined {
  if (plant.wateringMode !== 'manual') return undefined;
  const season = currentSeason(nowIso);
  if (season === 'spring') return plant.wateringFrequencySpringDays;
  if (season === 'summer') return plant.wateringFrequencySummerDays;
  if (season === 'autumn') return plant.wateringFrequencyAutumnDays;
  return plant.wateringFrequencyWinterDays;
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

function buildInsights(
  rainSoon: number,
  rainThresholdMm: number,
  isHeatTrend: boolean,
  nextWateringDate: string,
  harvestEstimateDate: string
): Insight[] {
  void nextWateringDate;
  const insights: Insight[] = [];

  if (rainSoon >= rainThresholdMm) {
    insights.push({ code: 'RAIN_SKIP', message: 'Lluvia fuerte prevista, se recomienda no regar por ahora.' });
  } else if (rainSoon >= Math.max(2, rainThresholdMm * 0.6)) {
    insights.push({ code: 'RAIN_SKIP', message: 'Podrias posponer el riego: hay lluvia prevista en los proximos dias.' });
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
  const rainThresholdMm = resolveRainThreshold(input.plant.rainAlertLevel ?? 'medium');

  let wateringEveryDays = input.plantType.wateringFrequencyDays;
  const decisionLog: string[] = [];

  const seasonalOverride = resolveSeasonalWateringDays(input.plant, now);
  if (typeof seasonalOverride === 'number' && seasonalOverride > 0) {
    wateringEveryDays = seasonalOverride;
    decisionLog.push(`Riego manual por temporada aplicado: cada ${seasonalOverride} dias.`);
  }

  const rainSeverity = rainSoon >= rainThresholdMm ? 'strong' : rainSoon >= Math.max(2, rainThresholdMm * 0.6) ? 'mild' : 'none';

  if (rainSeverity === 'strong') {
    wateringEveryDays += 1;
    decisionLog.push('Lluvia fuerte detectada, riego retrasado 1 dia.');
  } else if (rainSeverity === 'mild') {
    decisionLog.push('Lluvia leve detectada, se sugiere evaluar si conviene posponer el riego.');
  }

  if (isHeatTrend) {
    wateringEveryDays = Math.max(1, wateringEveryDays - 1);
    decisionLog.push('Tendencia de calor en aumento, riego adelantado 1 dia.');
  }

  const nextWateringDate = addDays(now, wateringEveryDays);
  const harvestEstimateDate = addDays(input.plant.plantingDate, input.plantType.harvestTimeDays);

  const health = computeHealthStatus(input.overdueCriticalTasks, input.weather, input.plantType);
  const insights = buildInsights(rainSoon, rainThresholdMm, isHeatTrend, nextWateringDate, harvestEstimateDate);

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
      priority: rainSeverity === 'strong' ? 'low' : 'high',
      weatherGuidance: rainSeverity === 'strong' ? 'skip_recommended' : rainSeverity === 'mild' ? 'suggest_postpone' : 'none',
      weatherReason:
        rainSeverity === 'none'
          ? undefined
          : `Pronostico acumulado de lluvia: ${rainSoon.toFixed(1)} mm en 48h.`,
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
      priority: 'medium',
      weatherGuidance: 'none',
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
      priority: 'high',
      weatherGuidance: 'none',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  return { plan, tasks };
}
