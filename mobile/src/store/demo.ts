import { create } from 'zustand';

import { storage } from '@/store/storage';

const KEY = 'almuerzoya.demo';

type DemoState = {
  /** Clave de la demo publicada; vacía en uso local. */
  code: string;
  hydrate: () => Promise<void>;
  setCode: (code: string) => void;
};

export const useDemo = create<DemoState>((set) => ({
  code: '',
  hydrate: async () => {
    const code = await storage.get(KEY).catch(() => null);
    if (code) set({ code });
  },
  setCode: (code) => {
    set({ code });
    void storage.set(KEY, code);
  },
}));
