import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { register, isLoading, campuses, loadCampuses, validateEmailForCampus } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [campusId, setCampusId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (campuses.length === 0) {
      loadCampuses();
    }
  }, [campuses.length, loadCampuses]);

  useEffect(() => {
    if (campuses.length > 0 && !campusId) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);

  useEffect(() => {
    if (email && campusId) {
      const validationError = validateEmailForCampus(email, campusId);
      setEmailError(validationError || '');
    } else {
      setEmailError('');
    }
  }, [email, campusId, validateEmailForCampus]);

  const selectedCampus = campuses.find((c) => c.id === campusId);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!campusId) {
      setError('Please select your campus');
      return;
    }

    if (emailError) {
      setError(emailError);
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
    const result = await register(email, password, name, campusId);

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        Alert.alert(
          'Check your email',
          `We've sent a confirmation link to ${email}. Please click the link to verify your account before signing in.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        );
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  const getEmailHint = () => {
    if (selectedCampus && selectedCampus.allowedEmailDomains.length > 0) {
      const exampleDomain = selectedCampus.allowedEmailDomains[0];
      return `Use your ${selectedCampus.shortName} email, e.g. 1234567@${exampleDomain}`;
    }
    return 'Select a campus first';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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

            <Text style={styles.label}>Campus</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={campusId}
                onValueChange={(value) => setCampusId(value)}
                style={styles.picker}
              >
                {campuses.map((campus) => (
                  <Picker.Item
                    key={campus.id}
                    label={`${campus.name} (${campus.shortName})`}
                    value={campus.id}
                  />
                ))}
              </Picker>
            </View>
            {selectedCampus && (
              <Text style={styles.campusInfo}>
                {selectedCampus.city}, {selectedCampus.province}
              </Text>
            )}

            <View style={styles.inputSpacer} />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder={
                selectedCampus
                  ? `name@${selectedCampus.allowedEmailDomains[0] || 'university.ac.za'}`
                  : 'your.email@university.ac.za'
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              hint={getEmailHint()}
              error={emailError || undefined}
            />

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
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.text.gray} />
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
            <Button title="Create Account" onPress={handleSignUp} loading={isLoading} fullWidth />

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

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
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
  campusInfo: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
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
