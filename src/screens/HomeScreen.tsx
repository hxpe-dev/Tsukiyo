import React, {useCallback, useState} from 'react';
import {Text, ScrollView, StyleSheet, RefreshControl} from 'react-native';
import HorizontalListDisplayer from '../components/HorizontalListDisplayer';
import {DisplayableManga, Manga, MangaProgressItem} from '../types/mangadex';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {getAllReadingProgress, removeReadingProgress} from '../utils/storage';
import MangaOptionsModal from '../components/MangaOptionsModal';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useTheme} from '../context/ThemeContext';
import PageLoading from '../components/PageLoading';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentlyReadingList, setCurrentlyReadingList] = useState<
    MangaProgressItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedManga, setSelectedManga] = useState<MangaProgressItem | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const loadData = async () => {
    setLoading(true);
    try {
      const readingMangas: MangaProgressItem[] = await getAllReadingProgress();
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
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleNavigateToReader = (item: DisplayableManga) => {
    if ('chapterId' in item) {
      navigation.navigate('Reader', {
        mangaId: item.id,
        mangaTitle: item.title,
        mangaLang: item.lang,
        mangaCover: item.cover,
        chapterId: item.chapterId,
        chapters: item.chapters,
        page: item.page,
        externalUrl: item.externalUrl,
      });
    }
  };

  const handleNavigateToInfo = (item: Manga | MangaProgressItem) => {
    navigation.navigate('Info', {item});
  };

  const handleCardLongPress = (item: DisplayableManga) => {
    if ('chapterId' in item) {
      setSelectedManga(item);
      setIsModalVisible(true);
    }
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
      style={styles.scrollView}
      contentContainerStyle={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.button]} // Android spinner colors
          tintColor={theme.button} // iOS spinner color
          progressBackgroundColor={theme.elevatedBackground} // Android background
        />
      }>
      <Text style={styles.title}>Tsukiyo</Text>
      {loading ? (
        <PageLoading />
      ) : (
        <>
          {currentlyReadingList.length > 0 ? (
            <HorizontalListDisplayer
              title="Currently Reading"
              list={currentlyReadingList}
              onCardClick={handleNavigateToReader}
              onCardLongPress={handleCardLongPress}
            />
          ) : (
            <Text style={styles.noReadingMangasText}>
              No currently reading mangas.
            </Text>
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

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 16,
      paddingLeft: 16,
      color: theme.text,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: 32,
    },
    noMangaTextContainer: {
      marginTop: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    noReadingMangasText: {
      color: theme.textSecondary,
      marginTop: 32,
      fontSize: 16,
      width: '100%',
      textAlign: 'center',
    },
  });
