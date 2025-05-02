import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getChapterImages } from '../api/mangadex';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveReadingProgress } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ReaderScreen = () => {
  const route = useRoute<ReaderScreenRouteProp>();
  const { mangaId, mangaTitle, mangaCover, chapters, page, externalUrl } = route.params;
  const isExternal = !!externalUrl;

  const initialChapterId = route.params.chapterId;

  const [activeChapterId, setActiveChapterId] = useState(initialChapterId);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(page || 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [showNextChapterButton, setShowNextChapterButton] = useState(false);
  const shouldSetInitialPage = useRef(true);
  const enterFromPreviousChapter = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const isWebtoon = useRef(false);

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

    const loadImages = async () => {
      setLoading(true);
      setError(null);
      setShowNextChapterButton(false);
      try {
        const urls = await getChapterImages(activeChapterId);
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
        setError('Failed to load chapter images.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [activeChapterId, isExternal, page]);

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

  useEffect(() => {
    if (isExternal) {return;}

    const preloadNextPageImage = async () => {
      if (currentPage < imageUrls.length - 1) {
        const nextImageUrl = imageUrls[currentPage + 1];
        if (!preloadedImages.has(nextImageUrl)) {
          try {
            await Image.prefetch(nextImageUrl);
            setPreloadedImages(prev => new Set(prev).add(nextImageUrl));
          } catch (err) {
            console.error('Failed to preload next image', err);
          }
        }
      }
    };

    if (!isWebtoon.current) {
      preloadNextPageImage();
    }
  }, [currentPage, imageUrls, isExternal, preloadedImages]);



  const goToNextChapter = () => {
    console.log('Go to next chapter called');
    const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
    const nextChapter = chapters[currentIndex + 1];
    if (nextChapter) {
      console.log('Went to next chapter');
      shouldSetInitialPage.current = false;
      setActiveChapterId(nextChapter.id);
    }
  };

  const goToPreviousChapter = async () => {
    console.log('Go to last chapter called');
    const currentIndex = chapters.findIndex(ch => ch.id === activeChapterId);
    const previousChapter = chapters[currentIndex - 1];
    if (previousChapter) {
      try {
        console.log('Went to last chapter');
        const urls = await getChapterImages(previousChapter.id);
        shouldSetInitialPage.current = false;
        enterFromPreviousChapter.current = true;
        setImageUrls(urls);
        setActiveChapterId(previousChapter.id);
        setCurrentPage(urls.length - 1);
      } catch (err) {
        console.error('Failed to load previous chapter', err);
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined) {
        // Updates the page so that the top bar follows
        setCurrentPage(index);
      }
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    if (isWebtoon.current) {
      return (
        <View>
          <Image
            source={{ uri: item }}
            style={styles.webtoonImage}
            resizeMode="contain"
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

    // Manga (horizontal paged with zoom)
    return (
      <ScrollView
        style={styles.zoomContainer}
        maximumZoomScale={3}
        minimumZoomScale={1}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.flex1}>
          <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
          {index < imageUrls.length - 1 && (
            <Image
              source={{ uri: imageUrls[index + 1] }}
              style={styles.hiddenImage}
              resizeMode="contain"
            />
          )}
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={!isWebtoon.current ? currentPage : undefined}
        getItemLayout={!isWebtoon.current ? (_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        }) : undefined}
        onEndReached={isWebtoon.current ? () => setShowNextChapterButton(true) : undefined}
        onEndReachedThreshold={0.9}
        removeClippedSubviews={true}  // Optional, to optimize rendering
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#111',
  },
  chapterInfo: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  webtoonImage: {
    width: screenWidth,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  nextChapterButtonWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },
  nextChapterButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextChapterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hiddenImage: {
    width: 1,
    height: 1,
    opacity: 0,
  },
  flex1: {
    flex: 1,
  },
});

export default ReaderScreen;
