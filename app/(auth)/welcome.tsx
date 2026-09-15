import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, fontWeight, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Quad.</Text>
            <Text style={styles.tagline}>Students. Stuff. Sorted.</Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.title}>Everything you need,</Text>
          <Text style={styles.titleGreen}>from the people next door.</Text>
          
          <Text style={styles.description}>
            A secure noticeboard for your campus: course books, rooms, tutoring, 
            shifts, and rides. Chat privately with verified students — zero phone 
            numbers shared.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="checkmark-circle" text="Student-verified accounts" colors={colors} styles={styles} />
          <FeatureItem icon="lock-closed" text="No phone numbers shared" colors={colors} styles={styles} />
          <FeatureItem icon="school" text="Campus community only" colors={colors} styles={styles} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/sign-in')}
          fullWidth
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Create Account"
          onPress={() => router.push('/(auth)/sign-up')}
          variant="outline"
          fullWidth
        />
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text, colors, styles }: { icon: string; text: string; colors: ReturnType<typeof useThemeColors>; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color={colors.secondary.DEFAULT} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.white,
    },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: spacing.xs,
  },
  heroSection: {
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    lineHeight: 38,
  },
  titleGreen: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    lineHeight: 38,
    fontStyle: 'italic',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text.gray,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  features: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  buttonSpacer: {
    height: spacing.md,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
