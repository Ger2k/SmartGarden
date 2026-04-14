type PerenualSpeciesItem = {
  id?: number;
  common_name?: string | null;
};

type PerenualSpeciesListResponse = {
  data?: PerenualSpeciesItem[];
};

type PerenualSpeciesDetailsResponse = {
  watering?: string;
  watering_general_benchmark?: {
    value?: string | number;
    unit?: string;
  };
};

function parseRangeAverage(raw: string): number | undefined {
  const compact = raw.replace(/\s+/g, '');
  const match = compact.match(/(\d+(?:\.\d+)?)\s*[-/]\s*(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
  return Math.round((min + max) / 2);
}

function parseBenchmarkDays(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(30, Math.round(value)));
  }

  if (typeof value === 'string') {
    const range = parseRangeAverage(value);
    if (typeof range === 'number') {
      return Math.max(1, Math.min(30, range));
    }

    const single = Number(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(single) && single > 0) {
      return Math.max(1, Math.min(30, Math.round(single)));
    }
  }

  return undefined;
}

function mapWateringLabelToDays(label: unknown): number | undefined {
  if (typeof label !== 'string') return undefined;
  const normalized = label.trim().toLowerCase();
  if (!normalized) return undefined;

  if (normalized.includes('frequent')) return 2;
  if (normalized.includes('average')) return 4;
  if (normalized.includes('minimum') || normalized.includes('low')) return 7;
  return undefined;
}

function pickBestSpeciesId(query: string, items: PerenualSpeciesItem[]): number | undefined {
  if (!items.length) return undefined;
  const normalizedQuery = query.trim().toLowerCase();

  const exact = items.find((item) => (item.common_name ?? '').trim().toLowerCase() === normalizedQuery);
  if (typeof exact?.id === 'number') return exact.id;

  const startsWith = items.find((item) => (item.common_name ?? '').trim().toLowerCase().startsWith(normalizedQuery));
  if (typeof startsWith?.id === 'number') return startsWith.id;

  return typeof items[0]?.id === 'number' ? items[0].id : undefined;
}

export async function getPerenualWateringFrequencyDays(plantCommonName: string): Promise<number | undefined> {
  const apiKey = import.meta.env.PERENUAL_API_KEY;
  if (!apiKey) return undefined;

  const query = plantCommonName.trim();
  if (!query) return undefined;

  try {
    const listUrl = `https://perenual.com/api/v2/species-list?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`;
    const listResponse = await fetch(listUrl, { method: 'GET' });
    if (!listResponse.ok) return undefined;

    const listPayload = (await listResponse.json()) as PerenualSpeciesListResponse;
    const speciesId = pickBestSpeciesId(query, listPayload.data ?? []);
    if (!speciesId) return undefined;

    const detailsUrl = `https://perenual.com/api/v2/species/details/${speciesId}?key=${encodeURIComponent(apiKey)}`;
    const detailsResponse = await fetch(detailsUrl, { method: 'GET' });
    if (!detailsResponse.ok) return undefined;

    const details = (await detailsResponse.json()) as PerenualSpeciesDetailsResponse;
    const byBenchmark = parseBenchmarkDays(details.watering_general_benchmark?.value);
    if (typeof byBenchmark === 'number') return byBenchmark;

    return mapWateringLabelToDays(details.watering);
  } catch {
    return undefined;
  }
}
