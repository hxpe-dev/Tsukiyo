import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs'; // if using file system for image storage
import { useTheme } from '../context/ThemeContext';

interface DownloadedChapter {
  id: string;
  name: string;
  imageCount: number;
  images: string[];
}

interface DownloadedManga {
  id: string;
  title: string;
  chapters: DownloadedChapter[];
}

export default function DownloadedManager() {
  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  const [downloadedData, setDownloadedData] = useState<DownloadedManga[]>([]);
  const [expandedMangaIds, setExpandedMangaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const data = await AsyncStorage.getItem('downloads');
    if (data) {
      setDownloadedData(JSON.parse(data));
    }
  };

  const toggleExpand = (mangaId: string) => {
    setExpandedMangaIds(prev => {
      const newSet = new Set(prev);
      newSet.has(mangaId) ? newSet.delete(mangaId) : newSet.add(mangaId);
      return newSet;
    });
  };

  const deleteManga = (mangaId: string) => {
    Alert.alert('Delete Manga', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newData = downloadedData.filter(m => m.id !== mangaId);
          await deleteAllImagesForManga(mangaId);
          await AsyncStorage.setItem('downloads', JSON.stringify(newData));
          setDownloadedData(newData);
        },
      },
    ]);
  };

  const deleteChapter = async (mangaId: string, chapterId: string) => {
    const newData = downloadedData.map(manga => {
      if (manga.id === mangaId) {
        return {
          ...manga,
          chapters: manga.chapters.filter(ch => ch.id !== chapterId),
        };
      }
      return manga;
    });
    await deleteImagesForChapter(mangaId, chapterId);
    await AsyncStorage.setItem('downloads', JSON.stringify(newData));
    setDownloadedData(newData);
  };

  const deleteImagesForChapter = async (mangaId: string, chapterId: string) => {
    const dir = `${RNFS.DocumentDirectoryPath}/downloads/${mangaId}/${chapterId}`;
    if (await RNFS.exists(dir)) {
      await RNFS.unlink(dir);
    }
  };

  const deleteAllImagesForManga = async (mangaId: string) => {
    const dir = `${RNFS.DocumentDirectoryPath}/downloads/${mangaId}`;
    if (await RNFS.exists(dir)) {
      await RNFS.unlink(dir);
    }
  };

  return (
    <FlatList
      data={downloadedData}
      keyExtractor={(manga) => manga.id}
      renderItem={({ item: manga }) => (
        <View style={styles.mangaContainer}>
          <View style={styles.mangaRow}>
            <TouchableOpacity onPress={() => toggleExpand(manga.id)} style={styles.flexRow}>
              <Text style={styles.mangaTitle}>{manga.title}</Text>
              <Icon
                name={expandedMangaIds.has(manga.id) ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#4f46e5"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteManga(manga.id)}>
              <Icon name="trash-2" size={20} color="red" />
            </TouchableOpacity>
          </View>

          {expandedMangaIds.has(manga.id) &&
            manga.chapters.map((chapter) => (
              <View key={chapter.id} style={styles.chapterRow}>
                <Text style={styles.chapterText}>
                  {chapter.name} ({chapter.imageCount})
                </Text>
                <TouchableOpacity onPress={() => deleteChapter(manga.id, chapter.id)}>
                  <Icon name="trash" size={18} color="red" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
    />
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    mangaContainer: {
      marginVertical: 8,
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 10,
      marginHorizontal: 16,
      elevation: 2,
    },
    mangaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mangaTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginRight: 8,
      color: theme.text,
    },
    chapterRow: {
      marginTop: 8,
      paddingLeft: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    chapterText: {
      fontSize: 16,
      color: theme.text,
    },
    flexRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
