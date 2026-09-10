import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, fontSize, fontWeight } from '@/constants/theme';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeValue = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  }[size];

  const fontSizeValue = {
    sm: fontSize.xs,
    md: fontSize.sm,
    lg: fontSize.md,
    xl: fontSize.xl,
  }[size];

  if (uri) {
    return (
      <View style={style}>
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          ]}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  const backgroundColor = getColorFromName(name);

  return (
    <View
      style={[
        styles.fallback,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: fontSizeValue }]}>{initials}</Text>
    </View>
  );
}

function getColorFromName(name: string): string {
  const colorPalette = [
    '#1B5E20',
    '#4CAF50',
    '#2196F3',
    '#9C27B0',
    '#FF9800',
    '#F44336',
    '#00BCD4',
    '#795548',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorPalette[Math.abs(hash) % colorPalette.length];
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.background.DEFAULT,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text.white,
    fontWeight: fontWeight.semibold,
  },
});
