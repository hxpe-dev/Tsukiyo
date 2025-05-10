import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator.tsx';
import {ThemeProvider} from './src/context/ThemeContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {setupNotificationChannel} from './src/notifications/setupNotificationChannel.ts';
import BackgroundFetch from 'react-native-background-fetch';
import {checkForNewChapters} from './src/api/mangadex';
import {getNewChapterCheckFrequency} from './src/utils/settingLoader.ts';
import VersionCheckModal from './src/components/VersionCheckModal.tsx';
import { isConnected, updateNetworkStatus } from './src/utils/network.ts';

const App = () => {
  const [fetchInterval, setFetchInterval] = useState(180);

  useEffect(() => {
    updateNetworkStatus();

    async function loadSetting() {
      setFetchInterval(await getNewChapterCheckFrequency());
    }
    loadSetting();

    // Setup notification channel
    setupNotificationChannel();
    // We check for new chapters at the app start
    if (isConnected) {checkForNewChapters();}

    // Initialize Background Fetch
    const initBackgroundFetch = async () => {
      try {
        // Configure the background fetch task
        await BackgroundFetch.configure(
          {
            minimumFetchInterval: fetchInterval,
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
          },
          async taskId => {
            // This is where the checkForNewChapters function gets triggered
            await checkForNewChapters();
            BackgroundFetch.finish(taskId);
          },
          error => {
            console.error('Background Fetch failed to start', error);
          },
        );
      } catch (err) {
        console.error('Error in initializing Background Fetch', err);
      }
    };

    // Run the background initialization
    initBackgroundFetch();
  }, [fetchInterval]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <VersionCheckModal />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
