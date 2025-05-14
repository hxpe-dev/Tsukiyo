import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {ReactNativeZoomableView} from '@openspacelabs/react-native-zoomable-view';
import {useTheme} from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

interface Props {
  imageUrls: string[];
  readerHeight: number;
  onPageChange: (page: number) => void;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  initialPage?: number;
  animations?: boolean;
}

const MangaReader: React.FC<Props> = ({
  imageUrls,
  readerHeight,
  onPageChange,
  onNextChapter,
  onPreviousChapter,
  initialPage = 0,
  animations = true,
}) => {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const translateX = useRef(
    new Animated.Value(-screenWidth * initialPage),
  ).current;
  const currentPageRef = useRef(initialPage);
  const [zoomLevel, setZoomLevel] = useState(1);

  const goToPage = (page: number) => {
    if (page < 0) {
      onPreviousChapter();
      return;
    }

    if (page >= imageUrls.length) {
      onNextChapter();
      return;
    }

    currentPageRef.current = page;
    const newValue = -screenWidth * page;

    if (animations) {
      Animated.spring(translateX, {
        toValue: newValue,
        bounciness: 0,
        speed: 20,
        overshootClamping: true,
        useNativeDriver: true,
      }).start();
    } else {
      translateX.setValue(newValue);
    }

    onPageChange(page);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20,
      onPanResponderRelease: (_, gesture) => {
        if (zoomLevel !== 1) {
          return;
        } // Don't swipe if zoomed in
        const page = currentPageRef.current;
        if (gesture.dx < -50 && page < imageUrls.length - 1) {
          goToPage(page + 1);
        } else if (gesture.dx > 50 && page > 0) {
          goToPage(page - 1);
        } else {
          goToPage(page);
        }
      },
    }),
  ).current;

  return (
    <View {...panResponder.panHandlers} style={styles.container}>
      <Animated.View
        style={[
          styles.imagesContainer,
          {
            width: screenWidth * imageUrls.length,
            height: readerHeight,
            transform: [{translateX}],
          },
        ]}>
        {imageUrls.map((uri, index) => (
          <View key={index} style={{width: screenWidth, height: readerHeight}}>
            {Math.abs(index - currentPageRef.current) <= 1 ? (
              <ReactNativeZoomableView
                maxZoom={3}
                minZoom={1}
                zoomStep={0.5}
                initialZoom={1}
                bindToBorders={true}
                doubleTapZoomToCenter
                onZoomAfter={(event, gestureState, viewObj) =>
                  setZoomLevel(viewObj.zoomLevel)
                }
                style={styles.flex1}>
                <View
                  style={styles.flex1}
                  onStartShouldSetResponder={() => zoomLevel === 1}
                  onResponderRelease={event => {
                    const x = event.nativeEvent.locationX;
                    if (x < screenWidth * 0.3) {
                      goToPage(currentPageRef.current - 1);
                    } else if (x > screenWidth * 0.7) {
                      goToPage(currentPageRef.current + 1);
                    }
                  }}>
                  <Image
                    source={{uri}}
                    style={[
                      styles.image,
                      {
                        height: readerHeight,
                      },
                    ]}
                    fadeDuration={0}
                  />
                </View>
              </ReactNativeZoomableView>
            ) : (
              <View style={styles.flex1} />
            )}
          </View>
        ))}
      </Animated.View>
      {zoomLevel !== 1 && (
        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomText}>{zoomLevel.toFixed(2)}x</Text>
        </View>
      )}
    </View>
  );
};

export default MangaReader;

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    imagesContainer: {
      flexDirection: 'row',
    },
    image: {
      width: screenWidth,
      resizeMode: 'contain',
    },
    flex1: {
      flex: 1,
    },
    zoomIndicator: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 8,
      borderRadius: 5,
    },
    zoomText: {
      color: theme.text,
      fontSize: 16,
    },
  });
