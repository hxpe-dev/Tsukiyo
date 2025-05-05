import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet, TouchableOpacity, FlatList, View, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMangaById, getMangaChapters, isApiRateLimited } from '../api/mangadex';
import { Chapter, Manga, MangaProgressEntry } from '../types/mangadex';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isChapterDownloaded, getReadingProgress } from '../utils/storage';
import Icon from 'react-native-vector-icons/Feather';
import RateLimitWarning from '../components/RateLimitWarning';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type InfoScreenRouteProp = RouteProp<RootStackParamList, 'Info'>;

const InfoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InfoScreenRouteProp>();
  const item = route.params.item;

  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mangadexChapters, setMangadexChapters] = useState<Chapter[]>([]);
  const [externalChapters, setExternalChapters] = useState<Chapter[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUrl, setSelectedUrl] = useState<string | null>('all');
  const [readingProgress, setReadingProgress] = useState<MangaProgressEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMoreChapters, setHasMoreChapters] = useState<boolean>(true);
  const [downloadedChapterIds, setDownloadedChapterIds] = useState<Set<string>>(new Set());
  const [rateLimited, setRateLimited] = useState(false);

  const isManga = (obj: any): obj is Manga => 'attributes' in obj;

  useEffect(() => {
    const resolveManga = async () => {
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }
      if (isManga(item)) {
        setManga(item);
      } else {
        try {
          const fullManga = await getMangaById(item.id);
          setManga(fullManga);
        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMITED') {
            setRateLimited(true);
          } else {
            console.error('Failed to fetch full manga:', error);
          }
        }
      }
    };

    resolveManga();
  }, [item]);

  useEffect(() => {
    if (!manga) {return;}
    const getMangaProgress = async () => {
      const mangaProgress = await getReadingProgress(manga.id);
      setReadingProgress(mangaProgress);
    };
    const languages = manga.attributes.availableTranslatedLanguages;
    setAvailableLanguages(languages);
    getMangaProgress();
  }, [manga]);

  useEffect(() => {
    if (!manga) {return;}
    setChapters([]);
    setMangadexChapters([]);
    setExternalChapters([]);
    setCurrentPage(1);
    setHasMoreChapters(true);
  }, [selectedLanguage, manga]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!manga || !hasMoreChapters || loading) {return;}
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }

      setLoading(true);

      try {
        const fetchedChapters = await getMangaChapters(manga.id, selectedLanguage, currentPage);

        if (Array.isArray(fetchedChapters)) {
          const newChapters = fetchedChapters.filter(
            (newChapter) => !chapters.some((existing) => existing.id === newChapter.id)
          );

          const mangadex = newChapters.filter(chapter => !chapter.attributes.externalUrl);
          const external = newChapters.filter(chapter => chapter.attributes.externalUrl);

          if (newChapters.length > 0) {
            setChapters((prev) => [...prev, ...newChapters]);
            setMangadexChapters((prev) => [...prev, ...mangadex]);
            setExternalChapters((prev) => [...prev, ...external]);
            setCurrentPage((prev) => prev + 1);

            // Check which chapters are downloaded
            const newDownloadedIds = new Set(downloadedChapterIds);
            await Promise.all(
              newChapters.map(async (chapter) => {
                const downloaded = await isChapterDownloaded(manga.id, chapter.id);
                if (downloaded) {newDownloadedIds.add(chapter.id);}
              })
            );
            setDownloadedChapterIds(newDownloadedIds);
          } else {
            setHasMoreChapters(false);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMITED') {
          setRateLimited(true);
        } else {
          console.error('Failed to fetch chapters:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [manga, selectedLanguage, currentPage, hasMoreChapters, loading, chapters, downloadedChapterIds]);

  const handleStartReading = (chapterId?: string, externalUrl?: string | null) => {
    if (chapterId && manga) {
      navigation.navigate('Reader', {
        mangaId: manga.id,
        mangaTitle: manga.attributes.title.en || 'No title',
        mangaCover: imageUrl || '',
        chapterId,
        chapters: selectedUrl === 'all' ? chapters : selectedUrl === 'mangadex' ? mangadexChapters : externalChapters,
        page: 0,
        externalUrl: externalUrl || null,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const renderChapterItem = ({ item }: { item: Chapter }) => {
    const isDownloaded = downloadedChapterIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.chapterItem}
        onPress={() => handleStartReading(item.id, item.attributes.externalUrl)}
      >
        <View style={styles.chapterRow}>
          <Text style={styles.chapterTitle}>
            Chapter {item.attributes.chapter || '?'} {item.attributes.title ? ': ' + item.attributes.title : ''}
            {item.attributes.externalUrl ? ' (External)' : ''}
          </Text>
          {isDownloaded && (
            <Icon name="check" size={24} color="#008000" style={styles.checkIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleEndReached = () => {
    if (!loading && hasMoreChapters) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (!manga) {
    // eslint-disable-next-line react-native/no-inline-styles
    return <Text style={{ padding: 16 }}>Loading manga info...</Text>;
  }

  const imageUrl = manga.coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.coverFileName}.512.jpg`
    : undefined;

  const renderHeader = () => (
    <View>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.coverImage} />}
      <Text style={styles.title}>{manga.attributes.title.en || 'No title'}</Text>
      <Text style={styles.label}>Status: {manga.attributes.status || 'Unknown'}</Text>
      <Text style={styles.label}>Year: {manga.attributes.year || 'N/A'}</Text>
      <Text style={styles.label}>Rating: {manga.attributes.contentRating || 'N/A'}</Text>
      <Text style={styles.description}>
        {manga.attributes.description.en || 'No description available.'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroller}>
        {availableLanguages.map((lang, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.languageButton,
              lang === selectedLanguage && styles.selectedLanguageButton,
            ]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <Text
              style={[
                styles.languageButtonText,
                lang === selectedLanguage && styles.selectedLanguageButtonText,
              ]}
            >
              {lang.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.urlScroller}>
        {chapters.length > 0 && (
          <TouchableOpacity
            style={[
              styles.urlButton,
              selectedUrl === 'all' && styles.selectedUrlButton,
            ]}
            onPress={() => setSelectedUrl('all')}
          >
            <Text style={[
              styles.urlButtonText,
              selectedUrl === 'all' && styles.selectedUrlButtonText,
            ]}>All</Text>
          </TouchableOpacity>
        )}
        {mangadexChapters.length > 0 && (
          <TouchableOpacity
            style={[
              styles.urlButton,
              selectedUrl === 'mangadex' && styles.selectedUrlButton,
            ]}
            onPress={() => setSelectedUrl('mangadex')}
          >
            <Text style={[
              styles.urlButtonText,
              selectedUrl === 'mangadex' && styles.selectedUrlButtonText,
            ]}>Mangadex</Text>
          </TouchableOpacity>
        )}
        {externalChapters.length > 0 && (
          <TouchableOpacity
            style={[
              styles.urlButton,
              selectedUrl === 'external' && styles.selectedUrlButton,
            ]}
            onPress={() => setSelectedUrl('external')}
          >
            <Text style={[
              styles.urlButtonText,
              selectedUrl === 'external' && styles.selectedUrlButtonText,
            ]}>External</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => {
          if (readingProgress?.chapterId) {
            navigation.navigate('Reader', {
              mangaId: manga.id,
              mangaTitle: readingProgress.mangaTitle,
              mangaCover: readingProgress.mangaCover,
              chapterId: readingProgress.chapterId,
              chapters: readingProgress.chapters,
              page: readingProgress.page,
              externalUrl: readingProgress.externalUrl || null,
            });
          } else {
            handleStartReading(chapters[0]?.id, chapters[0]?.attributes.externalUrl || null);
          }
        }}
      >
        <Text style={styles.startButtonText}>
          {readingProgress ? 'Continue Reading' : 'Start Reading'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.sectionHeader}>Chapters</Text>
      {rateLimited && <RateLimitWarning />}
    </View>
  );

  return (
    <FlatList
      data={selectedUrl === 'all' ? chapters : selectedUrl === 'mangadex' ? mangadexChapters : externalChapters}
      keyExtractor={(chapter) => `${chapter.id}-${selectedLanguage}`}
      renderItem={renderChapterItem}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.container}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <Text>Loading...</Text> : null}
    />
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.background,
    },
    coverImage: {
      width: '100%',
      height: 350,
      borderRadius: 10,
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.text,
    },
    label: {
      fontSize: 14,
      marginBottom: 6,
      color: theme.text,
    },
    description: {
      fontSize: 16,
      marginTop: 12,
      color: theme.text,
    },
    startButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 16,
      backgroundColor: theme.bigButton,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.buttonText,
    },
    chapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chapterItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    chapterTitle: {
      fontSize: 16,
      color: theme.text,
    },
    checkIcon: {
      marginLeft: 8,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
      color: theme.text,
    },
    languageScroller: {
      marginVertical: 12,
    },
    urlScroller: {
      marginVertical: 12,
    },
    languageButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 10,
      backgroundColor: theme.unselectedButton,
      borderRadius: 20,
      alignItems: 'center',
    },
    selectedLanguageButton: {
      backgroundColor: theme.button,
    },
    urlButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 10,
      backgroundColor: theme.unselectedButton,
      borderRadius: 20,
      alignItems: 'center',
    },
    selectedUrlButton: {
      backgroundColor: theme.button,
    },
    languageButtonText: {
      fontSize: 16,
      color: theme.text,
    },
    urlButtonText: {
      fontSize: 16,
      color: theme.text,
    },
    selectedLanguageButtonText: {
      color: theme.buttonText,
    },
    selectedUrlButtonText: {
      color: theme.buttonText,
    },
  });

export default InfoScreen;
