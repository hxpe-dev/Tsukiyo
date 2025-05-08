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

const titleLanguagePriority = [
  'en',
  'ja-ro',
  'ja',
  'ko',
  'zh',
  'fr',
  'es',
  'de',
  'it',
  'pt',
  'ru',
  'id',
  'th',
];

export function getTitleFromItem(item: any): string {
  if (!item || !item.attributes || !item.attributes.title) {
    return 'No Title';
  }

  const titles = item.attributes.title;

  for (const lang of titleLanguagePriority) {
    if (titles[lang]) {
      return titles[lang];
    }
  }

  const fallback = Object.values(titles)[0];
  return typeof fallback === 'string' ? fallback : 'No Title';
}
