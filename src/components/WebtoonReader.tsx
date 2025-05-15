import React, {useRef, useState} from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import CropImage from './CropImage';
import {useTheme} from '../context/ThemeContext';

type Props = {
  imageUrls: string[];
  maxSegmentHeight: number;
  onPageChange: (page: number) => void;
  onNextChapter: () => void;
};

const WebtoonReader: React.FC<Props> = ({
  imageUrls,
  maxSegmentHeight,
  onPageChange,
  onNextChapter,
}) => {
  const [showNextChapterButton, setShowNextChapterButton] = useState(false);
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined) {
        onPageChange(index);
      }
    }
  }).current;

  const renderItem = ({item, index}: {item: string; index: number}) => (
    <View>
      <CropImage uri={item} maxSegmentHeight={maxSegmentHeight} />
      {index === imageUrls.length - 1 && showNextChapterButton && (
        <View style={styles.nextChapterButtonWrapper}>
          <TouchableOpacity
            onPress={onNextChapter}
            style={styles.nextChapterButton}>
            <Text style={styles.nextChapterButtonText}>Next Chapter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={imageUrls}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item}-${index}`}
      key={'webtoon'}
      horizontal={false}
      pagingEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={true}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{viewAreaCoveragePercentThreshold: 0}}
      onEndReached={() => setShowNextChapterButton(true)}
      onEndReachedThreshold={0.9}
      removeClippedSubviews={Platform.OS === 'android'}
      scrollEventThrottle={16}
      initialNumToRender={5}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={2}
    />
  );
};

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
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
  });

export default WebtoonReader;
