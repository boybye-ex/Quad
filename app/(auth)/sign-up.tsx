import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { mockCampuses } from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [campusId, setCampusId] = useState(mockCampuses[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('.edu')) {
      setError('Please use your .edu email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    const success = await register(email, password, name, campusId);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Registration failed. Please try again.');
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join your campus community</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
            />

            <View style={styles.inputSpacer} />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your.name@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              hint="Use your .edu email to verify you're a student"
            />

            <View style={styles.inputSpacer} />

            <Text style={styles.label}>Campus</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={campusId}
                onValueChange={(value) => setCampusId(value)}
                style={styles.picker}
              >
                {mockCampuses.map((campus) => (
                  <Picker.Item
                    key={campus.id}
                    label={campus.name}
                    value={campus.id}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.inputSpacer} />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              hint="At least 8 characters"
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

            <View style={styles.inputSpacer} />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.footer}>
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
            />

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: spacing['2xl'],
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.accent.red,
    marginTop: spacing.md,
  },
  footer: {
    paddingVertical: spacing['2xl'],
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  signInText: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  signInLink: {
    fontSize: fontSize.sm,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeight.semibold,
  },
});
