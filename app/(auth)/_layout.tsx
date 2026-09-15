import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function AuthLayout() {
  const colors = useThemeColors();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.white },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
