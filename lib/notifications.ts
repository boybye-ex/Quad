import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// ============================================================================
// PUSH NOTIFICATION FOUNDATION FOR QUAD
// ============================================================================
// This module provides the core push notification functionality for Quad.
// It handles permission requests, token acquisition, and graceful degradation
// when running in environments that don't support push (e.g., Expo Go on Android).
//
// IMPORTANT: Push notifications require a development build on Android (SDK 53+).
// In Expo Go on Android, push notifications are unavailable - we degrade gracefully.
// Local (in-app) notifications still work in Expo Go.
// ============================================================================

// Configure how notifications are displayed when the app is in the foreground.
// This handler determines whether to show banners, play sounds, etc.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotificationResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

// ============================================================================
// PERMISSION & TOKEN UTILITIES
// ============================================================================

/**
 * Checks whether push notifications are available in the current environment.
 * Push notifications are NOT available in Expo Go on Android (SDK 53+).
 * They work in Expo Go on iOS and in development builds on both platforms.
 */
export function isPushNotificationsAvailable(): boolean {
  // Check if we're running in Expo Go on Android
  // In Expo Go, Constants.executionEnvironment is 'storeClient'
  // In dev builds, it's 'standalone' or undefined
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  if (Platform.OS === 'android' && isExpoGo) {
    // Push notifications don't work in Expo Go on Android from SDK 53
    return false;
  }
  
  return true;
}

/**
 * Gets the current notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Requests notification permissions from the user.
 * Returns the permission status after the request.
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  // On Android 13+, we need a notification channel before requesting permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B5E20', // Quad's primary green color
    });
    
    // Create a channel specifically for chat messages
    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat Messages',
      description: 'Notifications for new chat messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B5E20',
    });
  }

  const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Registers for push notifications and returns the Expo push token.
 * This is the main function to call after a user logs in.
 * 
 * The function:
 * 1. Checks if push notifications are available in the current environment
 * 2. Requests permissions if not already granted
 * 3. Obtains and returns the Expo push token
 * 
 * Returns null token (with success: true) when running in environments
 * that don't support push notifications (e.g., Expo Go on Android).
 */
export async function registerForPushNotifications(): Promise<PushNotificationResult> {
  try {
    // Check if push notifications are available in this environment
    if (!isPushNotificationsAvailable()) {
      console.log('[Notifications] Push notifications unavailable in Expo Go on Android. Skipping registration.');
      return {
        success: true,
        token: undefined,
        error: undefined,
      };
    }

    // Request permissions
    const { granted } = await requestNotificationPermissions();
    
    if (!granted) {
      console.log('[Notifications] Permission not granted');
      return {
        success: false,
        error: 'Notification permission not granted',
      };
    }

    // Get the Expo push token
    // The projectId comes from EAS config in app.json/app.config.js
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      // This happens in development before EAS is configured.
      // We return a descriptive message but don't fail - the app still works.
      console.warn('[Notifications] No EAS projectId found. Push tokens require EAS configuration.');
      return {
        success: true,
        token: undefined,
        error: 'EAS projectId not configured - push tokens require EAS Build setup',
      };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[Notifications] Expo push token obtained:', token);

    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// NOTIFICATION LISTENERS
// ============================================================================

/**
 * Adds a listener for notifications received while the app is in the foreground.
 * Returns a subscription that should be removed when no longer needed.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Adds a listener for when the user interacts with a notification (taps it).
 * Returns a subscription that should be removed when no longer needed.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Gets the last notification response (if any) that launched or foregrounded the app.
 * Useful for handling deep links from notifications on app launch.
 */
export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

// ============================================================================
// LOCAL NOTIFICATIONS (for testing)
// ============================================================================

/**
 * Schedules a local notification for testing purposes.
 * Local notifications work in Expo Go on all platforms.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Deliver immediately
  });
}

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

/**
 * Gets the current app badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Sets the app badge count.
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  return await Notifications.setBadgeCountAsync(count);
}

/**
 * Clears all notifications from the notification center.
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
