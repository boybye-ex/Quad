import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('.edu')) {
      setError('Please use your .edu email address');
      return;
    }

    setError('');
    const success = await login(email, password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in with your .edu email</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your.name@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.inputSpacer} />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.text.gray}
                  />
                </TouchableOpacity>
              }
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Create Account"
              onPress={() => router.replace('/(auth)/sign-up')}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginLeft: -spacing.sm,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.gray,
    marginTop: spacing.sm,
  },
  form: {
    flex: 1,
  },
  inputSpacer: {
    height: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.accent.red,
    marginTop: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeight.medium,
  },
  footer: {
    paddingVertical: spacing['2xl'],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
});
