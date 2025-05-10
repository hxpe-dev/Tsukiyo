import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function NotConnected() {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.warning,
      padding: 5,
    },
    text: {
      fontSize: 16,
      color: theme.text,
    },
  });
