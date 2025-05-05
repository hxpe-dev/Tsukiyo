export type Manga = {
  id: string;
  type: 'manga';
  coverFileName: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    lastChapter: string | null;
    availableTranslatedLanguages: string[];
    year?: number;
    contentRating?: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
    tags?: any[];
  };
  relationships?: Relationship[];
};

export type Chapter = {
  id: string;
  type: 'chapter';
  attributes: {
    chapter: string | null;
    title: string | null;
    pages: number;
    translatedLanguage: string;
    publishAt: string;
    language: string;
    externalUrl?: string | null;
  };
  relationships?: Relationship[];
};

export type ChapterImageResponse = {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[]; // filenames
    dataSaver: string[];
  };
};

export type CoverArt = {
  id: string;
  type: 'cover_art';
  attributes: {
    fileName: string;
  };
};

export type Relationship = {
  id: string;
  type: 'cover_art' | 'author' | 'artist' | 'manga';
  attributes?: {
    fileName?: string;
    name?: string;
  };
};

// Optional category grouping
export interface MangaEntry {
  manga: Manga;
  progress?: number;
}

export interface MangaCategory {
  name: string;
  entries: MangaEntry[];
  isCustomList: boolean;
}

export interface MangaProgress {
  [mangaId: string]: MangaProgressEntry;
}

export interface MangaProgressEntry {
  mangaTitle: string;
  mangaCover: string;
  chapterId: string;
  chapterNum: string;
  chapters: Chapter[];
  page: number;
  externalUrl?: string | null;
  lastRead?: string;
}

export interface MangaDownloadEntry {
  title: string;
  [chapterId: string]: string[] | string; // string[] for chapter images, string for 'title'
}

// All downloads
export interface MangaDownloads {
  [mangaId: string]: MangaDownloadEntry;
}
