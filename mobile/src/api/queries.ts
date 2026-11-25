import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import type { Order, PaymentMethod, PickupSlot, TodayMenu, User } from '@/api/types';

// Stock y estados "en tiempo real" por polling (§6).
const POLL_MS = 5000;

export const useTodayMenu = () =>
  useQuery({
    queryKey: ['menu'],
    queryFn: () => api<TodayMenu>('/menus/today'),
    refetchInterval: POLL_MS,
  });

export const useSlots = () =>
  useQuery({
    queryKey: ['slots'],
    queryFn: () => api<PickupSlot[]>('/pickup-slots/today'),
    refetchInterval: POLL_MS,
  });

export const useOrders = () =>
  useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Order[]>('/orders'),
    refetchInterval: POLL_MS,
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ['orders', id],
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: POLL_MS,
  });

export const useMockUsers = (enabled: boolean) =>
  useQuery({
    queryKey: ['mock-users'],
    queryFn: () => api<Omit<User, 'role'>[]>('/auth/mock/users'),
    enabled,
  });

type NewOrder = {
  items: { menuId: string; qty: number }[];
  pickupSlotId: string;
  paymentMethod: PaymentMethod;
};

/** Toda operación sobre pedidos cambia stock y cupos: se refrescan los datos. */
export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (order: NewOrder) => api<Order>('/orders', { body: order }),
    onSettled: () => client.invalidateQueries(),
  });
}

export function useCancelOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<Order>(`/orders/${id}/cancel`, { body: {} }),
    onSettled: () => client.invalidateQueries(),
  });
}
