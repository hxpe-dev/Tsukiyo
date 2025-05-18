import RNFS from 'react-native-fs';
import { Extension, UsableExtension } from '../types/extensions';
import { deleteDownloadedManga, getAllDownloads, getAllReadingProgress, removeReadingProgress } from './storage';

const EXTENSIONS_DIR = `${RNFS.DocumentDirectoryPath}/extensions`;
const EXTENSIONS_STORE = `${EXTENSIONS_DIR}/installed.json`;

export async function ensureExtensionsDir(): Promise<void> {
  const exists = await RNFS.exists(EXTENSIONS_DIR);
  if (!exists) {
    await RNFS.mkdir(EXTENSIONS_DIR);
  }
}

export async function listInstalledExtensions(): Promise<Extension[]> {
  try {
    await ensureExtensionsDir();
    const exists = await RNFS.exists(EXTENSIONS_STORE);
    if (!exists) {return [];}
    const raw = await RNFS.readFile(EXTENSIONS_STORE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to list installed extensions:', error);
    return [];
  }
}

export async function saveInstalledExtensions(extensions: Extension[]): Promise<void> {
  await RNFS.writeFile(
    EXTENSIONS_STORE,
    JSON.stringify(extensions, null, 2),
    'utf8',
  );
}

export async function clearExtensions(): Promise<void> {
  const exists = await RNFS.exists(EXTENSIONS_DIR);
  if (exists) {
    const files = await RNFS.readDir(EXTENSIONS_DIR);
    for (const file of files) {
      await RNFS.unlink(file.path);
    }
    await RNFS.mkdir(EXTENSIONS_DIR);
  }
}

export async function deleteExtension(id: string): Promise<void> {
  const exists = await RNFS.exists(EXTENSIONS_STORE);
  if (!exists) {return;}
  const raw = await RNFS.readFile(EXTENSIONS_STORE, 'utf8');
  const extensions: Extension[] = JSON.parse(raw);

  const extension = extensions.find(ext => ext.id === id);
  if (!extension) {return;}

  // Step 1: Delete the extension file
  try {
    const fileExists = await RNFS.exists(extension.filePath);
    if (fileExists) {
      await RNFS.unlink(extension.filePath);
    }
  } catch (err) {
    console.warn(`Failed to delete extension file: ${extension.filePath}`, err);
  }

  // Step 2: Remove the extension from installed list and save
  const updatedExtensions = extensions.filter(ext => ext.id !== id);
  await saveInstalledExtensions(updatedExtensions);

  // Step 3: Remove reading progress linked to this extension's sourceId
  const allProgress = await getAllReadingProgress();
  const progressToDelete = allProgress.filter(p => p.sourceId === id);

  for (const entry of progressToDelete) {
    await removeReadingProgress(entry.id);
  }

  // Step 4: Remove downloaded chapters linked to this extension's sourceId
  const allDownloads = await getAllDownloads();
  for (const mangaId of Object.keys(allDownloads)) {
    const downloadEntry = allDownloads[mangaId];
    if (downloadEntry && downloadEntry.sourceId === id) {
      await deleteDownloadedManga(mangaId);
    }
  }
}

export async function getExtensionById(id: string): Promise<Extension | undefined> {
  const extensions = await listInstalledExtensions();
  return extensions.find(ext => ext.id === id);
}

export async function loadExtension(id: string): Promise<UsableExtension | null> {
  const extById = await getExtensionById(id);
  if (!extById) {return null;}

  const code = await RNFS.readFile(extById.filePath, 'utf8');

  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function('module', 'exports', code);
    const exports: any = {};
    const module = { exports };
    factory(module, exports);

    const ext = (globalThis as any).extension;

    const returnFormat: UsableExtension = {
      id: ext.id,
      name: ext.name,
      search: ext.search,
      explorer: ext.explorer,
      informations: ext.informations,
      chapters: ext.chapters,
      reader: ext.reader,
      isApiRateLimited: ext.isApiRateLimited,
    };

    return returnFormat;
  } catch (err) {
    console.error('Failed to load extension from string:', err);
    return null;
  }
}
