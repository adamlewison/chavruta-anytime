export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  he: "Hebrew",
  yi: "Yiddish",
  fr: "French",
  es: "Spanish",
  ru: "Russian",
  ar: "Arabic",
  arc: "Aramaic",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.codePointAt(0)! + 127397));
}
