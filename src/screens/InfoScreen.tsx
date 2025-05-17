import React, {useEffect, useState} from 'react';
import {
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  View,
  ActivityIndicator,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {
  getChapterImages,
  getMangaById,
  getMangaChapters,
  isApiRateLimited,
} from '../api/mangadex';
import {Chapter, Manga, MangaProgressEntry} from '../types/mangadex';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  isChapterDownloaded,
  getReadingProgress,
  saveChapterImagesLocally,
} from '../utils/storage';
import Icon from 'react-native-vector-icons/Feather';
import RateLimitWarning from '../components/RateLimitWarning';
import {useTheme} from '../context/ThemeContext';
import {getTitleFromItem} from '../utils/languages';
import PageLoading from '../components/PageLoading';
import LinearGradient from 'react-native-linear-gradient';
import {getStatusText} from '../utils/statusAdaptor';
import Dropdown from '../components/Dropdown';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type InfoScreenRouteProp = RouteProp<RootStackParamList, 'Info'>;

const FlatListCellRenderer = ({style, ...props}: any) => (
  // eslint-disable-next-line react-native/no-inline-styles
  <View style={[style, {elevation: -1}]} {...props} />
);

const InfoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InfoScreenRouteProp>();
  const item = route.params.item;

  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mangadexChapters, setMangadexChapters] = useState<Chapter[]>([]);
  const [externalChapters, setExternalChapters] = useState<Chapter[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] =
    useState<MangaProgressEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMoreChapters, setHasMoreChapters] = useState<boolean>(true);
  const [downloadedChapterIds, setDownloadedChapterIds] = useState<Set<string>>(
    new Set(),
  );
  const [downloadingChapters, setDownloadingChapters] = useState<Set<string>>(
    new Set(),
  );
  const [rateLimited, setRateLimited] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
    if (!manga) {
      return;
    }
    const getMangaProgress = async () => {
      const mangaProgress = await getReadingProgress(manga.id);
      setReadingProgress(mangaProgress);
    };
    const languages = manga.attributes.availableTranslatedLanguages;
    setAvailableLanguages(languages);
    getMangaProgress();
  }, [manga]);

  useEffect(() => {
    if (!manga) {
      return;
    }
    setChapters([]);
    setMangadexChapters([]);
    setExternalChapters([]);
    setCurrentPage(1);
    setHasMoreChapters(true);
    setSelectedUrl(null);
  }, [selectedLanguage, manga]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!manga || !hasMoreChapters || loading) {
        return;
      }
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }

      setLoading(true);

      try {
        const fetchedChapters = await getMangaChapters(
          manga.id,
          selectedLanguage,
          currentPage,
        );

        if (Array.isArray(fetchedChapters)) {
          const newChapters = fetchedChapters.filter(
            newChapter =>
              !chapters.some(existing => existing.id === newChapter.id),
          );

          const mangadex = newChapters.filter(
            chapter => !chapter.attributes.externalUrl,
          );
          const external = newChapters.filter(
            chapter => chapter.attributes.externalUrl,
          );

          if (newChapters.length > 0) {
            setChapters(prev => [...prev, ...newChapters]);
            setMangadexChapters(prev => [...prev, ...mangadex]);
            setExternalChapters(prev => [...prev, ...external]);
            setCurrentPage(prev => prev + 1);

            // Automatically select the preferred chapter source
            setSelectedUrl(prev => {
              if (prev === 'mangadex' || prev === 'external') {
                return prev; // don't override if user already selected
              }
              if (mangadex.length > 0) {
                return 'mangadex';
              }
              if (external.length > 0) {
                return 'external';
              }
              return null;
            });

            // Check which chapters are downloaded
            const newDownloadedIds = new Set(downloadedChapterIds);
            await Promise.all(
              newChapters.map(async chapter => {
                const downloaded = await isChapterDownloaded(
                  manga.id,
                  chapter.id,
                );
                if (downloaded) {
                  newDownloadedIds.add(chapter.id);
                }
              }),
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
  }, [
    manga,
    selectedLanguage,
    currentPage,
    hasMoreChapters,
    loading,
    chapters,
    downloadedChapterIds,
  ]);

  const handleDownloadChapter = async (chapterId: string) => {
    if (!manga) {
      return;
    }
    setDownloadingChapters(prev => new Set(prev).add(chapterId));
    try {
      const fetched = await getChapterImages(chapterId);
      await saveChapterImagesLocally(
        manga.id,
        getTitleFromItem(manga),
        chapterId,
        fetched,
      );
      setDownloadedChapterIds(prev => new Set(prev).add(chapterId));
    } catch (error) {
      console.error(`Error downloading chapter ${chapterId}:`, error);
    } finally {
      setDownloadingChapters(prev => {
        const updated = new Set(prev);
        updated.delete(chapterId);
        return updated;
      });
    }
  };

  const getChapterData = () => {
    if (selectedUrl === 'mangadex') {
      return mangadexChapters;
    }
    if (selectedUrl === 'external') {
      return externalChapters;
    }
    return []; // fallback
  };

  const handleStartReading = (
    chapterId?: string,
    externalUrl?: string | null,
  ) => {
    if (chapterId && manga) {
      navigation.navigate('Reader', {
        mangaId: manga.id,
        mangaTitle: getTitleFromItem(manga),
        mangaLang: selectedLanguage,
        mangaCover: imageUrl || '',
        chapterId,
        chapters: getChapterData(),
        page: 0,
        externalUrl: externalUrl || null,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const renderChapterItem = ({item}: {item: Chapter}) => {
    const isDownloaded = downloadedChapterIds.has(item.id);
    const isDownloading = downloadingChapters.has(item.id);
    const isExternal = !!item.attributes.externalUrl;

    return (
      <View style={styles.chaptersContainer}>
        <TouchableOpacity
          style={styles.chapterItem}
          onPress={() =>
            handleStartReading(item.id, item.attributes.externalUrl)
          }>
          <View style={styles.chapterRow}>
            <Text
              style={styles.chapterTitle}
              numberOfLines={1}
              ellipsizeMode="tail">
              Chapter {item.attributes.chapter || '?'}{' '}
              {item.attributes.title ? ': ' + item.attributes.title : ''}
              {isExternal ? ' (External)' : ''}
            </Text>
            {!isExternal &&
              (isDownloaded ? (
                <Icon
                  name="check"
                  size={24}
                  color={theme.positive}
                  style={styles.utilIcon}
                />
              ) : isDownloading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.button}
                  style={styles.utilIcon}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => handleDownloadChapter(item.id)}>
                  <Icon
                    name="download"
                    size={24}
                    color={theme.button}
                    style={styles.utilIcon}
                  />
                </TouchableOpacity>
              ))}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleEndReached = () => {
    if (!loading && hasMoreChapters) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (!manga || hasMoreChapters) {
    return <PageLoading text={`${chapters.length} chapters found...`} />;
  }

  const imageUrl = manga.coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.coverFileName}.512.jpg`
    : undefined;

  const renderHeader = () => (
    <View>
      {imageUrl && (
        <View style={styles.coverContainer}>
          <Image source={{uri: imageUrl}} style={styles.coverImage} />
          <LinearGradient
            colors={['transparent', theme.background]}
            locations={[0, 0.7]}
            style={styles.gradientOverlay}>
            <Text style={styles.title}>{getTitleFromItem(manga)}</Text>
            <Text style={styles.label}>
              {getStatusText(manga.attributes.status)} •{' '}
              {manga.attributes.year || 'N/A'} •{' '}
              {manga.attributes.contentRating || 'N/A'}
            </Text>
          </LinearGradient>
        </View>
      )}
      <View style={styles.descriptionContainer}>
        <Text
          style={styles.description}
          numberOfLines={descriptionExpanded ? undefined : 3}
          ellipsizeMode="tail">
          {manga.attributes.description.en || 'No description available.'}
        </Text>
        {manga.attributes.description.en?.length > 200 && (
          <TouchableOpacity
            onPress={() => setDescriptionExpanded(prev => !prev)}>
            <Text style={styles.toggleDescription}>
              {descriptionExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.dropdownsRow}>
        <View style={styles.dropdownContainerLeft}>
          <Dropdown
            options={availableLanguages}
            selected={selectedLanguage}
            onSelect={setSelectedLanguage}
            placeholder="Language"
          />
        </View>
        <View style={styles.dropdownContainerRight}>
          <Dropdown
            options={['mangadex', 'external']}
            selected={selectedUrl ?? ''}
            onSelect={setSelectedUrl}
            placeholder="Source"
          />
        </View>
      </View>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            if (readingProgress?.chapterId) {
              navigation.navigate('Reader', {
                mangaId: manga.id,
                mangaTitle: readingProgress.mangaTitle,
                mangaLang: selectedLanguage,
                mangaCover: readingProgress.mangaCover,
                chapterId: readingProgress.chapterId,
                chapters: readingProgress.chapters,
                page: readingProgress.page,
                externalUrl: readingProgress.externalUrl || null,
              });
            } else {
              handleStartReading(
                chapters[0]?.id,
                chapters[0]?.attributes.externalUrl || null,
              );
            }
          }}>
          <Text style={styles.startButtonText}>
            {readingProgress ? 'Continue Reading' : 'Start Reading'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionHeader}>
        {getChapterData().length} Chapters
      </Text>
      {rateLimited && <RateLimitWarning />}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={getChapterData()}
      // eslint-disable-next-line @typescript-eslint/no-shadow
      keyExtractor={item => item.id}
      renderItem={renderChapterItem}
      ListHeaderComponent={renderHeader}
      CellRendererComponent={FlatListCellRenderer}
      removeClippedSubviews={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
    />
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
    },
    coverContainer: {
      position: 'relative',
      width: '100%',
      height: 400,
      marginBottom: 16,
    },
    coverImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    gradientOverlay: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingTop: 80,
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    label: {
      fontSize: 16,
      color: theme.text,
    },
    descriptionContainer: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    toggleDescription: {
      color: theme.button,
      marginTop: 8,
      fontWeight: 'bold',
    },
    description: {
      textAlign: 'justify',
      fontSize: 16,
      color: theme.text,
    },
    dropdownsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginVertical: 12,
    },
    dropdownContainerLeft: {
      flex: 1,
      marginRight: 8,
    },
    dropdownContainerRight: {
      flex: 1,
      marginLeft: 8,
    },
    startButtonContainer: {
      paddingHorizontal: 16,
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
    chaptersContainer: {
      paddingHorizontal: 16,
    },
    chapterItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    chapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chapterTitle: {
      fontSize: 16,
      color: theme.text,
      width: '88%',
    },
    utilIcon: {
      marginLeft: 8,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
      color: theme.text,
    },
  });

export default InfoScreen;
