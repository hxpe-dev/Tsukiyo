import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HorizontalListDisplayer from '../components/HorizontalListDisplayer';
import Card from '../components/Card';
import { Manga } from '../types/mangadex';
import { getLatestManga, searchManga } from '../api/mangadex';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const SEARCH_CARD_MARGIN = 24;
const SEARCH_CARD_SIZE = (width - SEARCH_CARD_MARGIN * 4) / 3;

export default function ExplorerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [latestManga, setLatestManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verticalCardAnimationsEnabled, setVerticalCardAnimationsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('vertical_card_animations').then((val) => {
      if (val !== null) {setVerticalCardAnimationsEnabled(val === 'true');}
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadTrendingManga();
  }, []);

  const loadTrendingManga = async () => {
    setLoading(true);
    try {
      const mangaData = await getLatestManga();
      setLatestManga(mangaData);
    } catch (error) {
      console.error('Failed to fetch trending manga', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setSearchResults([]);
    setSearchQuery('');
    loadTrendingManga();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {return;}
    setIsSearching(true);
    try {
      const results = await searchManga(searchQuery.trim(), 100);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateToInfo = useCallback((item: Manga) => {
    navigation.navigate('Info', { item });
  }, [navigation]);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    setViewableItems(viewableItems);
  }, []);

  const visibleIdSet = useMemo(() => {
    const set = new Set<string>();
    viewableItems.forEach((vi) => set.add(vi.item.id));
    return set;
  }, [viewableItems]);

  const renderSearchItem = useCallback(({ item, index }: { item: Manga; index: number }) => {
    const isVisible = verticalCardAnimationsEnabled ? visibleIdSet.has(item.id) : true;
    const paddingLeft = index % 3 === 0 ? SEARCH_CARD_MARGIN : SEARCH_CARD_MARGIN / 2;
    const paddingRight = (index + 1) % 3 === 0 ? SEARCH_CARD_MARGIN : SEARCH_CARD_MARGIN / 2;

    return (
      <Card
        item={item}
        isVisible={isVisible}
        size={SEARCH_CARD_SIZE}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        paddingTop={SEARCH_CARD_MARGIN / 2}
        paddingBottom={SEARCH_CARD_MARGIN / 2}
        onClick={() => handleNavigateToInfo(item)}
        onLongPress={() => handleNavigateToInfo(item)}
      />
    );
  }, [verticalCardAnimationsEnabled, handleNavigateToInfo, visibleIdSet]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Manga Explorer</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search manga..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {isSearching ? (
          // eslint-disable-next-line react-native/no-inline-styles
          <ActivityIndicator style={{ marginTop: 32 }} size="small" color="#4f46e5" />
        ) : searchResults.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={searchResults}
            keyExtractor={(item) => item.id}
            numColumns={3}
            // PERFORMANCE SETTINGS START
            initialNumToRender={12} // render only x items initially
            maxToRenderPerBatch={12} // render x more every batch
            windowSize={6} // smaller window keeps memory usage low
            removeClippedSubviews={true} // important on Android
            // PERFORMANCE SETTINGS END
            renderItem={renderSearchItem}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
            scrollEnabled={false}
          />
        ) : (
          <>
            {latestManga.length > 0 && (
              <HorizontalListDisplayer
                title="Latests Mangas"
                list={latestManga}
                onCardClick={handleNavigateToInfo}
                onCardLongPress={handleNavigateToInfo}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  grid: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
  },
});
