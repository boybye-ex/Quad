import { lightColors, darkColors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useThemeColors() {
  const colorScheme = useThemeStore((state) => state.colorScheme);
  return colorScheme === 'dark' ? darkColors : lightColors;
}

export function useIsDarkMode() {
  return useThemeStore((state) => state.colorScheme === 'dark');
}
