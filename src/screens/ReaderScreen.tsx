import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getChapterImages, isApiRateLimited } from '../api/mangadex';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveReadingProgress, saveChapterImagesLocally, getDownloadedChapter, isChapterDownloaded } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import RateLimitWarning from '../components/RateLimitWarning';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../context/ThemeContext';
import PageLoading from '../components/PageLoading';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const headerHeight = 90;
const progressHeight = 5;
const securityValue = 1; // margin top of the image container and security value in reader height too
const readerHeight = screenHeight - headerHeight - progressHeight - (2 * securityValue); // we do 2 times securityValue, to remove the marginTop and the value at the bottom.

const ReaderScreen = () => {
  const route = useRoute<ReaderScreenRouteProp>();
  const { mangaId, mangaTitle, mangaCover, chapterId, chapters, page, externalUrl } = route.params;
  const isExternal = !!externalUrl;

  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  const [activeChapterId, setActiveChapterId] = useState(chapterId);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(page || 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNextChapterButton, setShowNextChapterButton] = useState(false);
  const shouldSetInitialPage = useRef(true);
  const enterFromPreviousChapter = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const isWebtoon = useRef(false);
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number; height: number } }>({});
  const [rateLimited, setRateLimited] = useState(false);

  const currentChapter = chapters.find(ch => ch.id === activeChapterId);

  const [readerAnimationsEnabled, setReaderAnimationsEnabled] = useState(true);
  useEffect(() => {
    if (isExternal) {return;}

    AsyncStorage.getItem('reader_animations').then((val) => {
      if (val !== null) {setReaderAnimationsEnabled(val === 'true');}
    });
  }, [isExternal]);

  const detectWebtoon = async (urls: string[]) => {
    try {
      const firstImage = urls[0];
      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(firstImage, (width, height) => resolve({ width, height }), reject);
      });
      isWebtoon.current = imageInfo.height / imageInfo.width > 2.2; // heuristic threshold
    } catch (err) {
      console.error('Failed to detect image size for webtoon detection', err);
      isWebtoon.current = false; // fallback
    }
  };

  useEffect(() => {
    if (isExternal) {return;}

    const preloadNextChapterImages = async () => {
      if (isApiRateLimited()) {
        setRateLimited(true);
        return;
      }
      const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
      const nextChapter = chapters[currentIndex + 1];
      if (!nextChapter) {return;}

      const isDownloaded = await isChapterDownloaded(mangaId, nextChapter.id);
      if (isDownloaded) {return;}

      try {
        const nextUrls = await getChapterImages(nextChapter.id);
        await saveChapterImagesLocally(mangaId, mangaTitle, nextChapter.id, nextUrls);
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
      setShowNextChapterButton(false);
      try {
        let urls: string[] = [];

        const downloaded = await getDownloadedChapter(mangaId, activeChapterId);
        if (downloaded) {
          urls = downloaded.images;
        } else {
          const fetched = await getChapterImages(activeChapterId);
          urls = await saveChapterImagesLocally(mangaId, mangaTitle, activeChapterId, fetched);
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

        preloadNextChapterImages();
      } catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMITED') {
          setRateLimited(true);
        } else {
          console.error(err);
        }
        setError('Failed to load chapter images.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [activeChapterId, chapters, isExternal, mangaId, mangaTitle, page]);

  useEffect(() => {
    if (isExternal) {return;}

    if (activeChapterId && mangaId && typeof currentPage === 'number' && currentChapter) {
      saveReadingProgress(
        mangaId,
        mangaTitle,
        mangaCover,
        activeChapterId,
        currentChapter.attributes.chapter as string,
        chapters,
        currentPage,
        externalUrl,
      );
    }
  }, [activeChapterId, chapters, currentChapter, currentPage, externalUrl, isExternal, mangaCover, mangaId, mangaTitle]);

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

  const loadImageDimensions = (uri: string) => {
    Image.getSize(uri, (width, height) => {
      setImageDimensions((prev) => ({
        ...prev,
        [uri]: { width, height },
      }));
    });
  };

  useEffect(() => {
    imageUrls.forEach((uri) => loadImageDimensions(uri));
  }, [imageUrls]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined) {
        // Updates the page so that the top bar follows
        setCurrentPage(index);
      }
    }
  }).current;

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    if (isWebtoon.current) {
      const dimensions = imageDimensions[item];
      if (!dimensions) {return null;} // Skip rendering until the dimensions are loaded

      const aspectRatio = dimensions.height / dimensions.width;
      const scaledHeight = aspectRatio * screenWidth + 1;

      return (
        <View>
          <Image
            source={{ uri: item }}
            style={{
              width: screenWidth,
              height: scaledHeight,
            }}
            resizeMode="contain"
            resizeMethod="auto"
          />
          {index === imageUrls.length - 1 && showNextChapterButton && (
            <View style={styles.nextChapterButtonWrapper}>
              <TouchableOpacity onPress={goToNextChapter} style={styles.nextChapterButton}>
                <Text style={styles.nextChapterButtonText}>Next Chapter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    const handleTap = (event: any) => {
      const tapX = event.nativeEvent.locationX;
      if (tapX < screenWidth / 3) {
        if (index > 0) {
          flatListRef.current?.scrollToIndex({ index: index - 1, animated: readerAnimationsEnabled });
        } else {
          goToPreviousChapter();
        }
      } else if (tapX > (screenWidth * 2) / 3) {
        if (index < imageUrls.length - 1) {
          flatListRef.current?.scrollToIndex({ index: index + 1, animated: readerAnimationsEnabled });
        } else {
          goToNextChapter();
        }
      }
    };

    const dynamicStyles = {
      image: {
        width: screenWidth,
        height: readerHeight,
        // aspectRatio:
        //   imageDimensions[item]?.width && imageDimensions[item]?.height
        //     ? imageDimensions[item].width / imageDimensions[item].height
        //     : 0.7, // fallback
      },
    };

    // const dimensions = imageDimensions[item];

    // let imageStyle = {
    //   width: screenWidth,
    //   height: readerHeight,
    // };

    // if (dimensions.height > readerHeight) {
    //   imageStyle = {
    //     height: readerHeigh
    //   }
    // }


    // Manga (horizontal paged with zoom)
    return (
      <ScrollView
        style={styles.zoomContainer}
        maximumZoomScale={3}
        minimumZoomScale={1}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.flex1}>
          <View style={styles.centeredImageWrapper}>
            <Image
              source={{ uri: item }}
              style={dynamicStyles.image}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  ////////////////////////////////// IF EXTERNAL //////////////////////////////////
  if (externalUrl) {
    return (
      <WebView
        source={{ uri: externalUrl }}
        onLoadEnd={() => {
          saveReadingProgress(
            mangaId,
            mangaTitle,
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
      <PageLoading/>
    );
  }

  if (error || imageUrls.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No images found for this chapter.'}</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mangaName}>
          {mangaTitle}
        </Text>
        <Text style={styles.chapterInfo}>
          Chapter {currentChapter?.attributes.chapter} — Page {currentPage + 1} / {imageUrls.length}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={imageUrls}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        key={isWebtoon.current ? 'webtoon' : 'manga'}
        horizontal={!isWebtoon.current}
        pagingEnabled={!isWebtoon.current}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={isWebtoon.current}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
        initialScrollIndex={!isWebtoon.current ? currentPage : undefined}
        getItemLayout={!isWebtoon.current ? (_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        }) : undefined}
        onEndReached={isWebtoon.current ? () => setShowNextChapterButton(true) : undefined}
        onEndReachedThreshold={0.9}
        // PERFORMANCE SETTINGS START
        removeClippedSubviews={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        updateCellsBatchingPeriod={5}
        // PERFORMANCE SETTINGS END
      />
      {!isWebtoon.current && (
        <ProgressBar
          height={progressHeight}
          currentPage={currentPage}
          totalPages={imageUrls.length}
          onPressPage={(pageIndex) => {
            setCurrentPage(pageIndex);
            if (!isWebtoon.current) {
              flatListRef.current?.scrollToIndex({ index: pageIndex, animated: readerAnimationsEnabled });
            }
          }}
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
      height: headerHeight,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.header,
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
    centeredImageWrapper: {
      marginTop: securityValue,
      height: readerHeight,
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
    zoomContainer: {
      width: screenWidth,
      height: screenHeight,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
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
    flex1: {
      flex: 1,
    },
  });

export default ReaderScreen;
