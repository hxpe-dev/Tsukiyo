const languageMap: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  'zh-hk': 'Chinese (Hong Kong)',
  ko: 'Korean',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  es: 'Spanish (Castilian)',
  'es-la': 'Spanish (Latin American)',
  pt: 'Portuguese (Portugal)',
  'pt-br': 'Portuguese (Brazil)',
  pl: 'Polish',
  ru: 'Russian',
  ro: 'Romanian',
  hu: 'Hungarian',
  tr: 'Turkish',
  cs: 'Czech',
  bg: 'Bulgarian',
  th: 'Thai',
  vi: 'Vietnamese',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  ms: 'Malay',
  uk: 'Ukrainian',
  my: 'Burmese',
  id: 'Indonesian',
  tl: 'Filipino',
};

export function getLanguageName(
  code: string,
  lowercase: boolean = false,
): string {
  const language = languageMap[code.toLowerCase()];
  return language
    ? lowercase
      ? language.toLowerCase()
      : language
    : 'Unknown Language';
}
