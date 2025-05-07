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
import { useTheme } from '../context/ThemeContext';
import Share from 'react-native-share';

import {
  getAllDownloads,
  deleteDownloadedChapter,
  deleteDownloadedManga,
  getMangaFolderSize,
  formatBytes,
} from '../utils/storage'; // Adjust path based on your project structure

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  const [downloads, setDownloads] = useState<MangaDownloads>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<{ [mangaId: string]: number }>({});

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const data = await getAllDownloads();
    setDownloads(data);

    // Calculate sizes for each manga
    const sizeMap: { [mangaId: string]: number } = {};
    await Promise.all(
      Object.keys(data).map(async (mangaId) => {
        try {
          const size = await getMangaFolderSize(mangaId);
          sizeMap[mangaId] = size;
        } catch (err) {
          console.warn(`Error getting size for ${mangaId}:`, err);
          sizeMap[mangaId] = 0;
        }
      })
    );
    setSizes(sizeMap);
  };

  const shareImages = async (imageUris: string[]) => {
    try {
      const urls = imageUris.map((uri) => uri.startsWith('file://') ? uri : `file://${uri}`);

      const shareOptions = {
        urls,
        type: 'image/jpeg',
        failOnCancel: false,
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Failed to share images:', error);
      Alert.alert('Error', 'Could not share the images.');
    }
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
    const mangaTitle = manga?.title || 'Unknown Manga'; // Fallback if title is missing
    const chapters = manga ? manga : {};  // Ensure chapters are properly fetched

    return (
      <View key={mangaId} style={styles.mangaContainer}>
        <View style={styles.mangaRow}>
          <TouchableOpacity onPress={() => toggleExpand(mangaId)} style={styles.flexRow}>
            <Text style={styles.mangaTitle} numberOfLines={1} ellipsizeMode="tail">
              {mangaTitle}
              {sizes[mangaId] !== undefined && (
                <Text style={styles.fileSize}> • {formatBytes(sizes[mangaId])}</Text>
              )}
            </Text>
            <Icon
              name={expanded.has(mangaId) ? 'chevron-up' : 'chevron-down'}
              size={18}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDeleteManga(mangaId)}>
            <Icon name="trash-2" size={20} color="red" />
          </TouchableOpacity>
        </View>

        {expanded.has(mangaId) &&
          Object.entries(chapters).map(([chapterId, chapterImages]) => {
            if (chapterId === 'title') {return null;}

            const images = chapterImages as string[];
            console.log(images);

            return (
              <View key={chapterId} style={styles.chapterRow}>
                <Text style={styles.chapterText}>
                  {chapterId.slice(0, 5)}... ({images.length} images)
                </Text>
                <View style={styles.utilsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (images.length > 0) {
                        shareImages(images);
                      }
                    }}
                  >
                    <Icon name="share-2" size={16} color={theme.button} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteChapter(mangaId, chapterId)}>
                    <Icon name="trash" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
          <Icon name="settings" size={24} color={theme.button} />
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

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: theme.background,
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
      color: theme.text,
    },
    mangaDownloadsText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.text,
    },
    mangaContainer: {
      marginBottom: 15,
      backgroundColor: theme.elevatedBackground,
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
    utilsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    mangaTitle: {
      width: '86%',
      marginRight: 5,
      overflow: 'hidden',
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.text,
    },
    fileSize: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.text,
    },
    chapterRow: {
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chapterText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    chevronIcon: {
      marginLeft: 8,
      color: theme.button,
    },
  });
