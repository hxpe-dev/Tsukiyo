const BASE_URL = 'https://api.mangadex.org';

// Helper: Build query string safely for React Native
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  let query = '';
  if (params) {
    query = Object.entries(params)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
        } else if (typeof value === 'object' && value !== null) {
          return Object.entries(value).map(([nestedKey, nestedValue]) => {
            if (
              typeof nestedValue === 'string' ||
              typeof nestedValue === 'number' ||
              typeof nestedValue === 'boolean'
            ) {
              return `${encodeURIComponent(`${key}[${nestedKey}]`)}=${encodeURIComponent(nestedValue)}`;
            }
            return ''; // Or throw an error if unexpected type
          });
        } else {
          return [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`];
        }
      })
      .join('&');
  }
  return `${BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
}

// Generic fetch wrapper
export const fetchFromApi = async (endpoint: string, params?: Record<string, any>, urlAddon = '') => {
  const url = buildUrl(endpoint, params);
  const response = await fetch(`${url}${urlAddon}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// 🔍 Search manga by title
export const searchManga = async (title: string, limit = 10) => {
  const data = await fetchFromApi(
    '/manga',
    {
      title,
      limit,
      includes: ['cover_art'],
    },
    `?_=${Date.now()}`
  );

  const mangaList = data.data;
  // For each manga, find cover id and fetch its file_name
  const enrichedMangaList = await Promise.all(
    mangaList.map(async (manga: any) => {
      const coverRel = manga.relationships?.find(
        (rel: any) => rel.type === 'cover_art'
      );

      if (!coverRel) {return manga;}

      try {
        const coverRes = await fetch(`${BASE_URL}/cover/${coverRel.id}`);
        const coverData = await coverRes.json();
        const fileName = coverData?.data?.attributes?.fileName;

        return {
          ...manga,
          coverFileName: fileName,
        };
      } catch (err) {
        console.error(`Failed to fetch cover for manga ID ${manga.id}`, err);
        return manga;
      }
    })
  );
  return enrichedMangaList;
};

// 📖 Get chapters for a specific manga
export const getMangaChapters = async (mangaId: string, language: string, page: number = 1, limit: number = 100) => {
  const data = await fetchFromApi(`/manga/${mangaId}/feed`, {
    translatedLanguage: [language], // Empty array means all available languages
    order: { chapter: 'asc' },
    limit: limit, // Number of results per page
    offset: (page - 1) * limit, // Calculate offset based on page number
  });

  return data.data; // Array of chapter entries in all languages
};

// 🖼️ Get page image URLs for a chapter
export const getChapterImages = async (chapterId: string) => {
  const response = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch images: ${response.status}`);
  }

  const data = await response.json();
  const { baseUrl, chapter } = data;

  const imageUrls = chapter.data.map(
    (filename: string) => `${baseUrl}/data/${chapter.hash}/${filename}`
  );

  return imageUrls;
};

export const getLatestManga = async () => {
  try {
    return searchManga('', 30);
  } catch (error) {
    console.error('Error fetching trending manga', error);
    return [];
  }
};

export const fetchCoverFileName = async (coverId: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/cover/${coverId}`);
    const json = await response.json();
    return json.data?.attributes?.fileName || null;
  } catch (error) {
    console.error('Error fetching cover file name:', error);
    return null;
  }
};

// 📘 Get full manga by ID (including coverFileName)
export const getMangaById = async (mangaId: string) => {
  const data = await fetchFromApi(`/manga/${mangaId}`, {
    includes: ['cover_art'],
  });

  const manga = data.data;

  const coverRel = manga.relationships?.find(
    (rel: any) => rel.type === 'cover_art'
  );

  if (!coverRel) {return manga;}

  try {
    const coverRes = await fetch(`${BASE_URL}/cover/${coverRel.id}`);
    const coverData = await coverRes.json();
    const fileName = coverData?.data?.attributes?.fileName;

    return {
      ...manga,
      coverFileName: fileName,
    };
  } catch (err) {
    console.error(`Failed to fetch cover for manga ID ${manga.id}`, err);
    return manga;
  }
};
