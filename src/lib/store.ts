import { create } from 'zustand';

interface AppState {
  isLoading: boolean;
  isMenuOpen: boolean;
  setLoading: (loading: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  isMenuOpen: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}));
