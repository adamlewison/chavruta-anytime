export const COUNTRIES = [
  {
    region: "North America",
    countries: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "MX", name: "Mexico" },
    ],
  },
  {
    region: "Europe",
    countries: [
      { code: "GB", name: "United Kingdom" },
      { code: "FR", name: "France" },
      { code: "DE", name: "Germany" },
      { code: "NL", name: "Netherlands" },
      { code: "BE", name: "Belgium" },
      { code: "CH", name: "Switzerland" },
      { code: "AT", name: "Austria" },
      { code: "IT", name: "Italy" },
      { code: "ES", name: "Spain" },
      { code: "SE", name: "Sweden" },
      { code: "UA", name: "Ukraine" },
      { code: "RU", name: "Russia" },
      { code: "HU", name: "Hungary" },
    ],
  },
  {
    region: "Middle East",
    countries: [{ code: "IL", name: "Israel" }],
  },
  {
    region: "Oceania",
    countries: [
      { code: "AU", name: "Australia" },
      { code: "NZ", name: "New Zealand" },
    ],
  },
  {
    region: "South America",
    countries: [
      { code: "BR", name: "Brazil" },
      { code: "AR", name: "Argentina" },
    ],
  },
  {
    region: "Africa",
    countries: [{ code: "ZA", name: "South Africa" }],
  },
] as const;

export const TIMEZONES = [
  {
    region: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern Time (New York)" },
      { value: "America/Chicago", label: "Central Time (Chicago)" },
      { value: "America/Denver", label: "Mountain Time (Denver)" },
      { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
      { value: "America/Toronto", label: "Toronto" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "America/Sao_Paulo", label: "Sao Paulo" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
      { value: "America/Mexico_City", label: "Mexico City" },
    ],
  },
  {
    region: "Europe",
    zones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris (CET)" },
      { value: "Europe/Berlin", label: "Berlin (CET)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
      { value: "Europe/Moscow", label: "Moscow" },
      { value: "Europe/Kiev", label: "Kyiv" },
    ],
  },
  {
    region: "Middle East",
    zones: [{ value: "Asia/Jerusalem", label: "Jerusalem (IST)" }],
  },
  {
    region: "Asia & Pacific",
    zones: [
      { value: "Australia/Sydney", label: "Sydney (AEST)" },
      { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    ],
  },
  {
    region: "Africa",
    zones: [{ value: "Africa/Johannesburg", label: "Johannesburg (SAST)" }],
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["countries"][number]["code"];

export function countryName(code: string): string {
  for (const group of COUNTRIES) {
    const found = group.countries.find((c) => c.code === code);
    if (found) return found.name;
  }
  return code;
}

export function timezonLabel(value: string): string {
  for (const group of TIMEZONES) {
    const found = group.zones.find((z) => z.value === value);
    if (found) return found.label;
  }
  return value.replace(/_/g, " ");
}
