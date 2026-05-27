import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, DarkColors, LightColors } from '../constants/Colors';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  colors: ColorScheme;
  setPreference: (p: ThemePreference) => void;
}

const STORAGE_KEY = '@gymcoachai_theme';

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  colorScheme: 'light',
  colors: LightColors,
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  let colorScheme: 'light' | 'dark' = 'light';
  if (preference === 'system') {
    if (systemScheme === 'dark') {
      colorScheme = 'dark';
    } else {
      colorScheme = 'light';
    }
  } else {
    colorScheme = preference;
  }
  
  let colors = LightColors;
  if (colorScheme === 'dark') {
    colors = DarkColors;
  }

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  };

  return (
    <ThemeContext.Provider value={{ preference, colorScheme, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}