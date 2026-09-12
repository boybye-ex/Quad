import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, Campus, AuthState } from '@/types';
import {
  supabase,
  fetchCampuses,
  fetchProfile,
  validateEmailDomain,
  getEmailDomainError,
  Campus as SupabaseCampus,
  Profile as SupabaseProfile,
} from '@/lib/supabase';

interface AuthStore extends AuthState {
  campuses: Campus[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    campusId: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  setSelectedCampus: (campus: Campus) => void;
  initialize: () => Promise<void>;
  loadCampuses: () => Promise<void>;
  validateEmailForCampus: (email: string, campusId: string) => string | null;
}

const CAMPUS_KEY = 'selected_campus';

function mapSupabaseCampus(campus: SupabaseCampus): Campus {
  return {
    id: campus.id,
    name: campus.name,
    shortName: campus.short_name,
    city: campus.city,
    province: campus.province,
    kind: campus.kind,
    allowedEmailDomains: campus.allowed_email_domains,
    createdAt: new Date(campus.created_at),
  };
}

function mapSupabaseProfile(profile: SupabaseProfile, campus: Campus | null): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar_url || undefined,
    role: profile.role,
    isVerified: profile.is_verified,
    isSuspended: profile.is_suspended,
    campus: campus,
    campusId: profile.campus_id,
    createdAt: new Date(profile.created_at),
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedCampus: null,
  campuses: [],

  loadCampuses: async () => {
    try {
      const supabaseCampuses = await fetchCampuses();
      const campuses = supabaseCampuses.map(mapSupabaseCampus);
      set({ campuses });
      return;
    } catch (error) {
      console.error('Error loading campuses:', error);
    }
  },

  initialize: async () => {
    try {
      await get().loadCampuses();

      const campusData = await SecureStore.getItemAsync(CAMPUS_KEY);
      let selectedCampus: Campus | null = null;
      if (campusData) {
        try {
          selectedCampus = JSON.parse(campusData);
        } catch {
          selectedCampus = null;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          const campuses = get().campuses;
          const userCampus = campuses.find((c) => c.id === profile.campus_id) || null;
          const user = mapSupabaseProfile(profile, userCampus);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            selectedCampus: userCampus || selectedCampus,
          });
          return;
        }
      }

      set({
        isLoading: false,
        selectedCampus,
      });

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            const campuses = get().campuses;
            const userCampus = campuses.find((c) => c.id === profile.campus_id) || null;
            const user = mapSupabaseProfile(profile, userCampus);
            set({
              user,
              isAuthenticated: true,
              selectedCampus: userCampus || get().selectedCampus,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  validateEmailForCampus: (email: string, campusId: string): string | null => {
    const campuses = get().campuses;
    const campus = campuses.find((c) => c.id === campusId);
    if (!campus) {
      return 'Invalid campus selected';
    }

    const supabaseCampus: SupabaseCampus = {
      id: campus.id,
      name: campus.name,
      short_name: campus.shortName,
      city: campus.city,
      province: campus.province,
      kind: campus.kind,
      allowed_email_domains: campus.allowedEmailDomains,
      created_at: campus.createdAt.toISOString(),
    };

    return getEmailDomainError(email, supabaseCampus);
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false });
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please confirm your email address before signing in. Check your inbox.',
          };
        }
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password. Please try again.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          if (profile.is_suspended) {
            await supabase.auth.signOut();
            set({ isLoading: false });
            return {
              success: false,
              error: 'Your account has been suspended. Please contact support.',
            };
          }

          const campuses = get().campuses;
          const userCampus = campuses.find((c) => c.id === profile.campus_id) || null;
          const user = mapSupabaseProfile(profile, userCampus);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            selectedCampus: userCampus || get().selectedCampus,
          });

          return { success: true };
        }
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to load user profile' };
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  register: async (email: string, password: string, name: string, campusId: string) => {
    try {
      set({ isLoading: true });

      const validationError = get().validateEmailForCampus(email, campusId);
      if (validationError) {
        set({ isLoading: false });
        return { success: false, error: validationError };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            campus_id: campusId,
            role: 'student',
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        if (error.message.includes('User already registered')) {
          return {
            success: false,
            error: 'An account with this email already exists. Please sign in instead.',
          };
        }
        return { success: false, error: error.message };
      }

      set({ isLoading: false });

      if (data.user && !data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
        };
      }

      if (data.user && data.session) {
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          const campuses = get().campuses;
          const userCampus = campuses.find((c) => c.id === profile.campus_id) || null;
          const user = mapSupabaseProfile(profile, userCampus);

          set({
            user,
            isAuthenticated: true,
            selectedCampus: userCampus,
          });
        }
        return { success: true };
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (error) {
      console.error('Register error:', error);
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  setSelectedCampus: async (campus: Campus) => {
    try {
      await SecureStore.setItemAsync(CAMPUS_KEY, JSON.stringify(campus));
      set({ selectedCampus: campus });
    } catch (error) {
      console.error('Error saving campus:', error);
    }
  },
}));
