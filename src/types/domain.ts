export type HealthStatus = 'Healthy' | 'Needs attention' | 'At risk';

export type TaskType = 'watering' | 'harvest' | 'monitoring';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export type WateringMode = 'auto' | 'manual';

export type RainAlertLevel = 'low' | 'medium' | 'high';

export type TaskPriority = 'low' | 'medium' | 'high';

export type WeatherGuidance = 'none' | 'suggest_postpone' | 'skip_recommended';

export interface PlantType {
  id: string;
  name: string;
  wateringFrequencyDays: number;
  harvestTimeDays: number;
  sunlightNeeds: 'low' | 'medium' | 'high';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  idealTemperature: {
    min: number;
    max: number;
  };
  idealHumidity: {
    min: number;
    max: number;
  };
}

export interface Plant {
  id: string;
  userId: string;
  plantTypeId: string;
  nickname?: string;
  plantingDate: string;
  wateringMode?: WateringMode;
  wateringFrequencySpringDays?: number;
  wateringFrequencySummerDays?: number;
  wateringFrequencyAutumnDays?: number;
  wateringFrequencyWinterDays?: number;
  rainAlertLevel?: RainAlertLevel;
  healthStatus?: HealthStatus;
  healthScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  rainMm: number;
}

export interface WeatherSnapshot {
  fetchedAt: string;
  source?: 'open-meteo' | 'fallback';
  fallbackReason?: string;
  location: {
    lat: number;
    lon: number;
    city: string;
  };
  current: {
    temp: number;
    humidity: number;
    description: string;
  };
  forecast: WeatherForecastDay[];
}

export interface Insight {
  code: 'WATER_TODAY' | 'RAIN_SKIP' | 'HEAT_TREND' | 'HARVEST_SOON';
  message: string;
}

export interface CarePlan {
  id: string;
  userId: string;
  plantId: string;
  generatedAt: string;
  algorithmVersion: string;
  wateringEveryDays: number;
  nextWateringDate: string;
  harvestEstimateDate: string;
  healthStatus: HealthStatus;
  healthScore: number;
  insights: Insight[];
  decisionLog: string[];
}

export interface Task {
  id: string;
  userId: string;
  plantId: string;
  carePlanId: string;
  type: TaskType;
  dueDate: string;
  priority?: TaskPriority;
  weatherGuidance?: WeatherGuidance;
  weatherReason?: string;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
