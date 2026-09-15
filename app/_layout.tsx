import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';

import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useThemeColors } from '@/hooks/useThemeColors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeTheme = useThemeStore((state) => state.initialize);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const colors = useThemeColors();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      initializeAuth();
      initializeTheme();
      SplashScreen.hideAsync();
    }
  }, [loaded, initializeAuth, initializeTheme]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background.DEFAULT },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(auth)"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="listing/[id]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: colors.primary.DEFAULT,
              }}
            />
            <Stack.Screen
              name="category/[slug]"
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: colors.primary.DEFAULT,
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
