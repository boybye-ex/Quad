import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { shadows } from '@/constants/theme';

type TabIconName = 'home' | 'search' | 'add-circle' | 'chatbubbles' | 'person';

interface TabBarIconProps {
  focused: boolean;
  color: ColorValue;
  name: TabIconName;
}

function TabBarIcon({ focused, color, name }: TabBarIconProps) {
  const iconName = focused ? name : (`${name}-outline` as const);
  return <Ionicons name={iconName} size={24} color={color as string} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.gray,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          },
        ],
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.postIconContainer}>
              <Ionicons
                name="add"
                size={28}
                color={colors.text.white}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="chatbubbles" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="person" />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.background.white,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: 8,
      ...shadows.sm,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    postIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary.DEFAULT,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -16,
      ...shadows.md,
    },
  });
