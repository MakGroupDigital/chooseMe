import { getCountryByName } from '../utils/phoneCountries';

const cityCache = new Map<string, string[]>();
const countryApiAliases: Record<string, string> = {
  CI: 'Ivory Coast',
  KR: 'South Korea',
  KP: 'North Korea',
  RU: 'Russia',
  TR: 'Turkey',
  CZ: 'Czech Republic',
  PS: 'Palestine',
  SY: 'Syria',
  IR: 'Iran',
  TZ: 'Tanzania',
  BO: 'Bolivia',
  VE: 'Venezuela',
  TW: 'Taiwan',
  VN: 'Vietnam',
  LA: 'Laos',
  MD: 'Moldova',
  MK: 'North Macedonia',
  CD: 'Democratic Republic of the Congo',
  CG: 'Republic of the Congo'
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getEnglishCountryName(countryName: string): string {
  const fromPhoneCountries = getCountryByName(countryName);
  const countryCode = fromPhoneCountries?.code;
  if (!countryCode) return countryName;

  if (countryApiAliases[countryCode]) {
    return countryApiAliases[countryCode];
  }

  try {
    const englishName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode);
    return englishName || countryName;
  } catch {
    return countryName;
  }
}

export async function getCitiesByCountry(countryName: string, fallbackCities: string[] = []): Promise<string[]> {
  if (!countryName?.trim()) return [];

  const cacheKey = normalize(countryName);
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey)!;
  }

  const countryCandidates = Array.from(
    new Set([countryName.trim(), getEnglishCountryName(countryName).trim()].filter(Boolean))
  );

  for (const country of countryCandidates) {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (!data?.error && Array.isArray(data?.data) && data.data.length > 0) {
        const cities = data.data
          .filter((city: unknown) => typeof city === 'string' && city.trim().length > 0)
          .map((city: string) => city.trim())
          .sort((a: string, b: string) => a.localeCompare(b));

        cityCache.set(cacheKey, cities);
        return cities;
      }
    } catch {
      // Try next candidate / fallback
    }
  }

  const uniqueFallback = Array.from(new Set(fallbackCities.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  cityCache.set(cacheKey, uniqueFallback);
  return uniqueFallback;
}
