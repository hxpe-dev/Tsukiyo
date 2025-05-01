import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getChapterImages } from '../api/mangadex';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveReadingProgress } from '../utils/storage';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const ReaderScreen = () => {
  const route = useRoute<ReaderScreenRouteProp>();
  const { mangaId, mangaTitle, mangaCover, chapterId, chapters, page } = route.params;
  const currentChapter = chapters.find(chapter => chapter.id === chapterId);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (chapterId && mangaId && typeof currentPage === 'number') {
      saveReadingProgress(mangaId, mangaTitle, mangaCover, chapterId, currentChapter.attributes.chapter as string, chapters, currentPage);
    }
  }, [chapterId, chapters, currentChapter, currentPage, mangaCover, mangaId, mangaTitle]);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const urls = await getChapterImages(chapterId);
        setImageUrls(urls);
        setCurrentPage(page); // Start at the first page
      } catch (err) {
        setError('Failed to load chapter images.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [chapterId, page]);

  const goToNextPage = () => {
    if (currentPage < imageUrls.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleImagePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;

    if (locationX > screenWidth / 2) {
      goToNextPage();
    } else {
      goToPreviousPage();
    }
  };

  useEffect(() => {
    // Preload the next page image
    const preloadNextPageImage = async () => {
      if (currentPage < imageUrls.length - 1) {
        const nextImageUrl = imageUrls[currentPage + 1];
        if (!preloadedImages.has(nextImageUrl)) {
          try {
            await Image.prefetch(nextImageUrl);
            setPreloadedImages(prev => new Set(prev).add(nextImageUrl)); // Mark as preloaded
          } catch (err) {
            console.error('Failed to preload next image', err);
          }
        }
      }
    };

    preloadNextPageImage(); // Preload the next page image
  }, [currentPage, imageUrls, preloadedImages]);

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

      <Pressable style={styles.touchZone} onPress={handleImagePress}>
        <ScrollView
          contentContainerStyle={styles.imageContainer}
          maximumZoomScale={3}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: imageUrls[currentPage] }}
            style={styles.image}
            resizeMode="contain"
          />
        </ScrollView>
      </Pressable>
    </View>
  );
};

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    paddingBottom: 10,
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
  imageContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  image: {
    width: '100%',
    height: screenHeight * 0.8,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  touchZone: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default ReaderScreen;
