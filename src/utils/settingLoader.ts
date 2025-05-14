import AsyncStorage from '@react-native-async-storage/async-storage';

// Default settings values
export const DEFAULT_NIGHT_MODE: boolean = false;
export const DEFAULT_NIGHT_MODE_BY_SCHEDULE: boolean = false;
export const DEFAULT_NIGHT_MODE_SCHEDULE: boolean = false;
export const DEFAULT_NIGHT_MODE_SCHEDULE_START: string = '22:00';
export const DEFAULT_NIGHT_MODE_SCHEDULE_END: string = '07:00';
export const DEFAULT_VERTICAL_CARD_ANIMATIONS: boolean = true;
export const DEFAULT_HORIZONTAL_CARD_ANIMATIONS: boolean = true;
export const DEFAULT_MATURE_CONTENT: boolean = false;
export const DEFAULT_NOTIFY_NEW_VERSION: boolean = true;
export const DEFAULT_READER_ANIMATIONS: boolean = true;
export const DEFAULT_NEW_CHAPTER_NOTIFICATIONS: boolean = true;
export const DEFAULT_NEW_CHAPTER_CHECK_FREQUENCY: number = 180;
export const DEFAULT_WEBTOON_SEGMENT_HEIGHT: number = 1000;

// Settings values getters
export async function getNightMode(): Promise<boolean> {
  const val = await AsyncStorage.getItem('night_mode');
  return DEFAULT_NIGHT_MODE ? val === 'true' || val === null : val === 'true';
}

export async function getNightModeBySchedule(): Promise<boolean> {
  const val = await AsyncStorage.getItem('night_mode_by_schedule');
  return DEFAULT_NIGHT_MODE_BY_SCHEDULE
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getNightModeSchedule(): Promise<boolean> {
  const val = await AsyncStorage.getItem('night_mode_schedule');
  return DEFAULT_NIGHT_MODE_SCHEDULE
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getVerticalCardAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('vertical_card_animations');
  return DEFAULT_VERTICAL_CARD_ANIMATIONS
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getHorizontalCardAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('horizontal_card_animations');
  return DEFAULT_HORIZONTAL_CARD_ANIMATIONS
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getMatureContent(): Promise<boolean> {
  const val = await AsyncStorage.getItem('mature_content');
  return DEFAULT_MATURE_CONTENT
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getNotifyOnNewVersion(): Promise<boolean> {
  const val = await AsyncStorage.getItem('notify_new_version');
  return DEFAULT_NOTIFY_NEW_VERSION
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getReaderAnimations(): Promise<boolean> {
  const val = await AsyncStorage.getItem('reader_animations');
  return DEFAULT_READER_ANIMATIONS
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getNewChapterNotifications(): Promise<boolean> {
  const val = await AsyncStorage.getItem('new_chapter_notifications');
  return DEFAULT_NEW_CHAPTER_NOTIFICATIONS
    ? val === 'true' || val === null
    : val === 'true';
}

export async function getNewChapterCheckFrequency(): Promise<number> {
  const val = await AsyncStorage.getItem('new_chapter_check_frequency');
  return parseInt(val ?? String(DEFAULT_NEW_CHAPTER_CHECK_FREQUENCY), 10);
}

export async function getWebtoonSegmentHeight(): Promise<number> {
  const val = await AsyncStorage.getItem('webtoon_segment_height');
  return parseInt(val ?? String(DEFAULT_WEBTOON_SEGMENT_HEIGHT), 10);
}
