import AsyncStorage from '@react-native-async-storage/async-storage';
import { MangaProgress, MangaDownloads, Chapter, MangaProgressEntry } from '../types/mangadex';
import RNFS from 'react-native-fs';

// const MANGA_PLANNING_KEY = '@manga_planning'; // Static key for manga list
const MANGA_PROGRESS_KEY = '@manga_progress'; // For reading progression
const MANGA_DOWNLOADS_KEY = '@manga_downloads';

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
  page: number,
  externalUrl?: string | null,
) => {
  try {
    const raw = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
    const progressMap: MangaProgress = raw ? JSON.parse(raw) : {};

    progressMap[mangaId] = { mangaTitle, mangaCover, chapterId, chapterNum, chapters, page, externalUrl, lastRead: new Date().toISOString() };

    await AsyncStorage.setItem(MANGA_PROGRESS_KEY, JSON.stringify(progressMap));
  } catch (e) {
    console.error('Error saving reading progress', e);
  }
};

export const getReadingProgress = async (
  mangaId: string
): Promise<MangaProgressEntry | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
    const progress: MangaProgress = jsonValue ? JSON.parse(jsonValue) : {};
    console.log('getting reading progress');
    return progress[mangaId] || null;
  } catch (e) {
    console.error('Error loading reading progress', e);
    return null;
  }
};

export const getAllReadingProgress = async (): Promise<MangaProgress[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
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
      externalUrl: entry.externalUrl,
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

export const removeReadingProgress = async (mangaId: string): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(MANGA_PROGRESS_KEY);
    if (!raw) {return;}

    const progressMap = JSON.parse(raw);
    if (progressMap[mangaId]) {
      delete progressMap[mangaId];
      await AsyncStorage.setItem(MANGA_PROGRESS_KEY, JSON.stringify(progressMap));
    }
  } catch (e) {
    console.error('Error removing manga progress', e);
  }
};

export const saveChapterImagesLocally = async (
  mangaId: string,
  mangaTitle: string,
  chapterId: string,
  imageUrls: string[],
): Promise<string[]> => {
  const localPaths: string[] = [];

  const dirPath = `${RNFS.DocumentDirectoryPath}/manga/${mangaId}/${chapterId}`;
  await RNFS.mkdir(dirPath); // Make sure the folder exists

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const filename = `page_${i}.jpg`;
    const filePath = `${dirPath}/${filename}`;

    try {
      const result = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: filePath,
      }).promise;

      if (result.statusCode === 200) {
        localPaths.push('file://' + filePath);
      } else {
        console.warn(`Failed to download image ${i}: status ${result.statusCode}`);
      }
    } catch (e) {
      console.error(`Failed to download image ${i}`, e);
    }
  }

  const raw = await AsyncStorage.getItem(MANGA_DOWNLOADS_KEY);
  const allDownloads: MangaDownloads = raw ? JSON.parse(raw) : {};

  if (!allDownloads[mangaId]) {
    allDownloads[mangaId] = { title: mangaTitle }; // Store the manga title
  }

  allDownloads[mangaId][chapterId] = localPaths; // Store local paths for chapter images

  await AsyncStorage.setItem(MANGA_DOWNLOADS_KEY, JSON.stringify(allDownloads));

  return localPaths;
};

export const getDownloadedChapter = async (
  mangaId: string,
  chapterId: string
): Promise<{ title: string, images: string[] } | null> => {
  const raw = await AsyncStorage.getItem(MANGA_DOWNLOADS_KEY);
  const allDownloads: MangaDownloads = raw ? JSON.parse(raw) : {};

  const chapterData = allDownloads[mangaId];
  if (!chapterData) {return null;}

  const chapter = chapterData[chapterId];
  if (!Array.isArray(chapter)) {return null;}

  return {
    title: chapterData.title,
    images: chapter,
  };
};

export const isChapterDownloaded = async (
  mangaId: string,
  chapterId: string
): Promise<boolean> => {
  const chapter = await getDownloadedChapter(mangaId, chapterId);
  return chapter ? (chapter.images.length > 0) : false;
};

export const getAllDownloads = async (): Promise<MangaDownloads> => {
  try {
    const raw = await AsyncStorage.getItem(MANGA_DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load downloads', e);
    return {};
  }
};

export const deleteDownloadedChapter = async (
  mangaId: string,
  chapterId: string
): Promise<MangaDownloads> => {
  try {
    const path = `${RNFS.DocumentDirectoryPath}/manga/${mangaId}/${chapterId}`;
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }

    const raw = await AsyncStorage.getItem(MANGA_DOWNLOADS_KEY);
    const downloads: MangaDownloads = raw ? JSON.parse(raw) : {};

    if (downloads[mangaId]) {
      delete downloads[mangaId][chapterId];

      if (Object.keys(downloads[mangaId]).length === 0) {
        delete downloads[mangaId];
      }

      await AsyncStorage.setItem(MANGA_DOWNLOADS_KEY, JSON.stringify(downloads));
    }

    return downloads;
  } catch (e) {
    console.error('Error deleting chapter', e);
    return {};
  }
};

export const deleteDownloadedManga = async (
  mangaId: string
): Promise<MangaDownloads> => {
  try {
    const path = `${RNFS.DocumentDirectoryPath}/manga/${mangaId}`;
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }

    const raw = await AsyncStorage.getItem(MANGA_DOWNLOADS_KEY);
    const downloads: MangaDownloads = raw ? JSON.parse(raw) : {};
    delete downloads[mangaId];

    await AsyncStorage.setItem(MANGA_DOWNLOADS_KEY, JSON.stringify(downloads));
    return downloads;
  } catch (e) {
    console.error('Error deleting manga', e);
    return {};
  }
};

const getFolderSize = async (path: string): Promise<number> => {
  let totalSize = 0;
  const cleanPath = path.replace(/\/+/g, '/');

  try {
    const items = await RNFS.readDir(cleanPath);
    for (const item of items) {
      if (item.isFile()) {
        totalSize += item.size;
      } else if (item.isDirectory()) {
        const folderSize = await getFolderSize(item.path);
        totalSize += folderSize;
      }
    }
  } catch (e) {
    console.warn(`Failed to get size of ${cleanPath}`, e);
  }

  return totalSize;
};

export const getMangaFolderSize = async (mangaId: string): Promise<number> => {
  return getFolderSize(`${RNFS.DocumentDirectoryPath}/manga/${mangaId}`);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
