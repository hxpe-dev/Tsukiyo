import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import InfoScreen from '../screens/InfoScreen';
import ReaderScreen from '../screens/ReaderScreen';
import { MainStackParamList } from '../screens/MainLayout';
import MainLayout from '../screens/MainLayout';
import { Chapter, Manga } from '../types/mangadex';

export type RootStackParamList = {
  Main: { screen?: keyof MainStackParamList };
  Settings: undefined;
  Info: { item: Manga };
  Reader: { mangaId: string, chapterId: string, chapters: Chapter[], page: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // All screens where navbar doesn't appear
  return (
    <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainLayout} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{presentation: 'modal'}}/>
      <Stack.Screen name="Info" component={InfoScreen} options={{presentation: 'modal'}}/>
      <Stack.Screen name="Reader" component={ReaderScreen} options={{presentation: 'modal'}}/>
    </Stack.Navigator>
  );
};

export default AppNavigator;
