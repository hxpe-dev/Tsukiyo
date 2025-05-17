import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Image, Dimensions} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {getChapterImages, isApiRateLimited} from '../api/mangadex';
import {RootStackParamList} from '../navigation/AppNavigator';
import {
  saveReadingProgress,
  saveChapterImagesLocally,
  getDownloadedChapter,
  isChapterDownloaded,
} from '../utils/storage';
import {WebView} from 'react-native-webview';
import RateLimitWarning from '../components/RateLimitWarning';
import ProgressBar from '../components/ProgressBar';
import {useTheme} from '../context/ThemeContext';
import PageLoading from '../components/PageLoading';
import {
  DEFAULT_NIGHT_MODE,
  DEFAULT_READER_ANIMATIONS,
  DEFAULT_WEBTOON_SEGMENT_HEIGHT,
  getNightMode,
  getNightModeBySchedule,
  getReaderAnimations,
  getWebtoonSegmentHeight,
} from '../utils/settingLoader';
import Dimmer from '../components/Dimmer';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MangaReader from '../components/MangaReader';
import WebtoonReader from '../components/WebtoonReader';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const screenHeight = Dimensions.get('window').height;
const headerHeight = 90;
const progressHeight = 5;

const ReaderScreen = () => {
  const insets = useSafeAreaInsets();
  const readerHeight =
    screenHeight - insets.top - insets.bottom - headerHeight - progressHeight;
  const route = useRoute<ReaderScreenRouteProp>();
  const {
    mangaId,
    mangaTitle,
    mangaLang,
    mangaCover,
    chapterId,
    chapters,
    page,
    externalUrl,
  } = route.params;
  const isExternal = !!externalUrl;

  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [activeChapterId, setActiveChapterId] = useState(chapterId);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(page || 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const shouldSetInitialPage = useRef(true);
  const enterFromPreviousChapter = useRef(false);
  const isWebtoon = useRef(false);
  const [rateLimited, setRateLimited] = useState(false);

  const currentChapter = chapters.find(ch => ch.id === activeChapterId);

  const [readerAnimationsEnabled, setReaderAnimationsEnabled] = useState(
    DEFAULT_READER_ANIMATIONS,
  );
  const [maxSegmentHeight, setMaxSegmentHeight] = useState(
    DEFAULT_WEBTOON_SEGMENT_HEIGHT,
  );
  const [nightMode, setNightMode] = useState(DEFAULT_NIGHT_MODE);
  useEffect(() => {
    if (isExternal) {
      return;
    }

    async function loadSetting() {
      setReaderAnimationsEnabled(await getReaderAnimations());
      setMaxSegmentHeight(await getWebtoonSegmentHeight());
      setNightMode((await getNightMode()) || (await getNightModeBySchedule()));
    }

    loadSetting();
  }, [isExternal]);

  const detectWebtoon = async (urls: string[]) => {
    const sampleCount = Math.min(5, urls.length);
    const aspectRatios: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      try {
        const imageInfo = await new Promise<{width: number; height: number}>(
          (resolve, reject) => {
            Image.getSize(
              urls[i],
              (width, height) => resolve({width, height}),
              reject,
            );
          },
        );

        const ratio = imageInfo.height / imageInfo.width;
        aspectRatios.push(ratio);
      } catch (err) {
        console.warn(`Failed to get image size for image ${i}`, err);
      }
    }

    // Fallback if all image loading fails
    if (aspectRatios.length === 0) {
      isWebtoon.current = false;
      return;
    }

    // Use average ratio for better judgment
    const averageRatio =
      aspectRatios.reduce((acc, val) => acc + val, 0) / aspectRatios.length;

    // Consider webtoon if average ratio is high enough
    isWebtoon.current = averageRatio > 2.2;
  };

  useEffect(() => {
    if (isExternal) {
      return;
    }

    const preloadNextChapterImages = async () => {
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }
      const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
      const nextChapter = chapters[currentIndex + 1];
      if (!nextChapter) {
        return;
      }

      const isDownloaded = await isChapterDownloaded(mangaId, nextChapter.id);
      if (isDownloaded) {
        return;
      }

      try {
        const nextUrls = await getChapterImages(nextChapter.id);
        await saveChapterImagesLocally(
          mangaId,
          mangaTitle,
          nextChapter.id,
          nextUrls,
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMITED') {
          setRateLimited(true);
        }
        console.warn('Failed to preload next chapter', err);
      }
    };

    const loadImages = async () => {
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let urls: string[] = [];

        const downloaded = await getDownloadedChapter(mangaId, activeChapterId);
        if (downloaded) {
          urls = downloaded.images;
        } else {
          const fetched = await getChapterImages(activeChapterId);
          urls = await saveChapterImagesLocally(
            mangaId,
            mangaTitle,
            activeChapterId,
            fetched,
          );
        }

        await detectWebtoon(urls);
        setImageUrls(urls);

        if (shouldSetInitialPage.current) {
          setCurrentPage(page || 0);
          shouldSetInitialPage.current = false;
        } else if (enterFromPreviousChapter.current) {
          setCurrentPage(urls.length - 1);
          enterFromPreviousChapter.current = false;
        } else {
          setCurrentPage(0);
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMITED') {
          setRateLimited(true);
        } else {
          console.error(err);
        }
        setError('Failed to load chapter images.');
      } finally {
        setLoading(false);
        preloadNextChapterImages();
      }
    };

    loadImages();
  }, [activeChapterId, chapters, isExternal, mangaId, mangaTitle, page]);

  useEffect(() => {
    if (isExternal) {
      return;
    }

    if (
      activeChapterId &&
      mangaId &&
      typeof currentPage === 'number' &&
      currentChapter
    ) {
      saveReadingProgress(
        mangaId,
        mangaTitle,
        mangaLang,
        mangaCover,
        activeChapterId,
        currentChapter.attributes.chapter as string,
        chapters,
        currentPage,
        externalUrl,
      );
    }
  }, [
    activeChapterId,
    chapters,
    currentChapter,
    currentPage,
    externalUrl,
    isExternal,
    mangaCover,
    mangaId,
    mangaLang,
    mangaTitle,
  ]);

  const goToNextChapter = () => {
    const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
    const nextChapter = chapters[currentIndex + 1];
    if (nextChapter) {
      shouldSetInitialPage.current = false;
      setActiveChapterId(nextChapter.id);
    }
  };

  const goToPreviousChapter = async () => {
    if (isApiRateLimited()) {
      setRateLimited(true);
      return;
    }
    const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
    const previousChapter = chapters[currentIndex - 1];
    if (previousChapter) {
      try {
        const urls = await getChapterImages(previousChapter.id);
        shouldSetInitialPage.current = false;
        enterFromPreviousChapter.current = true;
        setImageUrls(urls);
        setActiveChapterId(previousChapter.id);
        setCurrentPage(urls.length - 1);
      } catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMITED') {
          setRateLimited(true);
        } else {
          console.error('Failed to load previous chapter', err);
        }
      }
    }
  };

  ////////////////////////////////// IF EXTERNAL //////////////////////////////////
  if (externalUrl) {
    return (
      <WebView
        source={{uri: externalUrl}}
        style={styles.webview}
        onLoadEnd={() => {
          saveReadingProgress(
            mangaId,
            mangaTitle,
            mangaLang,
            mangaCover,
            activeChapterId,
            currentChapter?.attributes.chapter as string,
            chapters,
            currentPage,
            externalUrl,
          );
        }}
      />
    );
  }

  if (loading) {
    return (
      <PageLoading
        text={`Loading images for ${mangaTitle} chapter ${currentChapter?.attributes.chapter}...`}
      />
    );
  }

  if (error || imageUrls.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error ?? 'No images found for this chapter.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {nightMode && <Dimmer />}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.mangaName}>
            {mangaTitle}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.chapterInfo}>
            Chapter {currentChapter?.attributes.chapter} — Page{' '}
            {currentPage + 1} / {imageUrls.length}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          {nightMode ? (
            <Icon name="moon" size={24} color={theme.text} />
          ) : (
            <Icon name="sun" size={24} color={theme.text} />
          )}
        </View>
      </View>

      {isWebtoon.current ? (
        <WebtoonReader
          imageUrls={imageUrls}
          maxSegmentHeight={maxSegmentHeight}
          onPageChange={setCurrentPage}
          onNextChapter={goToNextChapter}
        />
      ) : (
        <MangaReader
          imageUrls={imageUrls}
          readerHeight={readerHeight}
          onPageChange={setCurrentPage}
          initialPage={currentPage}
          onNextChapter={goToNextChapter}
          onPreviousChapter={goToPreviousChapter}
          animations={readerAnimationsEnabled}
        />
      )}

      {!isWebtoon.current && (
        <ProgressBar
          height={progressHeight}
          currentPage={currentPage}
          totalPages={imageUrls.length}
        />
      )}
      {rateLimited && <RateLimitWarning />}
    </View>
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      height: headerHeight,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.header,
    },
    leftHeader: {
      width: '85%',
      justifyContent: 'center',
    },
    rightHeader: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    webview: {
      flex: 1,
    },
    mangaName: {
      fontSize: 18,
      color: theme.text,
      fontWeight: 'bold',
    },
    chapterInfo: {
      marginTop: 8,
      fontSize: 18,
      color: theme.text,
      fontWeight: 'normal',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: theme.error,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    nextChapterButtonWrapper: {
      alignItems: 'center',
      marginVertical: 20,
    },
    nextChapterButton: {
      backgroundColor: theme.button,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    nextChapterButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default ReaderScreen;
