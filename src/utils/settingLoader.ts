import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getVerticalCardAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('vertical_card_animations');
  return val === 'true';
}

export async function getHorizontalCardAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('horizontal_card_animations');
  return val === 'true';
}

export async function getPlusEighteen(): Promise<boolean> {
  const val = await AsyncStorage.getItem('plus_eighteen');
  return val === 'true';
}

export async function getReaderAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('reader_animations');
  return val === 'true';
}

export async function getReaderOffset(): Promise<number> {
  const val = await AsyncStorage.getItem('reader_offset');
  return parseInt(val ?? '0', 10);
}

export async function getWebtoonSegmentHeight(): Promise<number> {
  const val = await AsyncStorage.getItem('webtoon_segment_height');
  return parseInt(val ?? '1000', 10);
}

export async function getNewChapterCheckFrequency(): Promise<number> {
  const val = await AsyncStorage.getItem('new_chapter_check_frequency');
  return parseInt(val ?? '180', 10);
}
