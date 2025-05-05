import React from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../components/Navbar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ExplorerScreen from './ExplorerScreen';
import ProfileScreen from './ProfileScreen';

export type MainStackParamList = {
  Home: undefined;
  Explorer: undefined;
  Profile: undefined;
};

const MainStack = createNativeStackNavigator<MainStackParamList>();

export default function MainLayout() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
