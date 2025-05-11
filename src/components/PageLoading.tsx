import React from 'react';
import {View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import {useTheme} from '../context/ThemeContext';

interface PageLoadingProps {
  text?: string,
}

export default function PageLoading({text}: PageLoadingProps) {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.button} />
      {text && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
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
    textContainer: {
      marginTop: 30,
      width: '80%',
      alignItems: 'center',
    },
    text: {
      marginTop: 8,
      fontSize: 16,
      color: theme.text,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
