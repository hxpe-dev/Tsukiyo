export type Manga = {
  id: string;
  type: 'manga';
  coverFileName: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    lastChapter: string | null;
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
    language: string
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

export type MangaProgress = {
  id: string;
  title: string;
  cover: string;
  chapterId: string;
  chapterNum: string;
  chapters: Chapter[];
  page: number;
  externalUrl: string | null;
  lastRead?: string;
};

export type MangaDownloads = {
  [mangaId: string]: {
    title: string;  // Added manga title
    [chapterId: string]: string[]; // Array of local file paths
  };
};
