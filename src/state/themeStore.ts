import { create } from 'zustand';

import { appSettingsService, type ThemeMode } from '@/services/settings/appSettingsService';
import { darkColors, lightColors, type ThemeColors } from '@/theme/colors';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

function colorsFor(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? lightColors : darkColors;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  colors: darkColors,
  hydrated: false,

  async hydrate() {
    const mode = await appSettingsService.getThemeMode();
    set({ mode, colors: colorsFor(mode), hydrated: true });
  },

  async toggle() {
    await get().setMode(get().mode === 'dark' ? 'light' : 'dark');
  },

  async setMode(mode) {
    await appSettingsService.setThemeMode(mode);
    set({ mode, colors: colorsFor(mode) });
  },
}));
