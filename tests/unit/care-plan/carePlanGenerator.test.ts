import { describe, expect, it } from 'vitest';
import { generateCarePlan } from '../../../src/features/care-plan/carePlanGenerator';
import type { Plant, PlantType, WeatherSnapshot } from '../../../src/types/domain';

function makePlant(): Plant {
  const now = new Date().toISOString();
  return {
    id: 'plant_1',
    userId: 'user_1',
    plantTypeId: 'tomato',
    plantingDate: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}

function makePlantType(): PlantType {
  return {
    id: 'tomato',
    name: 'Tomato',
    wateringFrequencyDays: 3,
    harvestTimeDays: 80,
    sunlightNeeds: 'high',
    season: 'spring',
    idealTemperature: { min: 18, max: 30 },
    idealHumidity: { min: 50, max: 75 },
  };
}

function makeWeather(rainMm: number[], tempMax: number[]): WeatherSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    location: { lat: 40.4, lon: -3.7, city: 'Madrid' },
    current: { temp: tempMax[0], humidity: 45, description: 'clear' },
    forecast: rainMm.map((rain, index) => ({
      date: new Date(Date.now() + index * 24 * 3600 * 1000).toISOString().slice(0, 10),
      tempMin: tempMax[index] - 6,
      tempMax: tempMax[index],
      humidity: 45,
      rainMm: rain,
    })),
  };
}

describe('carePlanGenerator', () => {
  it('delays watering when rain is expected', () => {
    const output = generateCarePlan({
      userId: 'user_1',
      plant: makePlant(),
      plantType: makePlantType(),
      weather: makeWeather([6, 4, 0], [28, 27, 26]),
      overdueCriticalTasks: 0,
    });

    expect(output.plan.wateringEveryDays).toBe(4);
    expect(output.plan.insights.some((insight) => insight.code === 'RAIN_SKIP')).toBe(true);
  });

  it('increases watering frequency with heat trend', () => {
    const output = generateCarePlan({
      userId: 'user_1',
      plant: makePlant(),
      plantType: makePlantType(),
      weather: makeWeather([0, 0, 0], [30, 33, 36]),
      overdueCriticalTasks: 0,
    });

    expect(output.plan.wateringEveryDays).toBe(2);
    expect(output.plan.insights.some((insight) => insight.code === 'HEAT_TREND')).toBe(true);
  });

  it('marks plant at risk when there are overdue critical tasks', () => {
    const output = generateCarePlan({
      userId: 'user_1',
      plant: makePlant(),
      plantType: makePlantType(),
      weather: makeWeather([0, 0, 0], [25, 25, 25]),
      overdueCriticalTasks: 4,
    });

    expect(output.plan.healthStatus).toBe('At risk');
    expect(output.tasks.some((task) => task.type === 'monitoring')).toBe(true);
  });
});
