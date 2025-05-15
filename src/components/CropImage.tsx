import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import ImageSize from 'react-native-image-size';

const screenWidth = Dimensions.get('window').width;

interface CropImageProps {
  uri: string;
  maxSegmentHeight: number;
}

const CropImage: React.FC<CropImageProps> = ({uri, maxSegmentHeight}) => {
  const [croppedUris, setCroppedUris] = useState<string[] | null>(null);
  const [croppedUrisHeight, setCroppedUrisHeight] = useState<number[]>([
    maxSegmentHeight,
  ]);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const {width, height} = await ImageSize.getSize(uri);
        const scaleFactor = screenWidth / width;
        const numSegments = Math.ceil(height / maxSegmentHeight);

        const segments: string[] = [];
        const segmentsHeight: number[] = [];

        for (let i = 0; i < numSegments; i++) {
          const top = i * maxSegmentHeight;
          const segmentHeight = Math.min(maxSegmentHeight, height - top);

          const cropData = {
            offset: {x: 0, y: top},
            size: {width, height: segmentHeight},
          };

          try {
            const croppedResult = await ImageEditor.cropImage(uri, cropData);
            segments.push(croppedResult.uri);
            segmentsHeight.push(segmentHeight * scaleFactor);
          } catch (error) {
            console.error('Cropping error', error);
          }
        }

        setCroppedUris(segments);
        setCroppedUrisHeight(segmentsHeight);
      } catch (err) {
        console.error('Failed to get actual image size:', err);
      }
    };

    loadImage();
  }, [maxSegmentHeight, uri]);

  if (!croppedUris) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View>
      {croppedUris.map((segmentUri, index) => {
        const segmentHeight = croppedUrisHeight[index];
        return (
          <Image
            key={index}
            source={{uri: segmentUri}}
            style={[styles.imageSegment, {height: segmentHeight}]}
            // fadeDuration={0}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSegment: {
    width: screenWidth,
    resizeMode: 'contain',
  },
});

export default CropImage;
