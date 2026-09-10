import { colors } from './theme';

const tintColorLight = colors.primary.DEFAULT;
const tintColorDark = colors.secondary.light;

export default {
  light: {
    text: colors.text.dark,
    background: colors.background.DEFAULT,
    tint: tintColorLight,
    tabIconDefault: colors.text.gray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
