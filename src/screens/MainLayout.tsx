import React from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../components/Navbar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ExplorerScreen from './ExplorerScreen';
import ProfileScreen from './ProfileScreen';
import { useTheme } from '../context/ThemeContext';

export type MainStackParamList = {
  Home: undefined;
  Explorer: undefined;
  Profile: undefined;
};

const MainStack = createNativeStackNavigator<MainStackParamList>();

export default function MainLayout() {
  const { theme } = useTheme();
  const styles = useThemedStyles(theme);

  // All screens where navbar appears
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MainStack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <MainStack.Screen name="Home" component={HomeScreen} />
          <MainStack.Screen name="Explorer" component={ExplorerScreen} />
          <MainStack.Screen name="Profile" component={ProfileScreen} />
        </MainStack.Navigator>
      </View>
      <Navbar />
    </View>
  );
}

const useThemedStyles = (theme: any) =>
   StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });
