import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
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
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '@/lib/notifications';
import type { EventSubscription } from 'expo-notifications';

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

  // Set up notification listeners once on mount.
  // These handle incoming notifications and user interactions with notifications.
  const notificationListenerRef = useRef<EventSubscription | null>(null);
  const responseListenerRef = useRef<EventSubscription | null>(null);

  useEffect(() => {
    // Listen for notifications received while the app is in the foreground
    notificationListenerRef.current = addNotificationReceivedListener((notification) => {
      // Log incoming notifications - you can add custom handling here
      console.log('[RootLayout] Notification received:', notification.request.content.title);
    });

    // Listen for user interactions with notifications (taps)
    responseListenerRef.current = addNotificationResponseListener((response) => {
      // Handle notification taps - navigate based on the notification data
      const data = response.notification.request.content.data;
      console.log('[RootLayout] Notification tapped:', data);

      // Example: Navigate to a conversation if the notification has a conversationId
      if (data?.conversationId && typeof data.conversationId === 'string') {
        router.push(`/(tabs)/messages`);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, []);

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
