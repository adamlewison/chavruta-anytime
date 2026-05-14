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
