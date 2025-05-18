export type Extension = {
  id: string;
  name: string;
  version?: string;
  filePath: string;
};

export type UsableExtension = {
  id: string;
  name: string;
  search: Function;
  explorer: Function;
  informations: Function;
  chapters: Function;
  reader: Function;
  isApiRateLimited: Function;
};
