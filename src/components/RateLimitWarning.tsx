import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function RateLimitWarning() {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        You are being rate limited. Please wait a minute.
      </Text>
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: theme.elevatedBackground,
      padding: 12,
      borderRadius: 8,
      elevation: 5,
      zIndex: 1000,
    },
    text: {
      color: theme.error,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
