import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  colorScheme: 'light' | 'dark';
  isInitialized: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_KEY = 'quad_theme_mode';

function getEffectiveColorScheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() ?? 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'system',
  colorScheme: 'light',
  isInitialized: false,

  initialize: async () => {
    try {
      const storedMode = await AsyncStorage.getItem(THEME_KEY);
      const mode: ThemeMode = (storedMode as ThemeMode) || 'system';
      const colorScheme = getEffectiveColorScheme(mode);

      Appearance.setColorScheme(mode === 'system' ? null : mode);

      set({ mode, colorScheme, isInitialized: true });

      Appearance.addChangeListener(({ colorScheme: systemScheme }) => {
        const currentMode = get().mode;
        if (currentMode === 'system') {
          set({ colorScheme: systemScheme ?? 'light' });
        }
      });
    } catch (error) {
      console.error('Error initializing theme:', error);
      set({ isInitialized: true });
    }
  },

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      const colorScheme = getEffectiveColorScheme(mode);

      Appearance.setColorScheme(mode === 'system' ? null : mode);

      set({ mode, colorScheme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  toggleTheme: async () => {
    const currentMode = get().mode;
    const currentScheme = get().colorScheme;
    const newMode: ThemeMode = currentScheme === 'light' ? 'dark' : 'light';
    await get().setMode(newMode);
  },
}));
