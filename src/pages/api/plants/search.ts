import type { APIRoute } from 'astro';
import localPlants from '../../../data/plants.json';

type PerenualSpeciesItem = {
  id?: number;
  common_name?: string | null;
  scientific_name?: string[];
};

type PerenualSpeciesListResponse = {
  data?: PerenualSpeciesItem[];
};

type PlantOption = {
  plantTypeId: string;
  name: string;
  perenualSpeciesId?: number;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBigrams(value: string): string[] {
  if (value.length < 2) return [value];
  const bigrams: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.push(value.slice(index, index + 2));
  }
  return bigrams;
}

function similarityScore(query: string, candidate: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 0;

  if (normalizedCandidate === normalizedQuery) return 100;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 90;
  if (normalizedCandidate.includes(normalizedQuery)) return 75;

  const queryBigrams = buildBigrams(normalizedQuery);
  const candidateBigrams = buildBigrams(normalizedCandidate);
  const candidateSet = new Set(candidateBigrams);
  const intersection = queryBigrams.filter((pair) => candidateSet.has(pair)).length;
  const dice = (2 * intersection) / (queryBigrams.length + candidateBigrams.length);

  return Math.round(dice * 70);
}

function rankOptionsBySimilarity(options: PlantOption[], query: string, minimumScore = 15): PlantOption[] {
  const scored = options
    .map((option) => ({ option, score: similarityScore(query, option.name) }))
    .filter((item) => item.score >= minimumScore)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 10).map((item) => item.option);
}

function fromLocalPlants(query: string): PlantOption[] {
  const options = (localPlants as Array<{ id: string; name: string }>).map((plant) => ({
    plantTypeId: plant.id,
    name: plant.name,
  }));

  if (!query.trim()) return options.slice(0, 10);

  return rankOptionsBySimilarity(options, query);
}

function normalizeName(item: PerenualSpeciesItem): string | undefined {
  const common = item.common_name?.trim();
  if (common) return common;
  const scientific = item.scientific_name?.[0]?.trim();
  if (scientific) return scientific;
  return undefined;
}

function mapPerenualOptions(data: PerenualSpeciesItem[] | undefined): PlantOption[] {
  const options: PlantOption[] = [];
  const seen = new Set<string>();

  for (const item of data ?? []) {
    const name = normalizeName(item);
    if (!name) continue;
    const key = normalizeText(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    options.push({ plantTypeId: name, name, perenualSpeciesId: item.id });
  }

  return options;
}

async function fetchPerenualOptions(apiKey: string, query: string): Promise<PlantOption[]> {
  const perenualUrl = `https://perenual.com/api/v2/species-list?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`;
  const response = await fetch(perenualUrl, { method: 'GET' });
  if (!response.ok) return [];
  const payload = (await response.json()) as PerenualSpeciesListResponse;
  return mapPerenualOptions(payload.data);
}

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim();
  const apiKey = import.meta.env.PERENUAL_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local' }), { status: 200 });
  }

  try {
    const exactMatches = rankOptionsBySimilarity(await fetchPerenualOptions(apiKey, query), query);
    if (exactMatches.length > 0) {
      return new Response(JSON.stringify({ options: exactMatches, source: 'perenual' }), { status: 200 });
    }

    const normalized = normalizeText(query);
    const relaxedQueries = Array.from(
      new Set([normalized.slice(0, 4), normalized.slice(0, 3), normalized.slice(0, Math.max(1, normalized.length - 1))])
    ).filter((value) => value && value.length >= 3);

    for (const relaxedQuery of relaxedQueries) {
      const similarOptions = rankOptionsBySimilarity(await fetchPerenualOptions(apiKey, relaxedQuery), query, 20);
      if (similarOptions.length > 0) {
        return new Response(JSON.stringify({ options: similarOptions, source: 'perenual-similar' }), { status: 200 });
      }
    }

    const localSuggestions = fromLocalPlants(query);
    return new Response(JSON.stringify({ options: localSuggestions, source: 'local-similar' }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ options: fromLocalPlants(query), source: 'local-fallback' }), { status: 200 });
  }
};
