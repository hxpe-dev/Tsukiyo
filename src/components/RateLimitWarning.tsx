import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RateLimitWarning() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are being rate limited. Please wait a minute.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffcccb',
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: '#b30000',
    fontWeight: '600',
    textAlign: 'center',
  },
});
