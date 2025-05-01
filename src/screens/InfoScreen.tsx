import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet, TouchableOpacity, FlatList, View, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMangaById, getMangaChapters } from '../api/mangadex';
import { Chapter, Manga } from '../types/mangadex';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type InfoScreenRouteProp = RouteProp<RootStackParamList, 'Info'>;

const InfoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InfoScreenRouteProp>();
  const { item } = route.params;

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMoreChapters, setHasMoreChapters] = useState<boolean>(true);

  const isManga = (obj: any): obj is Manga => 'attributes' in obj;

  useEffect(() => {
    const resolveManga = async () => {
      if (isManga(item)) {
        setManga(item);
      } else {
        try {
          const fullManga = await getMangaById(item.id);
          setManga(fullManga);
        } catch (error) {
          console.error('Failed to fetch full manga:', error);
        }
      }
    };

    resolveManga();
  }, [item]);

  useEffect(() => {
    if (!manga) {return;}
    const languages = manga.attributes.availableTranslatedLanguages;
    setAvailableLanguages(languages);
  }, [manga]);

  useEffect(() => {
    if (!manga) {return;}
    setChapters([]);
    setCurrentPage(1);
    setHasMoreChapters(true);
  }, [selectedLanguage, manga]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!manga || !hasMoreChapters || loading) {return;}

      setLoading(true);

      try {
        const fetchedChapters = await getMangaChapters(manga.id, selectedLanguage, currentPage);

        if (Array.isArray(fetchedChapters)) {
          const newChapters = fetchedChapters.filter(
            (newChapter) => !chapters.some((existing) => existing.id === newChapter.id)
          );

          if (newChapters.length > 0) {
            setChapters((prev) => [...prev, ...newChapters]);
            setCurrentPage((prev) => prev + 1);
          } else {
            setHasMoreChapters(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [manga, selectedLanguage, currentPage, hasMoreChapters, loading, chapters]);

  const handleStartReading = (chapterId?: string) => {
    if (chapterId && manga) {
      navigation.navigate('Reader', {
        mangaId: manga.id,
        mangaTitle: manga.attributes.title.en || 'No title',
        mangaCover: imageUrl,
        chapterId,
        chapters,
        page: 0,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity style={styles.chapterItem} onPress={() => handleStartReading(item.id)}>
      <Text style={styles.chapterTitle}>
        Chapter {item.attributes.chapter}: {item.attributes.title}
      </Text>
    </TouchableOpacity>
  );

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
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => handleStartReading(chapters[0]?.id)}
      >
        <Text style={styles.startButtonText}>Start Reading</Text>
      </TouchableOpacity>
      <Text style={styles.sectionHeader}>Chapters</Text>
    </View>
  );

  return (
    <FlatList
      data={chapters}
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
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
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chapterItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chapterTitle: {
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  languageScroller: {
    marginVertical: 12,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    alignItems: 'center',
  },
  selectedLanguageButton: {
    backgroundColor: '#6200ee',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#000',
  },
  selectedLanguageButtonText: {
    color: '#fff',
  },
});

export default InfoScreen;
