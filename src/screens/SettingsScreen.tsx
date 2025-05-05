import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = useThemedStyles(theme);

  const [horizontalCardAnimationsEnabled, setHorizontalCardAnimationsEnabled] = useState(true);
  const [verticalCardAnimationsEnabled, setVerticalCardAnimationsEnabled] = useState(true);
  const [readerAnimationsEnabled, setReaderAnimationsEnabled] = useState(true);
  const [showRestartWarning, setShowRestartWarning] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const horizontalCardAnimationsSetting = await AsyncStorage.getItem('horizontal_card_animations');
      const verticalCardAnimationsSetting = await AsyncStorage.getItem('vertical_card_animations');
      const readerAnimationsSetting = await AsyncStorage.getItem('reader_animations');

      if (horizontalCardAnimationsSetting !== null) {setHorizontalCardAnimationsEnabled(horizontalCardAnimationsSetting === 'true');}
      if (verticalCardAnimationsSetting !== null) {setVerticalCardAnimationsEnabled(verticalCardAnimationsSetting === 'true');}
      if (readerAnimationsSetting !== null) {setReaderAnimationsEnabled(readerAnimationsSetting === 'true');}
    };

    loadSettings();
  }, []);

  const toggleHorizontalCardAnimations = async () => {
    const newValue = !horizontalCardAnimationsEnabled;
    setHorizontalCardAnimationsEnabled(newValue);
    await AsyncStorage.setItem('horizontal_card_animations', String(newValue));
    setShowRestartWarning(true);
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

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text style={styles.text}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Horizontal Card Animations</Text>
        <Switch value={horizontalCardAnimationsEnabled} onValueChange={toggleHorizontalCardAnimations} />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Vertical Card Animations</Text>
        <Switch value={verticalCardAnimationsEnabled} onValueChange={toggleVerticalCardAnimations} />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Reader Animations</Text>
        <Switch value={readerAnimationsEnabled} onValueChange={toggleReaderAnimations} />
      </View>

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
  });
