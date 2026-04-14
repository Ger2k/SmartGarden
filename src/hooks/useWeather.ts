import { useEffect, useState } from 'react';
import { getForecast } from '../features/weather/weatherService';
import type { WeatherSnapshot } from '../types/domain';

export function useWeather(lat?: number, lon?: number) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (lat == null || lon == null) return;
      setLoading(true);
      setError(null);
      try {
        setWeather(await getForecast(lat, lon));
      } catch {
        setError('Pronostico no disponible. Se muestran recomendaciones de respaldo.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [lat, lon]);

  return { weather, loading, error };
}
