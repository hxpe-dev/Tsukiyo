import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import HorizontalListDisplayer from '../components/HorizontalListDisplayer';
import Card from '../components/Card';
import {DisplayableManga, Manga} from '../types/mangadex';
import {getLatestManga, searchManga, isApiRateLimited} from '../api/mangadex';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import RateLimitWarning from '../components/RateLimitWarning';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../context/ThemeContext';
import PageLoading from '../components/PageLoading';
import {
  getPlusEighteen,
  getVerticalCardAnimations,
} from '../utils/settingLoader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');
const SEARCH_CARD_MARGIN = 24;
const SEARCH_CARD_SIZE = (width - SEARCH_CARD_MARGIN * 4) / 3;

export default function ExplorerScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [latestManga, setLatestManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verticalCardAnimationsEnabled, setVerticalCardAnimationsEnabled] =
    useState(true);
  const [plusEighteenEnabled, setPlusEighteenEnabled] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      setVerticalCardAnimationsEnabled(await getVerticalCardAnimations());
      const plusEighteen = await getPlusEighteen();
      setPlusEighteenEnabled(plusEighteen);
      loadLatestManga(plusEighteen);
    }

    loadSetting();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const loadLatestManga = async (plusEighteen: boolean = true) => {
    if (isApiRateLimited()) {
      setRateLimited(true);
      return;
    }
    setLoading(true);
    try {
      const mangaData = await getLatestManga(15, plusEighteen);
      setLatestManga(mangaData);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        setRateLimited(true);
      } else {
        console.error('Failed to fetch latest manga', error);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
    loadLatestManga(plusEighteenEnabled);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    if (isApiRateLimited()) {
      setRateLimited(true);
      return;
    }
    setHasSearched(true);
    setIsSearching(true);
    try {
      const results = await searchManga(
        searchQuery.trim(),
        30,
        plusEighteenEnabled,
      );
      setSearchResults(results);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        setRateLimited(true);
      } else {
        console.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateToInfo = useCallback(
    (item: DisplayableManga) => {
      if ('attributes' in item) {
        navigation.navigate('Info', {item});
      }
    },
    [navigation],
  );

  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const onViewableItemsChanged = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      setViewableItems(viewableItems);
    },
    [],
  );

  const visibleIdSet = useMemo(() => {
    const set = new Set<string>();
    viewableItems.forEach(vi => set.add(vi.item.id));
    return set;
  }, [viewableItems]);

  const renderSearchItem = useCallback(
    ({item, index}: {item: Manga; index: number}) => {
      const isVisible = verticalCardAnimationsEnabled
        ? visibleIdSet.has(item.id)
        : true;
      const paddingLeft =
        index % 3 === 0 ? SEARCH_CARD_MARGIN : SEARCH_CARD_MARGIN / 2;
      const paddingRight =
        (index + 1) % 3 === 0 ? SEARCH_CARD_MARGIN : SEARCH_CARD_MARGIN / 2;

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
    },
    [verticalCardAnimationsEnabled, handleNavigateToInfo, visibleIdSet],
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerText}>Manga Explorer</Text>
          <View style={styles.searchContainer}>
            {(isSearching || hasSearched) && (
              <TouchableOpacity
                onPress={handleCancelSearch}
                style={styles.cancelButton}>
                <Icon name="chevron-left" size={24} color={theme.button} />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.searchInput}
              placeholder="Search manga..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {isSearching ? (
          <ActivityIndicator
            // eslint-disable-next-line react-native/no-inline-styles
            style={{marginTop: 32}}
            size="small"
            color={theme.button}
          />
        ) : hasSearched ? (
          searchResults.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={searchResults}
              keyExtractor={item => item.id}
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
              viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noResultsText}>
              No results for your search.
            </Text>
          )
        ) : (
          latestManga.length > 0 && (
            <HorizontalListDisplayer
              title="Latests Mangas"
              list={latestManga}
              onCardClick={handleNavigateToInfo}
              onCardLongPress={handleNavigateToInfo}
            />
          )
        )}
      </ScrollView>
      {rateLimited && <RateLimitWarning />}
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 100,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      borderColor: theme.border,
      borderWidth: 1,
      color: theme.text,
      flex: 1,
    },
    cancelButton: {
      marginRight: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    noResultsText: {
      textAlign: 'center',
      marginTop: 32,
      fontSize: 16,
      color: theme.subtleText,
    },
    grid: {
      paddingTop: 8,
      paddingBottom: 80,
    },
    row: {
      justifyContent: 'space-between',
    },
  });
