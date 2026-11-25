import { z } from 'zod';

const flag = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  AUTH_MODE: z.enum(['mock', 'entra']).default('mock'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres'),
  /** Firma los códigos QR de retiro. */
  QR_SECRET: z.string().min(8, 'QR_SECRET debe tener al menos 8 caracteres'),
  /** En `false` permite reservar a cualquier hora (solo para probar el prototipo). */
  ENFORCE_RESERVATION_WINDOW: flag.default(true),
  RESERVATION_CUTOFF: z.string().regex(/^\d{2}:\d{2}$/).default('11:30'),
  ORDER_TTL_MINUTES: z.coerce.number().positive().default(15),
  // [POR DEFINIR] con el casino (§4).
  SERVICE_FEE_CLP: z.coerce.number().int().min(0).default(0),
  MAX_QTY_PER_MENU: z.coerce.number().int().positive().default(5),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  return envSchema.parse(env);
}
