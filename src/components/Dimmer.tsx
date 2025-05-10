import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function Dimmer() {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  return <View style={styles.dimming} />;
}

const useThemedStyles = (_theme: any) =>
  StyleSheet.create({
    dimming: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
      opacity: 0.3,
      zIndex: 999,
      pointerEvents: 'none',
    },
  });
