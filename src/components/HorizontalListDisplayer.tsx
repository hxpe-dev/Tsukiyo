import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { DisplayableManga } from '../types/mangadex';
import Card from './Card';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  title: string;
  list: DisplayableManga[];
  onCardClick: (item: DisplayableManga) => void;
  onCardLongPress: (item: DisplayableManga) => void;
}

export default function HorizontalListDisplayer({ title, list, onCardClick, onCardLongPress }: Props) {
  const [viewableItems, setViewableItems] = useState<any[]>([]); // Store visible items
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('horizontal_card_animations').then((val) => {
      if (val !== null) {setAnimationsEnabled(val === 'true');}
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems) {
      setViewableItems(viewableItems); // Update only if viewableItems is not undefined
    }
  };

  const visibleIdSet = useMemo(() => {
    const set = new Set<string>();
    viewableItems.forEach((vi) => set.add(vi.item.id)); // Manga IDs are strings
    return set;
  }, [viewableItems]);

  const renderItem = useCallback(({ item, index }: any) => {
    const isVisible = animationsEnabled ? visibleIdSet.has(item.id) : true;
    const paddingLeft = index === 0 ? 16 : 8;
    const paddingRight = index === list.length - 1 ? 16 : 8;

    return (
      <Card
        item={item}
        isVisible={isVisible}
        size={100}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        onClick={() => onCardClick(item)}
        onLongPress={() => onCardLongPress(item)}
      />
    );
  }, [animationsEnabled, list.length, onCardClick, onCardLongPress, visibleIdSet]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <FlatList
        data={list}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        // PERFORMANCE SETTINGS START
        initialNumToRender={4} // render only x items initially
        maxToRenderPerBatch={4} // render x more every batch
        windowSize={3} // smaller window keeps memory usage low
        removeClippedSubviews={true} // important on Android
        // PERFORMANCE SETTINGS END
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingLeft: 16,
  },
});
