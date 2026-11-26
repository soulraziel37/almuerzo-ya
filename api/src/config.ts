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
  /** Clave para entrar a la demo publicada en internet. Vacía en uso local. */
  DEMO_ACCESS_CODE: z.preprocess(
    // Sin espacios ni saltos de línea al borde: se cuelan al pegar la clave en el panel.
    (value) => (typeof value === 'string' ? value.trim() : value) || undefined,
    z.string().min(8, 'DEMO_ACCESS_CODE debe tener al menos 8 caracteres').optional(),
  ),
  /** Peticiones por minuto: por usuario si hay una sesión válida, si no por IP. En una
   *  universidad muchos equipos comparten la misma IP. */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
  /** Ingreso de operador, por IP: frena la prueba de contraseñas. */
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  /** Ingreso de estudiantes, por IP: más amplio porque no hay contraseña que adivinar y la
   *  clave de demo tiene su propio límite de intentos. */
  STUDENT_AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  /** Proxies de confianza delante de la API; con 0 no se lee `X-Forwarded-For`. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  /** Orígenes web permitidos, separados por comas. */
  CORS_ORIGINS: z.preprocess(
    (value) =>
      typeof value === 'string' && value ? value.split(',').map((o) => o.trim()) : undefined,
    z.array(z.url()).optional(),
  ),
  // [POR DEFINIR] con el casino (§4).
  SERVICE_FEE_CLP: z.coerce.number().int().min(0).default(0),
  MAX_QTY_PER_MENU: z.coerce.number().int().positive().default(5),
  /** Por estudiante y día, sumando todos sus pedidos. Por defecto, 5 de cada menú. */
  MAX_LUNCHES_PER_DAY: z.coerce.number().int().positive().default(10),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const config = envSchema.parse(env);
  // Publicada en internet, la API no arranca abierta a cualquiera ni con claves débiles.
  if (env.RENDER) {
    if (!config.DEMO_ACCESS_CODE) {
      throw new Error('Falta DEMO_ACCESS_CODE: es obligatoria en la API publicada.');
    }
    for (const name of ['JWT_SECRET', 'QR_SECRET'] as const) {
      if (config[name].length < 32 || config[name].startsWith('cambia-esto')) {
        throw new Error(`${name} debe ser un secreto aleatorio de al menos 32 caracteres.`);
      }
    }
  }
  return config;
}
