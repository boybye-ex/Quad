/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
        },
        text: {
          dark: '#1A1A1A',
          gray: '#666666',
          light: '#999999',
        },
        accent: {
          orange: '#FF9800',
          red: '#F44336',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
