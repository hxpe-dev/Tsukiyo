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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import RateLimitWarning from '../components/RateLimitWarning';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../context/ThemeContext';
import PageLoading from '../components/PageLoading';
import {
  DEFAULT_MATURE_CONTENT,
  DEFAULT_VERTICAL_CARD_ANIMATIONS,
  getMatureContent,
  getVerticalCardAnimations,
} from '../utils/settingLoader';
import {Extension, UsableExtension} from '../types/extensions';
import {listInstalledExtensions, loadExtension} from '../utils/extensions';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const {width} = Dimensions.get('window');
const SEARCH_CARD_MARGIN = 24;
const SEARCH_CARD_SIZE = (width - SEARCH_CARD_MARGIN * 4) / 3;

export default function ExplorerScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [explorerSections, setExplorerSections] = useState<
    Record<string, Manga[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verticalCardAnimationsEnabled, setVerticalCardAnimationsEnabled] =
    useState(DEFAULT_VERTICAL_CARD_ANIMATIONS);
  const [matureContentEnabled, setMatureContentEnabled] = useState(
    DEFAULT_MATURE_CONTENT,
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [sources, setSources] = useState<Extension[]>([]);
  const [selectedSource, setSelectedSource] = useState<UsableExtension | null>(
    null,
  );

  useEffect(() => {
    async function loadSetting() {
      setVerticalCardAnimationsEnabled(await getVerticalCardAnimations());
      const matureContent = await getMatureContent();
      setMatureContentEnabled(matureContent);
    }
    const loadInstalledExtensions = async () => {
      const list = await listInstalledExtensions();
      setSources(list);
    };
    loadSetting();
    loadInstalledExtensions();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const loadMangas = async (source: UsableExtension | null) => {
    if (!source) {
      return;
    }
    console.log(matureContentEnabled);

    setLoading(true);
    setRateLimited(false);

    if (source.isApiRateLimited()) {
      setRateLimited(true);
      return;
    }

    try {
      const data = await source.explorer({
        limit: 15,
        matureContent: matureContentEnabled,
      });
      setExplorerSections(data);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        setRateLimited(true);
      } else {
        console.error('Failed to load explorer data:', error);
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
    loadMangas(selectedSource);
  };

  const handleSearch = async () => {
    if (!selectedSource) {
      return;
    }
    if (!searchQuery.trim()) {
      return;
    }
    if (selectedSource.isApiRateLimited()) {
      setRateLimited(true);
      return;
    }
    setHasSearched(true);
    setIsSearching(true);
    try {
      const results = await selectedSource.search(searchQuery.trim(), {
        limit: 30,
        matureContent: matureContentEnabled,
        order: {relevance: 'desc'},
      });
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
        navigation.navigate('Info', {source: selectedSource as UsableExtension, item});
      }
    },
    [navigation, selectedSource],
  );

  const selectSource = async (id: string) => {
    const ext = await loadExtension(id);
    setSelectedSource(ext);
    loadMangas(ext);
  };

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

  const renderSources = () => (
    <ScrollView contentContainerStyle={styles.sourcesContainer}>
      <Text style={styles.headerText}>Select a Source</Text>
      {sources.map(source => (
        <TouchableOpacity
          key={source.id}
          style={styles.sourceButton}
          onPress={() => selectSource(source.id)}>
          <Text style={styles.sourceButtonText}>{source.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <PageLoading
        text={`Loading ${selectedSource?.name}'s explorer page...`}
      />
    );
  }

  return (
    <View style={styles.container}>
      {!selectedSource ? (
        renderSources()
      ) : (
        <>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.button]} // Android spinner colors
                tintColor={theme.button} // iOS spinner color
                progressBackgroundColor={theme.elevatedBackground} // Android background
              />
            }
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {selectedSource.name} Explorer
              </Text>
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
              <>
                {Object.entries(explorerSections).map(([key, list]) =>
                  list.length > 0 ? (
                    <HorizontalListDisplayer
                      key={key}
                      title={key}
                      list={list}
                      onCardClick={handleNavigateToInfo}
                      onCardLongPress={handleNavigateToInfo}
                    />
                  ) : null,
                )}
              </>
            )}
          </ScrollView>
          {rateLimited && <RateLimitWarning />}
        </>
      )}
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
      backgroundColor: theme.elevatedBackground,
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
      color: theme.textSecondary,
    },
    grid: {
      paddingTop: 8,
      paddingBottom: 80,
    },
    row: {
      justifyContent: 'space-between',
    },
  });
