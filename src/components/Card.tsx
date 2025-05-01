import React, { useState, useEffect, useRef } from 'react';
import { Text, Image, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Manga, MangaProgress } from '../types/mangadex';

interface CardProps {
  item: Manga | MangaProgress;
  isVisible: boolean;
  size: number;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  onClick: () => void;
  onLongPress: () => void;
}

const Card: React.FC<CardProps> = ({
  item,
  isVisible,
  size,
  paddingRight = 0,
  paddingLeft = 0,
  paddingTop = 0,
  paddingBottom = 0,
  onClick,
  onLongPress,
}) => {
  const animation = useState(new Animated.Value(0.3))[0];
  const wasVisible = useRef(false);
  const currentlyAnimatingCount = useRef(0);
  const MAX_ANIMATIONS = 6;

  useEffect(() => {
    if (isVisible && !wasVisible.current && currentlyAnimatingCount.current < MAX_ANIMATIONS) {
      wasVisible.current = true;
      currentlyAnimatingCount.current += 1;

      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        // friction: 9,
        // tension: 100,
        speed: 40,
        bounciness: 4,
        velocity: 6,
      }).start(() => {
        currentlyAnimatingCount.current -= 1;
      });
    } else if (!isVisible) {
      wasVisible.current = false;
      animation.setValue(0.5);
    } else if (isVisible && currentlyAnimatingCount.current >= MAX_ANIMATIONS) {
      animation.setValue(1);
      wasVisible.current = true;
    }
  }, [isVisible, animation]);

  const isManga = (obj: any): obj is Manga => 'attributes' in obj;
  const title = isManga(item) ? item.attributes.title.en : item.title;
  const cover = isManga(item)
    ? `https://uploads.mangadex.org/covers/${item.id}/${item.coverFileName}.512.jpg`
    : item.cover;

  const chapterInfo = !isManga(item)
    ? `Ch. ${item.chapterNum} • Pg. ${item.page + 1}`
    : null;

  const dynamicStyles = {
    itemContainer: {
      alignItems: 'center' as const,
      paddingRight,
      paddingLeft,
      paddingTop,
      paddingBottom,
    },
    image: {
      width: size,
      height: size * 1.5,
      borderRadius: 12,
    },
    title: {
      width: size,
      textAlign: 'left' as const,
      marginTop: 4,
    },
  };

  return (
    <TouchableOpacity
      onPress={onClick}
      onLongPress={onLongPress}
    >
      <Animated.View
        style={[
          dynamicStyles.itemContainer,
          {
            opacity: animation,
            transform: [{ scale: animation }],
          },
        ]}
      >
        <Image
          source={{ uri: cover }}
          style={dynamicStyles.image}
        />
        <Text numberOfLines={1} style={dynamicStyles.title}>
          {title}
        </Text>
        {chapterInfo && (
          <Text style={styles.chapterInfo} numberOfLines={1}>
            {chapterInfo}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default Card;

const styles = StyleSheet.create({
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  incrementButton: {
    marginLeft: 8,
    backgroundColor: '#d1d5db',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  incrementButtonText: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  chapterInfo: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'left',
    width: '100%',
    marginTop: 2,
  },
});
