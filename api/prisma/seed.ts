import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { localDate, workWeek } from '../src/lib/dates';
import { createPrisma } from '../src/lib/db';
import { publishPhoto } from '../src/lib/uploads';
import { ensureSlots } from '../src/services/slots';

// Valores de prueba: el precio está [POR DEFINIR] con el casino (§4).
const PRICE_CLP = 3500;
const INITIAL_STOCK = 60;

/** `photo` es un archivo de `prisma/photos/` (créditos en `CREDITOS.md`). */
type Dish = [name: string, sides: string, isVegetarian: boolean, photo?: string];

// Lunes a viernes, Menú 1 y Menú 2.
const week: [Dish, Dish][] = [
  [
    ['Cazuela de vacuno', 'Pan, fruta y jugo natural', false, 'cazuela'],
    ['Porotos con mazamorra', 'Ensalada chilena y fruta', true, 'porotos'],
  ],
  [
    ['Pollo al jugo con arroz', 'Ensalada surtida, pan y jugo natural', false, 'pollo-arroz'],
    ['Lasaña de verduras', 'Ensalada verde, pan y fruta', true, 'lasana'],
  ],
  [
    ['Pastel de choclo', 'Ensalada de tomate, pan y jugo', false, 'pastel-choclo'],
    ['Risotto de champiñones', 'Ensalada verde y postre', true, 'risotto'],
  ],
  [
    ['Carne mechada con puré', 'Ensalada surtida, pan y jugo', false, 'carne-pure'],
    ['Quiche de espinaca', 'Ensalada de zanahoria y fruta', true, 'quiche'],
  ],
  [
    ['Pescado al horno con papas', 'Ensalada chilena, pan y jugo', false, 'pescado'],
    ['Fideos con salsa pomodoro', 'Ensalada verde y postre', true, 'fideos'],
  ],
];

/** Copia la foto de ejemplo a la carpeta que sirve la API y devuelve su ruta pública. */
async function examplePhoto(photo: string): Promise<string> {
  const data = await readFile(new URL(`./photos/${photo}.jpg`, import.meta.url));
  return publishPhoto('uploads', data);
}

const prisma = createPrisma();
const today = localDate();
const dates = workWeek(today);

for (const [dayIndex, date] of dates.entries()) {
  const day = new Date(`${date}T00:00:00Z`);
  const status = date < today ? 'closed' : date === today ? 'published' : 'scheduled';

  for (const [i, [name, sides, isVegetarian, photo]] of week[dayIndex]!.entries()) {
    const slot = i + 1;
    const photoUrl = photo ? await examplePhoto(photo) : null;
    // update vacío: volver a correr el seed no pisa el stock ya vendido.
    await prisma.menu.upsert({
      where: { date_slot: { date: day, slot } },
      update: {},
      create: {
        date: day,
        slot,
        name,
        sides,
        isVegetarian,
        photoUrl,
        priceClp: PRICE_CLP,
        initialStock: INITIAL_STOCK,
        status,
      },
    });
  }

  // Menús de ejemplo creados antes de tener fotos: se completan sin pisar fotos subidas.
  for (const [name, , , photo] of week[dayIndex]!) {
    if (!photo) continue;
    await prisma.menu.updateMany({
      where: { date: day, name, photoUrl: null },
      data: { photoUrl: await examplePhoto(photo) },
    });
  }

  await ensureSlots(prisma, date);
}

// Usuarios de prueba (AUTH_MODE=mock). La clave del operador por defecto es pública:
// una API publicada debe definir OPERATOR_PASSWORD.
const operatorPassword = process.env.OPERATOR_PASSWORD;
if (process.env.RENDER && (operatorPassword?.length ?? 0) < 8) {
  throw new Error('Falta OPERATOR_PASSWORD (mínimo 8 caracteres) en la API publicada.');
}
const users = [
  { email: 'estudiante1@example.edu', name: 'Camila Rojas', role: 'student' },
  { email: 'estudiante2@example.edu', name: 'Diego Muñoz', role: 'student' },
  {
    email: 'operador@example.edu',
    name: 'Operador Casino',
    role: 'operator',
    loginId: 'OP-0001',
    passwordHash: await bcrypt.hash(operatorPassword || 'operador123', 10),
  },
] as const;

for (const user of users) {
  // Si se define OPERATOR_PASSWORD, reemplaza la clave guardada.
  const update =
    operatorPassword && 'passwordHash' in user ? { passwordHash: user.passwordHash } : {};
  await prisma.user.upsert({ where: { email: user.email }, update, create: user });
}

console.log(`Seed listo: semana del ${dates[0]}, hoy ${today}.`);
await prisma.$disconnect();
