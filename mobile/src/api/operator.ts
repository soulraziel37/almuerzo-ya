import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';

const POLL_MS = 5000;

export type Ticket = {
  id: string;
  shortCode: string;
  student: string;
  pickup: { time: string; endTime: string };
  items: { slot: number; name: string; qty: number; photoUrl: string | null }[];
};

/** Bandeja del refrigerador: la etiqueta solo lleva el final del código. */
export type Tray = Omit<Ticket, 'shortCode'> & { codeEnd: string };

export type FridgeResult = { opened: true; order: Ticket } | { opened: false; message: string };

export type Verification =
  | { result: 'valid'; order: Ticket }
  | { result: 'delivered'; message: string; order: Ticket }
  | { result: 'invalid'; message: string };

export type ManagedMenu = {
  id: string;
  date: string;
  slot: 1 | 2;
  name: string;
  sides: string;
  isVegetarian: boolean;
  priceClp: number;
  photoUrl: string | null;
  state: 'published' | 'scheduled' | 'closed';
  salesOpen: boolean;
  initialStock: number;
  reserved: number;
  sold: number;
  available: number;
};

export type Week = {
  today: string;
  cutoff: string;
  days: { date: string; menus: ManagedMenu[] }[];
};

export type MenuInput = {
  name: string;
  sides: string;
  isVegetarian: boolean;
  priceClp: number;
  photoBase64?: string;
};

export const useSummary = () =>
  useQuery({
    queryKey: ['summary'],
    queryFn: () => api<{ delivered: number; pending: number }>('/operator/summary'),
    refetchInterval: POLL_MS,
  });

export const useFridge = () =>
  useQuery({
    queryKey: ['fridge'],
    queryFn: () => api<Tray[]>('/operator/fridge'),
    refetchInterval: POLL_MS,
  });

export const useStock = () =>
  useQuery({
    queryKey: ['stock'],
    queryFn: () => api<{ date: string; menus: ManagedMenu[] }>('/operator/stock'),
    refetchInterval: POLL_MS,
  });

export const useWeek = () =>
  useQuery({
    queryKey: ['week'],
    queryFn: () => api<Week>('/operator/menus'),
    refetchInterval: POLL_MS,
  });

/** Cada lectura se valida de nuevo: no se reutilizan respuestas anteriores. */
export const useVerification = (input: { token?: string; code?: string }) =>
  useQuery({
    queryKey: ['verify', input.token ?? '', input.code ?? ''],
    queryFn: () => api<Verification>('/operator/verify', { body: input }),
    gcTime: 0,
    staleTime: Infinity,
  });

/** Operación que cambia datos: al terminar se refrescan las vistas del operador. */
function useOperatorMutation<Input, Output>(run: (input: Input) => Promise<Output>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () =>
      Promise.all(
        ['summary', 'stock', 'week', 'fridge'].map((key) => client.invalidateQueries({ queryKey: [key] })),
      ),
  });
}

export const useDeliver = () =>
  useOperatorMutation((id: string) =>
    api<{ deliveredAt: string }>(`/operator/orders/${id}/deliver`, { body: {} }),
  );

export const useOpenFridge = () =>
  useOperatorMutation((input: { token: string } | { code: string }) =>
    api<FridgeResult>('/operator/fridge/open', { body: input }),
  );

export const useUpdateStock = () =>
  useOperatorMutation(
    ({ id, ...change }: { id: string; stockDelta?: number; salesOpen?: boolean }) =>
      api<ManagedMenu>(`/operator/menus/${id}/stock`, { method: 'PATCH', body: change }),
  );

export const useCloseDay = () =>
  useOperatorMutation(() =>
    api<{ released: number; notPickedUp: number }>('/operator/close-day', { body: {} }),
  );

export const useSaveMenu = () =>
  useOperatorMutation(
    (
      input:
        | (MenuInput & { id: string })
        | (MenuInput & { id?: undefined; date: string; slot: number; initialStock: number }),
    ) => {
      if (input.id === undefined) return api<ManagedMenu>('/operator/menus', { body: input });
      const { id, ...body } = input;
      return api<ManagedMenu>(`/operator/menus/${id}`, { method: 'PUT', body });
    },
  );
