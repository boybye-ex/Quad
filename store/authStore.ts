import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, Campus, AuthState } from '@/types';
import { mockCampuses, mockUsers } from '@/services/mockData';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, campusId: string) => Promise<boolean>;
  setSelectedCampus: (campus: Campus) => void;
  initialize: () => Promise<void>;
}

const AUTH_TOKEN_KEY = 'auth_token';
const CAMPUS_KEY = 'selected_campus';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedCampus: mockCampuses[0],

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const campusData = await SecureStore.getItemAsync(CAMPUS_KEY);
      
      let selectedCampus = mockCampuses[0];
      if (campusData) {
        try {
          selectedCampus = JSON.parse(campusData);
        } catch {
          selectedCampus = mockCampuses[0];
        }
      }

      if (token) {
        const user = mockUsers[0];
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          selectedCampus,
        });
      } else {
        set({
          isLoading: false,
          selectedCampus,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, _password: string) => {
    try {
      set({ isLoading: true });
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const user = mockUsers.find((u) => u.email === email) || {
        ...mockUsers[0],
        email,
      };

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'mock_token_' + Date.now());
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  register: async (email: string, _password: string, name: string, campusId: string) => {
    try {
      set({ isLoading: true });
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const campus = mockCampuses.find((c) => c.id === campusId) || mockCampuses[0];
      
      const newUser: User = {
        id: 'user_' + Date.now(),
        name,
        email,
        role: 'Student',
        isVerified: true,
        campus,
        createdAt: new Date(),
      };

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'mock_token_' + Date.now());
      
      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        selectedCampus: campus,
      });
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      set({ isLoading: false });
      return false;
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
