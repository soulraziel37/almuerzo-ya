import { create } from 'zustand';

type CartState = {
  /** Fecha del menú al que pertenecen los ítems. */
  date: string | null;
  /** Cantidad por id de menú. */
  items: Record<string, number>;
  setQty: (date: string, menuId: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  date: null,
  items: {},
  setQty: (date, menuId, qty) =>
    set((state) => {
      // Un carrito de otro día ya no sirve.
      const items = state.date === date ? { ...state.items } : {};
      if (qty > 0) items[menuId] = qty;
      else delete items[menuId];
      return { date, items };
    }),
  clear: () => set({ date: null, items: {} }),
}));
