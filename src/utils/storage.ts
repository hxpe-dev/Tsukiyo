import AsyncStorage from '@react-native-async-storage/async-storage';
import { MangaProgress, Chapter } from '../types/mangadex';

// const MANGA_PLANNING_KEY = '@manga_planning'; // Static key for manga list
const MANGA_PROGRESS_KEY = '@manga_progress'; // For reading progression

type ReadingProgress = {
  [mangaId: string]: {
    chapterId: string;
    page: number;
  };
};

// export const saveMangaList = async (mangaList: any[]) => {
//   try {
//     const jsonValue = JSON.stringify(mangaList);
//     await AsyncStorage.setItem(mangaIdMANGA_PLANNING_KEY, jsonValue);
//   } catch (e) {
//     console.error('Error saving manga list', e);
//   }
// };

// export const loadMangaListFromStorage = async () => {
//   try {
//     const jsonValue = await AsyncStorage.getItem(mangaIdMANGA_PLANNING_KEY);
//     return jsonValue != null ? JSON.parse(jsonValue) : [];
//   } catch (e) {
//     console.error('Error loading manga list', e);
//     return [];
//   }
// };

// export const updateMangaList = async (updatedMangaList: any[]) => {
//   try {
//     const jsonValue = JSON.stringify(updatedMangaList);
//     await AsyncStorage.setItem(mangaIdMANGA_PLANNING_KEY, jsonValue);
//   } catch (e) {
//     console.error('Error updating manga list', e);
//   }
// };

export const saveReadingProgress = async (
  mangaId: string,
  mangaTitle: string,
  mangaCover: string,
  chapterId: string,
  chapterNum: string,
  chapters: Chapter[],
  page: number
) => {
  try {
    const raw = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
    const progressMap: ReadingProgress = raw ? JSON.parse(raw) : {};

    progressMap[mangaId] = { mangaTitle, mangaCover, chapterId, chapterNum, chapters, page, lastRead: new Date().toISOString() };

    await AsyncStorage.setItem(MANGA_PROGRESS_KEY, JSON.stringify(progressMap));
  } catch (e) {
    console.error('Error saving reading progress', e);
  }
};

export const getReadingProgress = async (
  mangaId: string
): Promise<{ chapterId: string; page: number } | null> => {
  try {
    const raw = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
    const progressMap: ReadingProgress = raw ? JSON.parse(raw) : {};
    return progressMap[mangaId] || null;
  } catch (e) {
    console.error('Error loading reading progress', e);
    return null;
  }
};

export const getAllReadingProgress = async (): Promise<Manga[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@manga_progress');
    if (!jsonValue) {return [];}

    const progress = JSON.parse(jsonValue); // { mangaId: { mangaTitle, mangaCover, chapterId, page }, ... }

    const mangaList: MangaProgress[] = Object.entries(progress).map(([id, entry]: any) => ({
      id,
      title: entry.mangaTitle,
      cover: entry.mangaCover,
      chapterId: entry.chapterId,
      chapterNum: entry.chapterNum,
      chapters: entry.chapters,
      page: entry.page,
      lastRead: entry.lastRead || null,
    }));

    mangaList.sort((a, b) => {
      const dateA = a.lastRead ? new Date(a.lastRead).getTime() : 0;
      const dateB = b.lastRead ? new Date(b.lastRead).getTime() : 0;
      return dateB - dateA;
    });

    return mangaList;
  } catch (e) {
    console.error('Error getting reading progress:', e);
    return [];
  }
};
