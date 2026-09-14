import 'react-native-url-polyfill/polyfill';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  );
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export interface Campus {
  id: string;
  name: string;
  short_name: string;
  city: string;
  province: string;
  kind: 'public_university' | 'private_college' | 'tvet';
  allowed_email_domains: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  campus_id: string | null;
  role: 'student' | 'ta' | 'admin';
  is_verified: boolean;
  is_suspended: boolean;
  avatar_url: string | null;
  created_at: string;
}

export async function fetchCampuses(): Promise<Campus[]> {
  const { data, error } = await supabase
    .from('campuses')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching campuses:', error);
    return [];
  }

  return data || [];
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'name' | 'avatar_url'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

export function validateEmailDomain(email: string, allowedDomains: string[]): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return false;

  const blockedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'aol.com',
  ];

  if (blockedDomains.includes(domain)) {
    return false;
  }

  return allowedDomains.includes(domain);
}

export function getEmailDomainError(email: string, campus: Campus): string | null {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) {
    return 'Please enter a valid email address';
  }

  const blockedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'aol.com',
  ];

  if (blockedDomains.includes(domain)) {
    return `Please use your ${campus.short_name} student email, not a personal email like Gmail or Yahoo`;
  }

  if (!campus.allowed_email_domains.includes(domain)) {
    const exampleDomain = campus.allowed_email_domains[0];
    return `Use your ${campus.short_name} student email, like 1234567@${exampleDomain}`;
  }

  return null;
}
