import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleNavigateToSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
      <TouchableOpacity onPress={handleNavigateToSettings}>
        <Icon name="settings" size={24} color="#4f46e5" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 },
});
