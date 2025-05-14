import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import {InfoPopup} from '../components/InfoPopup';
import {TimePicker} from '../components/TimePicker';
import {setShowRestartWarning, showRestartWarning} from '../utils/variables';
import {send} from '../utils/sendNotification';
import {
  DEFAULT_HORIZONTAL_CARD_ANIMATIONS,
  DEFAULT_MATURE_CONTENT,
  DEFAULT_NEW_CHAPTER_CHECK_FREQUENCY,
  DEFAULT_NEW_CHAPTER_NOTIFICATIONS,
  DEFAULT_NIGHT_MODE,
  DEFAULT_NIGHT_MODE_SCHEDULE,
  DEFAULT_NIGHT_MODE_SCHEDULE_END,
  DEFAULT_NIGHT_MODE_SCHEDULE_START,
  DEFAULT_NOTIFY_NEW_VERSION,
  DEFAULT_READER_ANIMATIONS,
  DEFAULT_VERTICAL_CARD_ANIMATIONS,
  DEFAULT_WEBTOON_SEGMENT_HEIGHT,
} from '../utils/settingLoader';

export default function SettingsScreen() {
  const {theme, toggleTheme, isDark} = useTheme();
  const styles = useThemedStyles(theme);

  const [nightModeEnabled, setNightModeEnabled] = useState(DEFAULT_NIGHT_MODE);
  const [nightModeScheduleEnabled, setNightModeScheduleEnabled] = useState(
    DEFAULT_NIGHT_MODE_SCHEDULE,
  );
  const [nightModeStart, setNightModeStart] = useState(
    DEFAULT_NIGHT_MODE_SCHEDULE_START,
  );
  const [nightModeEnd, setNightModeEnd] = useState(
    DEFAULT_NIGHT_MODE_SCHEDULE_END,
  );
  const [horizontalCardAnimationsEnabled, setHorizontalCardAnimationsEnabled] =
    useState(DEFAULT_HORIZONTAL_CARD_ANIMATIONS);
  const [verticalCardAnimationsEnabled, setVerticalCardAnimationsEnabled] =
    useState(DEFAULT_VERTICAL_CARD_ANIMATIONS);
  const [readerAnimationsEnabled, setReaderAnimationsEnabled] = useState(
    DEFAULT_READER_ANIMATIONS,
  );
  const [matureContentEnabled, setMatureContentEnabled] = useState(
    DEFAULT_MATURE_CONTENT,
  );
  const [notifyOnNewVersionEnabled, setNotifyOnNewVersionEnabled] = useState(
    DEFAULT_NOTIFY_NEW_VERSION,
  );
  const [webtoonSegmentHeight, setWebtoonSegmentHeight] = useState(
    String(DEFAULT_WEBTOON_SEGMENT_HEIGHT),
  );
  const [newChapterNotificationsEnabled, setNewChapterNotificationsEnabled] =
    useState(DEFAULT_NEW_CHAPTER_NOTIFICATIONS);
  const [newChapterCheckFrequency, setNewChapterCheckFrequency] = useState(
    String(DEFAULT_NEW_CHAPTER_CHECK_FREQUENCY),
  );
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoText, setInfoText] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const nightModeSetting = await AsyncStorage.getItem('night_mode');
      const nightModeScheduleSetting = await AsyncStorage.getItem(
        'night_mode_schedule',
      );
      const nightModeStartSetting = await AsyncStorage.getItem(
        'night_mode_start',
      );
      const nightModeEndSetting = await AsyncStorage.getItem('night_mode_end');
      const horizontalCardAnimationsSetting = await AsyncStorage.getItem(
        'horizontal_card_animations',
      );
      const verticalCardAnimationsSetting = await AsyncStorage.getItem(
        'vertical_card_animations',
      );
      const readerAnimationsSetting = await AsyncStorage.getItem(
        'reader_animations',
      );
      const matureContentSetting = await AsyncStorage.getItem('mature_content');
      const notifyOnNewVersionSetting = await AsyncStorage.getItem(
        'notify_new_version',
      );
      const webtoonSegmentHeightSetting = await AsyncStorage.getItem(
        'webtoon_segment_height',
      );
      const newChapterNotificationsSetting = await AsyncStorage.getItem(
        'new_chapter_notifications',
      );
      const newChapterCheckFrequencySetting = await AsyncStorage.getItem(
        'new_chapter_check_frequency',
      );

      if (nightModeSetting !== null) {
        setNightModeEnabled(nightModeSetting === 'true');
      }
      if (nightModeScheduleSetting !== null) {
        setNightModeScheduleEnabled(nightModeScheduleSetting === 'true');
      }
      if (nightModeStartSetting !== null) {
        setNightModeStart(nightModeStartSetting);
      }
      if (nightModeEndSetting !== null) {
        setNightModeEnd(nightModeEndSetting);
      }
      if (horizontalCardAnimationsSetting !== null) {
        setHorizontalCardAnimationsEnabled(
          horizontalCardAnimationsSetting === 'true',
        );
      }
      if (verticalCardAnimationsSetting !== null) {
        setVerticalCardAnimationsEnabled(
          verticalCardAnimationsSetting === 'true',
        );
      }
      if (readerAnimationsSetting !== null) {
        setReaderAnimationsEnabled(readerAnimationsSetting === 'true');
      }
      if (matureContentSetting !== null) {
        setMatureContentEnabled(matureContentSetting === 'true');
      }
      if (notifyOnNewVersionSetting !== null) {
        setNotifyOnNewVersionEnabled(notifyOnNewVersionSetting === 'true');
      }
      if (webtoonSegmentHeightSetting !== null) {
        setWebtoonSegmentHeight(webtoonSegmentHeightSetting);
      }
      if (newChapterNotificationsSetting !== null) {
        setNewChapterNotificationsEnabled(
          newChapterNotificationsSetting === 'true',
        );
      }
      if (newChapterCheckFrequencySetting !== null) {
        setNewChapterCheckFrequency(newChapterCheckFrequencySetting);
      }
    };

    loadSettings();
  }, []);

  const toggleNightMode = async () => {
    const newValue = !nightModeEnabled;
    setNightModeEnabled(newValue);
    await AsyncStorage.setItem('night_mode', String(newValue));
  };

  const toggleNightModeSchedule = async () => {
    const newValue = !nightModeScheduleEnabled;
    setNightModeScheduleEnabled(newValue);
    await AsyncStorage.setItem('night_mode_schedule', String(newValue));
    if (newValue === false) {
      // If the user disables night mode schedule, we need to set false the night mode by schedule instantly (else the change will take 1 minute to appear)
      await AsyncStorage.setItem('night_mode_by_schedule', 'false');
    }
  };

  const updateNightModeStart = async (value: string) => {
    setNightModeStart(value);
    setShowRestartWarning(true);
    await AsyncStorage.setItem('night_mode_start', value);
  };

  const updateNightModeEnd = async (value: string) => {
    setNightModeEnd(value);
    setShowRestartWarning(true);
    await AsyncStorage.setItem('night_mode_end', value);
  };

  const toggleHorizontalCardAnimations = async () => {
    const newValue = !horizontalCardAnimationsEnabled;
    setHorizontalCardAnimationsEnabled(newValue);
    await AsyncStorage.setItem('horizontal_card_animations', String(newValue));
  };

  const toggleVerticalCardAnimations = async () => {
    const newValue = !verticalCardAnimationsEnabled;
    setVerticalCardAnimationsEnabled(newValue);
    await AsyncStorage.setItem('vertical_card_animations', String(newValue));
  };

  const toggleReaderAnimations = async () => {
    const newValue = !readerAnimationsEnabled;
    setReaderAnimationsEnabled(newValue);
    await AsyncStorage.setItem('reader_animations', String(newValue));
  };

  const toggleMatureContent = async () => {
    const newValue = !matureContentEnabled;
    setMatureContentEnabled(newValue);
    await AsyncStorage.setItem('mature_content', String(newValue));
  };

  const toggleNotifyNewVersion = async () => {
    const newValue = !notifyOnNewVersionEnabled;
    if (newValue === true) {
      send(
        'Hey there!',
        'Thank you very much for enabling the new app version notification!',
        'new-chapters',
        'notifications_icon',
      );
    }
    setNotifyOnNewVersionEnabled(newValue);
    await AsyncStorage.setItem('notify_new_version', String(newValue));
  };

  const updateWebtoonSegmentHeight = async (value: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setWebtoonSegmentHeight(value);
      await AsyncStorage.setItem('webtoon_segment_height', value);
    }
  };

  const toggleNewChapterNotifications = async () => {
    const newValue = !newChapterNotificationsEnabled;
    if (newValue === true) {
      send(
        'Hey there!',
        'New chapter notifications are now enabled!',
        'new-chapters',
        'notifications_icon',
      );
    }
    setNewChapterNotificationsEnabled(newValue);
    await AsyncStorage.setItem('new_chapter_notifications', String(newValue));
  };

  const updateNewChapterCheckFrequency = async (value: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setNewChapterCheckFrequency(value);
      await AsyncStorage.setItem('new_chapter_check_frequency', value);
    }
  };

  const showInfo = (text: string) => {
    setInfoText(text);
    setInfoVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text style={styles.text}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          thumbColor={isDark ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingsLabel}>
          <Text style={styles.text}>Night Mode</Text>
          <TouchableOpacity
            onPress={() =>
              showInfo(
                "When enabled, Night Mode will dim the reader's colors for more comfortable viewing in the dark.",
              )
            }>
            <Icon
              name="info"
              size={16}
              color={theme.text}
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </View>
        <Switch
          value={nightModeEnabled}
          onValueChange={toggleNightMode}
          thumbColor={nightModeEnabled ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingsLabel}>
          <Text style={styles.text}>Night Mode Schedule</Text>
          <TouchableOpacity
            onPress={() =>
              showInfo(
                'When enabled, Night Mode will automatically start and end at the specified start and end timestamps.',
              )
            }>
            <Icon
              name="info"
              size={16}
              color={theme.text}
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </View>
        {nightModeScheduleEnabled && (
          <View style={styles.nightModeInputRow}>
            <TimePicker
              value={nightModeStart}
              onChange={updateNightModeStart}
              theme={theme}
            />
            <Text style={{color: theme.text}}>•</Text>
            <TimePicker
              value={nightModeEnd}
              onChange={updateNightModeEnd}
              theme={theme}
            />
          </View>
        )}
        <Switch
          value={nightModeScheduleEnabled}
          onValueChange={toggleNightModeSchedule}
          thumbColor={nightModeScheduleEnabled ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Horizontal Card Animations</Text>
        <Switch
          value={horizontalCardAnimationsEnabled}
          onValueChange={toggleHorizontalCardAnimations}
          thumbColor={
            horizontalCardAnimationsEnabled ? theme.button : theme.error
          }
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Vertical Card Animations</Text>
        <Switch
          value={verticalCardAnimationsEnabled}
          onValueChange={toggleVerticalCardAnimations}
          thumbColor={
            verticalCardAnimationsEnabled ? theme.button : theme.error
          }
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Reader Animations</Text>
        <Switch
          value={readerAnimationsEnabled}
          onValueChange={toggleReaderAnimations}
          thumbColor={readerAnimationsEnabled ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Show Mature Content</Text>
        <Switch
          value={matureContentEnabled}
          onValueChange={toggleMatureContent}
          thumbColor={matureContentEnabled ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Notify On New App Version</Text>
        <Switch
          value={notifyOnNewVersionEnabled}
          onValueChange={toggleNotifyNewVersion}
          thumbColor={notifyOnNewVersionEnabled ? theme.button : theme.error}
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingsLabel}>
          <Text style={styles.text}>New Chapter Notifications</Text>
          <TouchableOpacity
            onPress={() =>
              showInfo(
                "When enabled, Tsukiyo will send a notification when new chapters of the mangas you're currently reading are released.",
              )
            }>
            <Icon
              name="info"
              size={16}
              color={theme.text}
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </View>
        <Switch
          value={newChapterNotificationsEnabled}
          onValueChange={toggleNewChapterNotifications}
          thumbColor={
            newChapterNotificationsEnabled ? theme.button : theme.error
          }
          trackColor={{false: theme.border, true: theme.border}}
        />
      </View>

      {newChapterNotificationsEnabled && (
        <View style={styles.settingRow}>
          <View style={styles.settingsLabel}>
            <Text style={styles.text}>New Chapter Check Frequency</Text>
            <TouchableOpacity
              onPress={() =>
                showInfo(
                  'Sets how frequently the app checks for new chapters of your currently reading mangas (in minutes).',
                )
              }>
              <Icon
                name="info"
                size={16}
                color={theme.text}
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={newChapterCheckFrequency}
            onChangeText={updateNewChapterCheckFrequency}
          />
        </View>
      )}

      <View style={styles.settingRow}>
        <View style={styles.settingsLabel}>
          <Text style={styles.text}>Webtoon Segment Height</Text>
          <TouchableOpacity
            onPress={() =>
              showInfo(
                'Controls the pixel height of each webtoon image segment. Lower values improve quality but require more processing power.',
              )
            }>
            <Icon
              name="info"
              size={16}
              color={theme.text}
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={webtoonSegmentHeight}
          onChangeText={updateWebtoonSegmentHeight}
        />
      </View>

      <InfoPopup
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description={infoText}
        theme={theme}
      />

      {showRestartWarning && (
        <Text style={styles.warningText}>
          Changes require an app restart to take effect.
        </Text>
      )}
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: theme.background,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
    },
    settingsLabel: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      fontSize: 16,
      color: theme.text,
    },
    warningText: {
      marginTop: 16,
      color: theme.warning,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 20,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.text,
      color: theme.text,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      width: 80,
      textAlign: 'right',
    },
    infoIcon: {
      marginLeft: 6,
    },
    nightModeInputRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flex: 1,
      gap: 5,
    },
  });
