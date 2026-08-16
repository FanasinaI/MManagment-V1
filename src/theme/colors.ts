export interface ThemeColors {
  navy: { 950: string; 900: string; 800: string; 700: string; 600: string };
  gold: { 400: string; 500: string; 600: string; 700: string };
  neutral: { 0: string; 50: string; 100: string; 300: string; 500: string; 700: string; 900: string };
  semantic: {
    income: string;
    expense: string;
    pending: string;
    warning: string;
    danger: string;
    info: string;
  };
  background: { primary: string; surface: string; surfaceAlt: string };
  text: { primary: string; secondary: string; onGold: string; muted: string };
  border: string;
  /** expo-status-bar `style` prop — the content color that reads on this theme's background. */
  statusBar: 'light' | 'dark';
}

const shared = {
  navy: {
    950: '#050B18',
    900: '#0A1428',
    800: '#0F1D3A',
    700: '#16294D',
    600: '#1F3763',
  },
  gold: {
    400: '#F4D794',
    500: '#E8BE6B',
    600: '#C99A3E',
    700: '#A57A28',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F5F6F8',
    100: '#E7E9ED',
    300: '#B7BCC7',
    500: '#7A8194',
    700: '#454C5E',
    900: '#1B1F2A',
  },
  semantic: {
    income: '#3FB27F',
    expense: '#E2574C',
    pending: '#E8BE6B',
    warning: '#F2A93C',
    danger: '#E2574C',
    info: '#4C8FE2',
  },
};

export const darkColors: ThemeColors = {
  ...shared,
  background: {
    primary: '#0A1428',
    surface: '#0F1D3A',
    surfaceAlt: '#16294D',
  },
  text: {
    primary: '#F5F6F8',
    secondary: '#B7BCC7',
    onGold: '#0A1428',
    muted: '#7A8194',
  },
  border: '#1F3763',
  statusBar: 'light',
};

export const lightColors: ThemeColors = {
  ...shared,
  background: {
    primary: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F4',
  },
  text: {
    primary: '#1B1F2A',
    secondary: '#454C5E',
    onGold: '#0A1428',
    muted: '#7A8194',
  },
  border: '#E7E9ED',
  statusBar: 'dark',
};

/** Kept for any lingering static imports — prefer useThemeStore()'s `colors` for anything user-facing. */
export const colors = darkColors;
