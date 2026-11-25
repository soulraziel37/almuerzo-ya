import bcrypt from 'bcryptjs';
import { atLocalTime, localDate, workWeek } from '../src/lib/dates';
import { createPrisma } from '../src/lib/db';

// Valores de prueba: precio y capacidad están [POR DEFINIR] con el casino (§4).
const PRICE_CLP = 3500;
const SLOT_CAPACITY = 40;
const INITIAL_STOCK = 60;

type Dish = [name: string, sides: string, isVegetarian: boolean];

// Lunes a viernes, Menú 1 y Menú 2.
const week: [Dish, Dish][] = [
  [
    ['Cazuela de vacuno', 'Pan, fruta y jugo natural', false],
    ['Porotos con mazamorra', 'Ensalada chilena y fruta', true],
  ],
  [
    ['Pollo al jugo con arroz', 'Ensalada surtida, pan y jugo natural', false],
    ['Lasaña de verduras', 'Ensalada verde, pan y fruta', true],
  ],
  [
    ['Pastel de choclo', 'Ensalada de tomate, pan y jugo', false],
    ['Risotto de champiñones', 'Ensalada verde y postre', true],
  ],
  [
    ['Carne mechada con puré', 'Ensalada surtida, pan y jugo', false],
    ['Quiche de espinaca', 'Ensalada de zanahoria y fruta', true],
  ],
  [
    ['Pescado al horno con papas', 'Ensalada chilena, pan y jugo', false],
    ['Fideos con salsa pomodoro', 'Ensalada verde y postre', true],
  ],
];

// 6 franjas de 30 minutos entre las 12:00 y las 15:00.
const slotEdges = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];

const prisma = createPrisma();
const today = localDate();
const dates = workWeek(today);

for (const [dayIndex, date] of dates.entries()) {
  const day = new Date(`${date}T00:00:00Z`);
  const status = date < today ? 'closed' : date === today ? 'published' : 'scheduled';

  for (const [i, [name, sides, isVegetarian]] of week[dayIndex]!.entries()) {
    const slot = i + 1;
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
        priceClp: PRICE_CLP,
        initialStock: INITIAL_STOCK,
        status,
      },
    });
  }

  for (let i = 0; i < slotEdges.length - 1; i++) {
    const startsAt = atLocalTime(date, slotEdges[i]!);
    await prisma.pickupSlot.upsert({
      where: { date_startsAt: { date: day, startsAt } },
      update: {},
      create: {
        date: day,
        startsAt,
        endsAt: atLocalTime(date, slotEdges[i + 1]!),
        capacity: SLOT_CAPACITY,
      },
    });
  }
}

// Usuarios de prueba (AUTH_MODE=mock).
const users = [
  { email: 'estudiante1@example.edu', name: 'Camila Rojas', role: 'student' },
  { email: 'estudiante2@example.edu', name: 'Diego Muñoz', role: 'student' },
  {
    email: 'operador@example.edu',
    name: 'Operador Casino',
    role: 'operator',
    loginId: 'OP-0001',
    passwordHash: await bcrypt.hash('operador123', 10),
  },
] as const;

for (const user of users) {
  await prisma.user.upsert({ where: { email: user.email }, update: {}, create: user });
}

console.log(`Seed listo: semana del ${dates[0]}, hoy ${today}.`);
await prisma.$disconnect();
