import { useEffect, useState } from 'react';

type GeoState = {
  lat?: number;
  lon?: number;
  loading: boolean;
  error: string | null;
};

const fallback = { lat: 40.4168, lon: -3.7038 };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: 'La geolocalizacion no esta disponible.', ...fallback });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      () => {
        setState({ loading: false, error: 'Ubicacion denegada, se usa ciudad por defecto.', ...fallback });
      },
      { timeout: 10000 }
    );
  }, []);

  return state;
}
