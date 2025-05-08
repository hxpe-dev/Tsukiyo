import React from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function PageLoading() {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.button} />
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
  });
