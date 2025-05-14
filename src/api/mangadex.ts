import AsyncStorage from '@react-native-async-storage/async-storage';
import {MangaProgress} from '../types/mangadex';
import {getLanguageName} from '../utils/languages';
import {isConnected} from '../utils/variables';
import {send} from '../utils/sendNotification';

const STORAGE_KEY = '@manga_progress';

const BASE_URL = 'https://api.mangadex.org';

let isRateLimited = false;
let rateLimitResetTime = 0;

export const isApiRateLimited = () => isRateLimited;

// Helper: Build query string safely for React Native
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  let query = '';
  if (params) {
    query = Object.entries(params)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(
            v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`,
          );
        } else if (typeof value === 'object' && value !== null) {
          return Object.entries(value).map(([nestedKey, nestedValue]) => {
            if (
              typeof nestedValue === 'string' ||
              typeof nestedValue === 'number' ||
              typeof nestedValue === 'boolean'
            ) {
              return `${encodeURIComponent(
                `${key}[${nestedKey}]`,
              )}=${encodeURIComponent(nestedValue)}`;
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
export const fetchFromApi = async (
  endpoint: string,
  params?: Record<string, any>,
  urlAddon = '',
) => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }

  const now = Date.now();
  if (isRateLimited && now < rateLimitResetTime) {
    throw new Error('RATE_LIMITED');
  }

  const url = buildUrl(endpoint, params);
  const response = await fetch(`${url}${urlAddon}`);

  if (response.status === 429) {
    console.warn('Rate limited. Blocking further requests for 60 seconds.');
    isRateLimited = true;
    rateLimitResetTime = Date.now() + 60 * 1000;
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const searchManga = async (
  title: string,
  limit = 10,
  plusEighteen = true,
  order: Record<string, 'asc' | 'desc'> = {relevance: 'desc'},
) => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }
  const data = await fetchFromApi(
    '/manga',
    {
      title,
      limit,
      order,
      contentRating: plusEighteen ? [] : ['safe', 'suggestive'],
      includes: ['cover_art'],
    },
    `?_=${Date.now()}`,
  );

  const mangaList = data.data;
  // For each manga, find cover id and fetch its file_name
  const enrichedMangaList = await Promise.all(
    mangaList.map(async (manga: any) => {
      const coverRel = manga.relationships?.find(
        (rel: any) => rel.type === 'cover_art',
      );

      if (!coverRel) {
        return manga;
      }

      try {
        const coverData = await fetchFromApi(`/cover/${coverRel.id}`);
        const fileName = coverData?.data?.attributes?.fileName;

        return {
          ...manga,
          coverFileName: fileName,
        };
      } catch (err) {
        console.error(`Failed to fetch cover for manga ID ${manga.id}`, err);
        return manga;
      }
    }),
  );
  return enrichedMangaList;
};

export const getMangaChapters = async (
  mangaId: string,
  language: string,
  page: number = 1,
  limit: number = 100,
) => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }
  const data = await fetchFromApi(`/manga/${mangaId}/feed`, {
    translatedLanguage: [language], // Empty array means all available languages
    order: {chapter: 'asc'},
    limit: limit, // Number of results per page
    offset: (page - 1) * limit, // Calculate offset based on page number
  });

  return data.data; // Array of chapter entries in all languages
};

export const getChapterImages = async (chapterId: string) => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }
  const data = await fetchFromApi(`/at-home/server/${chapterId}`);

  const {baseUrl, chapter} = data;
  const imageUrls = chapter.data.map(
    (filename: string) => `${baseUrl}/data/${chapter.hash}/${filename}`,
  );

  return imageUrls;
};

export const getLatestManga = async (
  limit: number = 10,
  plusEighteen = true,
) => {
  if (!isConnected) {
    return [];
  }
  try {
    return searchManga('', limit, plusEighteen, {
      latestUploadedChapter: 'desc',
    });
  } catch (error) {
    console.error('Error fetching latest manga', error);
    return [];
  }
};

export const getMostFollowedManga = async (
  limit: number = 10,
  plusEighteen = true,
) => {
  if (!isConnected) {
    return [];
  }
  try {
    return searchManga('', limit, plusEighteen, {
      followedCount: 'desc',
    });
  } catch (error) {
    console.error('Error fetching msot followed manga', error);
    return [];
  }
};

export const fetchCoverFileName = async (
  coverId: string,
): Promise<string | null> => {
  if (!isConnected) {
    return null;
  }
  try {
    const coverData = await fetchFromApi(`/cover/${coverId}`);
    return coverData.data?.attributes?.fileName || null;
  } catch (error) {
    console.error('Error fetching cover file name:', error);
    return null;
  }
};

export const getMangaById = async (mangaId: string) => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }
  const data = await fetchFromApi(`/manga/${mangaId}`, {
    includes: ['cover_art'],
  });

  const manga = data.data;

  const coverRel = manga.relationships?.find(
    (rel: any) => rel.type === 'cover_art',
  );

  if (!coverRel) {
    return manga;
  }

  try {
    const coverData = await fetchFromApi(`/cover/${coverRel.id}`);
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

export const checkForNewChapters = async () => {
  if (!isConnected) {
    throw new Error('NOT CONNECTED TO INTERNET');
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const progress: MangaProgress = JSON.parse(raw);
    const updatedProgress: MangaProgress = {...progress};

    for (const mangaId of Object.keys(progress)) {
      const entry = progress[mangaId];

      // If there's no chapter ID or last read, continue to next manga
      if (!entry.chapterId) {
        continue;
      }

      // Get the chapter number of the last read chapter
      const lastKnownChapterCount = entry.chapters.length;
      const isExternal = !!entry.externalUrl;

      // Get the most recently published chapter (English)
      const response = await fetchFromApi(`/manga/${mangaId}/feed`, {
        translatedLanguage: [entry.mangaLang],
        limit: 100,
        offset: lastKnownChapterCount,
        order: {publishAt: 'asc'},
      });

      const latests = response?.data;
      let latest = latests?.[0];

      for (var latestEntry of latests) {
        const hasExternalUrl = !!latestEntry.attributes.externalUrl;
        if (hasExternalUrl === isExternal) {
          latest = latestEntry;
          break;
        }
      }

      if (!latest) {
        continue;
      }

      const publishAt = latest.attributes?.publishAt;
      const latestChapterNum = latest.attributes?.chapter ?? '?';

      const hasNewerChapter =
        !entry.chapters[lastKnownChapterCount - 1].attributes.publishAt ||
        new Date(publishAt) >
          new Date(
            entry.chapters[lastKnownChapterCount - 1].attributes.publishAt,
          );

      if (hasNewerChapter) {
        // Send Notifee notification
        const language = getLanguageName(entry.mangaLang, true);
        send(
          `New Chapter: ${entry.mangaTitle}`,
          `Chapter ${latestChapterNum} is out in ${language}!`,
          'new-chapters',
          'notifications_icon',
        );

        // Update stored progress
        updatedProgress[mangaId] = {
          ...entry,
          chapters: [...entry.chapters, latest],
        };
      }
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
  } catch (err) {
    console.error('Failed to check for new chapters:', err);
  }
};
