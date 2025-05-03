import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MangaDownloads } from '../types/mangadex';

import {
  getAllDownloads,
  deleteDownloadedChapter,
  deleteDownloadedManga,
} from '../utils/storage'; // Adjust path based on your project structure

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [downloads, setDownloads] = useState<MangaDownloads>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const data = await getAllDownloads();
    setDownloads(data);
  };

  const toggleExpand = (mangaId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(mangaId) ? next.delete(mangaId) : next.add(mangaId);
      return next;
    });
  };

  const confirmDeleteManga = (mangaId: string) => {
    Alert.alert('Delete Manga', 'Are you sure you want to delete this manga and all its chapters?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteDownloadedManga(mangaId);
          setDownloads(updated);
        },
      },
    ]);
  };

  const handleDeleteChapter = async (mangaId: string, chapterId: string) => {
    const updated = await deleteDownloadedChapter(mangaId, chapterId);
    setDownloads(updated);
  };

  const renderMangaItem = (mangaId: string) => {
    const manga = downloads[mangaId]; // Get the entire manga data
    const mangaTitle = manga?.title || "Unknown Manga"; // Fallback if title is missing
    const chapters = manga ? manga : {};  // Ensure chapters are properly fetched

    return (
      <View key={mangaId} style={styles.mangaContainer}>
        <View style={styles.mangaRow}>
          <TouchableOpacity onPress={() => toggleExpand(mangaId)} style={styles.flexRow}>
            <Text style={styles.mangaTitle}>{mangaTitle}</Text>
            <Icon
              name={expanded.has(mangaId) ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#4f46e5"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDeleteManga(mangaId)}>
            <Icon name="trash-2" size={20} color="red" />
          </TouchableOpacity>
        </View>

        {expanded.has(mangaId) &&
          Object.entries(chapters).map(([chapterId, chapterImages]) => (
            chapterId !== 'title' && (
              <View key={chapterId} style={styles.chapterRow}>
                <Text style={styles.chapterText}>
                  {chapterId.slice(0, 5)}... ({chapterImages.length} images)
                </Text>
                <TouchableOpacity onPress={() => handleDeleteChapter(mangaId, chapterId)}>
                  <Icon name="trash" size={16} color="red" />
                </TouchableOpacity>
              </View>
            )
          ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: string }) => renderMangaItem(item);

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileText}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Manga Downloads Section */}
      <Text style={styles.mangaDownloadsText}>Manga Downloads</Text>
      <FlatList
        data={Object.keys(downloads)}
        keyExtractor={(item) => item}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  mangaDownloadsText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mangaContainer: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    elevation: 2,
  },
  mangaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mangaTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chapterRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 14,
    color: '#555',
  },
});
