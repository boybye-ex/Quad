export const colors = {
  primary: {
    DEFAULT: '#1B5E20',
    dark: '#0D3A12',
    light: '#2E7D32',
  },
  secondary: {
    DEFAULT: '#4CAF50',
    light: '#81C784',
  },
  background: {
    DEFAULT: '#F5F5F5',
    white: '#FFFFFF',
    cream: '#FAF9F6',
  },
  text: {
    dark: '#1A1A1A',
    gray: '#666666',
    light: '#999999',
    white: '#FFFFFF',
  },
  accent: {
    orange: '#FF9800',
    red: '#F44336',
    yellow: '#FFC107',
  },
  border: {
    light: '#E5E5E5',
    DEFAULT: '#D1D5DB',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
