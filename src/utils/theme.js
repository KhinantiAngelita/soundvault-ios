import { Platform } from 'react-native';

export const CENURA_FONT =
  Platform.OS === 'web'
    ? "'Outfit', 'CenuraGeometric', -apple-system, BlinkMacSystemFont, sans-serif"
    : 'CenuraGeometric';

// Sistem Tema Minimalis (Mode Hitam & Putih) dengan Aksen Light Blue
export const THEMES = {
  dark: {
    mode: 'dark',
    outerBg: '#0A0D12',
    bg: '#0A0D12',
    surface: '#121721',
    surfaceElevated: '#181F2C',
    surfaceActive: '#132337',
    border: '#1E293B',
    borderSubtle: '#172030',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    accent: '#38BDF8',        // Light Blue utama
    accentStrong: '#0EA5E9',  // Sky Blue untuk tombol utama
    accentLight: '#7DD3FC',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    accentBorder: 'rgba(56, 189, 248, 0.35)',
    danger: '#F43F5E',
    overlay: 'rgba(3, 6, 12, 0.75)',
    vinylDisc: '#111620',
    vinylBorder: '#1E293B',
    vinylGroove: '#1A2332',
    vinylCenter: '#132235',
  },
  light: {
    mode: 'light',
    outerBg: '#FFFFFF',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#F1F5F9',
    surfaceActive: '#E0F2FE',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    accent: '#0284C7',        // Light/Sky Blue kontras di background putih
    accentStrong: '#38BDF8',  // Light Blue cerah
    accentLight: '#0369A1',
    accentSoft: 'rgba(56, 189, 248, 0.16)',
    accentBorder: 'rgba(56, 189, 248, 0.45)',
    danger: '#E11D48',
    overlay: 'rgba(15, 23, 42, 0.45)',
    vinylDisc: '#FFFFFF',
    vinylBorder: '#E2E8F0',
    vinylGroove: '#EEF2F6',
    vinylCenter: '#F8FAFC',
  },
};

export const GENRE_LIST = [
  'Pop',
  'Lo-Fi',
  'R&B',
  'Acoustic',
  'Electronic',
  'Indie',
  'Rock',
  'Jazz',
  'Classical',
  'Lainnya',
];
