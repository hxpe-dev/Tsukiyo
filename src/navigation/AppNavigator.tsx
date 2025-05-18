import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import InfoScreen from '../screens/InfoScreen';
import ReaderScreen from '../screens/ReaderScreen';
import {MainStackParamList} from '../screens/MainLayout';
import MainLayout from '../screens/MainLayout';
import {Chapter, Manga} from '../types/mangadex';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import NotConnected from '../components/NotConnected';
import {isConnected} from '../utils/variables';
import SourcesScreen from '../screens/SourcesScreen';
import { UsableExtension } from '../types/extensions';

export type RootStackParamList = {
  Main: {screen?: keyof MainStackParamList};
  Settings: undefined;
  Info: {
    source: UsableExtension;
    item: Manga | {id: string};
  };
  Sources: undefined;
  Reader: {
    sourceId: string;
    mangaId: string;
    mangaTitle: string;
    mangaLang: string;
    mangaCover: string;
    chapterId: string;
    chapters: Chapter[];
    page: number;
    externalUrl?: string | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {theme} = useTheme();
  // All screens where navbar doesn't appear
  return (
    <SafeAreaView
      // eslint-disable-next-line react-native/no-inline-styles
      style={{flex: 1, backgroundColor: theme.background}}
      edges={['top', 'bottom', 'left', 'right']}>
      {!isConnected && <NotConnected />}
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Main" component={MainLayout} />
        <Stack.Screen
          name="Sources"
          component={SourcesScreen}
          options={{presentation: 'modal'}}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{presentation: 'modal'}}
        />
        <Stack.Screen
          name="Info"
          component={InfoScreen}
          options={{presentation: 'modal'}}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{presentation: 'modal'}}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default AppNavigator;
