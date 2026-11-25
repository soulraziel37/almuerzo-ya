export type Role = 'student' | 'operator' | 'admin';

export type User = { id: string; name: string; email: string; role: Role };

export type Session = { token: string; user: User };

export type Menu = {
  id: string;
  slot: number;
  name: string;
  sides: string;
  isVegetarian: boolean;
  priceClp: number;
  salesOpen: boolean;
  available: number;
};

export type TodayMenu = {
  date: string;
  reservationsOpen: boolean;
  cutoff: string;
  serviceFeeClp: number;
  maxPerMenu: number;
  menus: Menu[];
};

export type PickupSlot = {
  id: string;
  time: string;
  endTime: string;
  remaining: number;
  available: boolean;
};

export type PaymentMethod = 'apple_pay' | 'webpay';

export type OrderStatus = 'pending_payment' | 'paid' | 'delivered' | 'cancelled' | 'expired';

export type Order = {
  id: string;
  shortCode: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalClp: number;
  createdAt: string;
  expiresAt: string | null;
  pickup: { date: string; time: string; endTime: string };
  items: { menuId: string; slot: number; name: string; qty: number; unitPriceClp: number }[];
};
