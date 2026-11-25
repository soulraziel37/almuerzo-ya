import { create } from 'zustand';

import type { Session } from '@/api/types';
import { useCart } from '@/store/cart';
import { storage } from '@/store/storage';

const KEY = 'almuerzoya.session';

type SessionState = {
  /** `false` mientras se lee la sesión guardada. */
  ready: boolean;
  session: Session | null;
  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<SessionState>((set) => ({
  ready: false,
  session: null,
  hydrate: async () => {
    let session: Session | null = null;
    try {
      const saved = await storage.get(KEY);
      session = saved ? (JSON.parse(saved) as Session) : null;
    } catch {
      // Dato ilegible: se parte sin sesión.
    }
    set({ ready: true, session });
  },
  signIn: async (session) => {
    await storage.set(KEY, JSON.stringify(session));
    set({ session });
  },
  signOut: async () => {
    useCart.getState().clear();
    set({ session: null });
    await storage.remove(KEY);
  },
}));
