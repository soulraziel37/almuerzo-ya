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
  photoUrl: string | null;
  /** Unidades publicadas para el día. */
  stock: number;
  available: number;
};

export type TodayMenu = {
  date: string;
  reservationsOpen: boolean;
  /** `null` cuando la API no aplica el horario de cierre (modo de prueba). */
  cutoff: string | null;
  serviceFeeClp: number;
  maxPerMenu: number;
  maxPerDay: number;
  /** Almuerzos que el estudiante todavía puede reservar hoy. */
  remainingToday: number;
  menus: Menu[];
};

export type PickupSlot = {
  id: string;
  time: string;
  endTime: string;
  capacity: number;
  /** Cupos libres, en almuerzos. */
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
  /** Contenido del QR; solo en el detalle de un pedido pagado. */
  qrToken?: string | null;
  totalClp: number;
  /** Un pedido `expired` con pago es uno que no se retiró. */
  wasPaid: boolean;
  createdAt: string;
  expiresAt: string | null;
  pickup: { date: string; time: string; endTime: string };
  items: { menuId: string; slot: number; name: string; qty: number; unitPriceClp: number }[];
};
