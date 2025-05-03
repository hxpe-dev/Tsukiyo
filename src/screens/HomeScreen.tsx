import React, { useCallback, useState } from 'react';
import {
  Text,
  ScrollView,
  View,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import HorizontalListDisplayer from '../components/HorizontalListDisplayer';
import { MangaProgress } from '../types/mangadex';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  // loadMangaListFromStorage,
  getAllReadingProgress,
  removeReadingProgress,
} from '../utils/storage';
import MangaOptionsModal from '../components/MangaOptionsModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  // const [planningList, setPlanningList] = useState<Manga[]>([]);
  const [currentlyReadingList, setCurrentlyReadingList] = useState<MangaProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedManga, setSelectedManga] = useState<MangaProgress | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // const planningMangas: Manga[] = await loadMangaListFromStorage();
      const readingMangas: MangaProgress[] = await getAllReadingProgress();

      // setPlanningList(planningMangas);
      setCurrentlyReadingList(readingMangas);
    } catch (error) {
      console.error('Error loading manga data', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleNavigateToReader = (item: MangaProgress) => {
    navigation.navigate('Reader', { mangaId: item.id, mangaTitle: item.title, mangaCover: item.cover, chapterId: item.chapterId, chapters: item.chapters, page: item.page, externalUrl: item.externalUrl });
  };

  const handleNavigateToInfo = (item: Manga | MangaProgress) => {
    navigation.navigate('Info', { item });
  };

  const handleCardLongPress = (item: MangaProgress) => {
    setSelectedManga(item);
    setIsModalVisible(true);
  };

  const handleContinueReading = () => {
    if (selectedManga) {
      handleNavigateToReader(selectedManga);
      setIsModalVisible(false);
    }
  };

  const handleOpenInfo = () => {
    if (selectedManga) {
      handleNavigateToInfo(selectedManga);
      setIsModalVisible(false);
    }
  };

  const handleRemoveFromReading = async () => {
    if (selectedManga) {
      await removeReadingProgress(selectedManga.id);
      loadData();
      setIsModalVisible(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollView}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>
        Tsukiyo
      </Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <>
          {currentlyReadingList.length > 0 && (
            <HorizontalListDisplayer
              title="Currently Reading"
              list={currentlyReadingList}
              onCardClick={handleNavigateToReader}
              onCardLongPress={handleCardLongPress}
            />
          )}
        </>
      )}
      <MangaOptionsModal
        visible={isModalVisible}
        manga={selectedManga}
        onClose={() => setIsModalVisible(false)}
        onContinue={handleContinueReading}
        onInfo={handleOpenInfo}
        onRemove={handleRemoveFromReading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    paddingLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    backgroundColor: '#f2f2f2',
    paddingBottom: 32,
  },
  noMangaTextContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});
