import { COUNTRIES, HOME_COUNTRY, INDIAN_STATES } from "@/lib/constants";

// Destinations are organised Country -> State -> City for India, and Country -> City for every other country.
// A destination outside India keeps its country name in `state` too, so every screen that shows or filters
// "city, state" keeps working without knowing about countries.

export const isHome = (country?: string | null) => !country || country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();
export const countryOf = (d: { country?: string | null }) => (isHome(d?.country) ? HOME_COUNTRY : String(d.country).trim());
/** "Manali, Himachal Pradesh" for India, "Phuket, Thailand" elsewhere. */
export const placeLabel = (d: { name: string; state?: string; country?: string | null }) => `${d.name}, ${isHome(d.country) ? d.state || HOME_COUNTRY : countryOf(d)}`;

/** Canonical spelling of a country: known names are matched ignoring case, others are tidied (Title Case, single spaces). */
export function canonicalCountry(input: unknown): string {
  const raw = String(input ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return HOME_COUNTRY;
  const known = COUNTRIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return known || raw.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Validates and normalises the country/state of a destination.
 * `current` is the stored destination when editing, so a legacy state spelling is only re-checked if it changes.
 */
export function resolvePlace(body: { country?: unknown; state?: unknown }, current?: { country?: string | null; state?: string }): { country: string; state: string } | { error: string } {
  const country = body.country !== undefined ? canonicalCountry(body.country) : current ? countryOf(current) : HOME_COUNTRY;
  if (country.length > 60) return { error: "Country name is too long." };
  if (!isHome(country)) return { country, state: country };

  const typed = String(body.state ?? "").trim();
  const state = typed || (current && isHome(current.country) ? current.state || "" : "");
  if (!state) return { error: "Choose the Indian state for this city." };
  const match = INDIAN_STATES.find((s) => s.toLowerCase() === state.toLowerCase());
  if (match) return { country, state: match };
  // Existing destinations may carry an older spelling; keep it as is, but don't accept new unknown states.
  if (current && state === current.state) return { country, state };
  return { error: `"${state}" isn't an Indian state. Pick one from the list.` };
}

export interface CountryGroup<T> {
  country: string;
  count: number;
  /** India only: cities grouped by state. */
  states: { state: string; items: T[] }[];
  /** Other countries: cities directly under the country. */
  items: T[];
}

/** Groups destinations Country -> State -> City (India first, then A-Z). */
export function groupByCountry<T extends { country?: string | null; state?: string; name: string }>(list: T[]): CountryGroup<T>[] {
  const by = new Map<string, T[]>();
  for (const d of list) by.set(countryOf(d), [...(by.get(countryOf(d)) || []), d]);
  return [...by.entries()]
    .sort(([a], [b]) => (isHome(a) ? -1 : isHome(b) ? 1 : a.localeCompare(b)))
    .map(([country, items]) => {
      if (!isHome(country)) return { country, count: items.length, states: [], items: [...items].sort((x, y) => x.name.localeCompare(y.name)) };
      const st = new Map<string, T[]>();
      for (const d of items) st.set(d.state || "—", [...(st.get(d.state || "—") || []), d]);
      return {
        country,
        count: items.length,
        items: [],
        states: [...st.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([state, its]) => ({ state, items: [...its].sort((x, y) => x.name.localeCompare(y.name)) })),
      };
    });
}
