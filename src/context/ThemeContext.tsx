import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {lightTheme, darkTheme} from '../utils/theme';
import {
  DEFAULT_NIGHT_MODE_SCHEDULE_END,
  DEFAULT_NIGHT_MODE_SCHEDULE_START,
  getNightModeSchedule,
} from '../utils/settingLoader';

interface ThemeContextType {
  theme: typeof lightTheme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [isDark, setIsDark] = useState(false);
  const [scheduleStart, setScheduleStart] = useState(
    DEFAULT_NIGHT_MODE_SCHEDULE_START,
  );
  const [scheduleEnd, setScheduleEnd] = useState(
    DEFAULT_NIGHT_MODE_SCHEDULE_END,
  );

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      const start = await AsyncStorage.getItem('night_mode_start');
      const end = await AsyncStorage.getItem('night_mode_end');

      if (storedTheme === 'dark') {
        setIsDark(true);
      }
      if (start) {
        setScheduleStart(start);
      }
      if (end) {
        setScheduleEnd(end);
      }
    };
    loadTheme();
  }, []);

  // Night mode schedule checker
  useEffect(() => {
    let lastValue: string = '';

    const isScheduledNightMode = async () => {
      if (!(await getNightModeSchedule())) {
        return;
      }

      const now = new Date();
      const minutesNow = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = scheduleStart.split(':').map(Number);
      const [endH, endM] = scheduleEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const shouldBeNight =
        startMinutes < endMinutes
          ? minutesNow >= startMinutes && minutesNow < endMinutes
          : minutesNow >= startMinutes || minutesNow < endMinutes;

      const newValue = shouldBeNight ? 'true' : 'false';
      if (newValue !== lastValue) {
        await AsyncStorage.setItem('night_mode_by_schedule', newValue);
        lastValue = newValue;
      }
    };

    isScheduledNightMode(); // One first call on app start

    const interval = setInterval(async () => {
      isScheduledNightMode();
    }, 60000);

    return () => clearInterval(interval);
  }, [scheduleStart, scheduleEnd]);

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, isDark}}>
      {children}
    </ThemeContext.Provider>
  );
};
