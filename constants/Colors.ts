export const LightColors = {
  primary: '#FF791C',
  primaryLight: '#FF944D',
  primaryDark: '#E66A16',
  primarySubtle: '#FFF1E8',

  secondary: '#32D49A',
  secondaryLight: '#5BE0B1',
  secondaryDark: '#2AB885',
  secondarySubtle: '#EBFCF6',

  tertiary: '#00AAEE',
  tertiaryLight: '#33BBF1',
  tertiaryDark: '#008CC4',
  tertiarySubtle: '#E6F7FE',

  background: '#F7F8FA',
  surface: '#FFFFFF',
  inputBackground: '#F5F6FA',
  white: '#FFFFFF',
  text: '#111111',
  textSecondary: '#666666',

  inputBorder: '#E0E0E0',
  inputBorderFocus: '#FF791C',
  neutralHover: '#ECEEF2',
  divider: '#EBEBEB',
  link: '#FF791C',
  linkHover: '#E66A16',
  textTertiary: '#999999',
  success: '#32D49A',
  successSubtle: '#EBFCF6',
  danger: '#FF3B30',
  dangerSubtle: '#FFEBEA',
  infoSubtle: '#E6F7FE',
  info: '#00AAEE',
};

export const DarkColors = {
  primary: '#FF791C',
  primaryLight: '#FF944D',
  primaryDark: '#E66A16',
  primarySubtle: '#2A1A0E',

  secondary: '#32D49A',
  secondaryLight: '#5BE0B1',
  secondaryDark: '#2AB885',
  secondarySubtle: '#0D2A20',

  tertiary: '#00AAEE',
  tertiaryLight: '#33BBF1',
  tertiaryDark: '#008CC4',
  tertiarySubtle: '#051F2E',

  background: '#111318',
  surface: '#1E2128',
  inputBackground: '#16181E',
  white: '#FFFFFF',
  text: '#F0F1F3',
  textSecondary: '#8A8F9C',

  inputBorder: '#2E3340',
  inputBorderFocus: '#FF791C',
  neutralHover: '#252830',
  divider: '#252830',
  link: '#FF791C',
  linkHover: '#E66A16',
  textTertiary: '#8A8F9C',
  success: '#32D49A',
  successSubtle: '#0D2A20',
  danger: '#FF453A',
  dangerSubtle: '#2D0F0D',
  infoSubtle: '#051F2E',
  info: '#00AAEE',
};

export type ColorScheme = typeof LightColors;

const Colors = LightColors;
export { Colors };
export default Colors;
