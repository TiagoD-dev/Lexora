export const lightColors = {
  background: '#F7F1E4',
  surface: '#FFFFFF',
  surfaceMuted: '#EFE6D3',
  primary: '#7A1620',
  primaryLight: '#F3E1DF',
  primarySoft: '#DDB0AC',
  accent: '#B4872B',
  text: '#241512',
  textStrong: '#33201B',
  textMuted: '#7A6A5B',
  textSoft: '#8C7C6C',
  border: '#E4D8C2',
  borderStrong: '#CDBB9B',
  placeholder: '#948673',
  danger: '#9B403D',
  warningBackground: '#FFF1CE',
  warningText: '#876314',
  successBackground: '#E1F1E7',
  successText: '#286846',
  white: '#FFFFFF',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#1A1210', surface: '#241A17', surfaceMuted: '#2E211D',
  primary: '#E2707A', primaryLight: '#3C2220', primarySoft: '#C98F8B', accent: '#D9B454',
  text: '#F5EFE7', textStrong: '#EBE1D6', textMuted: '#B3A594', textSoft: '#9A8C7B',
  border: '#3A2C26', borderStrong: '#4C3A32', placeholder: '#8A7B6B', danger: '#EE8E89',
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
