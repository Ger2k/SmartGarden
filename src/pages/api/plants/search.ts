import type { APIRoute } from 'astro';
import localPlants from '../../../data/plants.json';

type PerenualSpeciesItem = {
  common_name?: string | null;
  scientific_name?: string[];
};

type PerenualSpeciesListResponse = {
  data?: PerenualSpeciesItem[];
};

type PlantOption = {
  id: string;
  name: string;
};

function fromLocalPlants(query: string): PlantOption[] {
  const normalized = query.trim().toLowerCase();
  return (localPlants as Array<{ id: string; name: string }>)
    .filter((plant) => (normalized ? plant.name.toLowerCase().includes(normalized) : true))
    .slice(0, 10)
    .map((plant) => ({ id: plant.id, name: plant.name }));
}

function normalizeName(item: PerenualSpeciesItem): string | undefined {
  const common = item.common_name?.trim();
  if (common) return common;
  const scientific = item.scientific_name?.[0]?.trim();
  if (scientific) return scientific;
  return undefined;
}

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim();
  const apiKey = import.meta.env.PERENUAL_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local' }), { status: 200 });
  }

  try {
    const perenualUrl = `https://perenual.com/api/v2/species-list?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`;
    const response = await fetch(perenualUrl, { method: 'GET' });

    if (!response.ok) {
      return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local-fallback' }), { status: 200 });
    }

    const payload = (await response.json()) as PerenualSpeciesListResponse;
    const options: PlantOption[] = [];
    const seen = new Set<string>();

    for (const item of payload.data ?? []) {
      const name = normalizeName(item);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ id: name, name });
      if (options.length >= 10) break;
    }

    if (!options.length) {
      return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local-fallback' }), { status: 200 });
    }

    return new Response(JSON.stringify({ options, source: 'perenual' }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local-fallback' }), { status: 200 });
  }
};
