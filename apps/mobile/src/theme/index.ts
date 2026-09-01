export const lightColors = {
  background: '#F5F2E9',
  surface: '#FFFFFF',
  surfaceMuted: '#EAE7DE',
  primary: '#12372A',
  primaryLight: '#E6EFE9',
  primarySoft: '#BFD8C8',
  accent: '#D9B96E',
  text: '#17231D',
  textStrong: '#26332C',
  textMuted: '#687169',
  textSoft: '#7B847E',
  border: '#E0DDD4',
  borderStrong: '#CBD1CC',
  placeholder: '#849087',
  danger: '#9B403D',
  warningBackground: '#FFF1CE',
  warningText: '#876314',
  successBackground: '#E1F1E7',
  successText: '#286846',
  white: '#FFFFFF',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#0E1512', surface: '#17211C', surfaceMuted: '#202C26',
  primary: '#87C9A7', primaryLight: '#20392D', primarySoft: '#A9D9BF', accent: '#D9B96E',
  text: '#F3F5F3', textStrong: '#E5EBE7', textMuted: '#A4B0A9', textSoft: '#87948D',
  border: '#2B3831', borderStrong: '#3B4A42', placeholder: '#77857D', danger: '#EE8E89',
  warningBackground: '#3C321C', warningText: '#F1D585', successBackground: '#18372A',
  successText: '#8BD3AA', white: '#FFFFFF',
};

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

export const fontSize = {
  caption: 11,
  small: 12,
  body: 14,
  input: 16,
  subtitle: 20,
  title: 36,
} as const;
