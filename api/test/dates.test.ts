import { describe, expect, it } from 'vitest';
import { atLocalTime, localDate, workWeek } from '../src/lib/dates';

describe('fechas del casino', () => {
  it('usa la fecha local de Santiago, no la UTC', () => {
    expect(localDate(new Date('2026-11-25T01:00:00Z'))).toBe('2026-11-24');
  });

  it('entrega lunes a viernes de la semana en curso', () => {
    expect(workWeek('2026-11-24')).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
  });

  it('en fin de semana entrega la semana siguiente', () => {
    expect(workWeek('2026-11-28')[0]).toBe('2026-11-30');
    expect(workWeek('2026-11-29')[0]).toBe('2026-11-30');
  });

  it('convierte la hora local a UTC en verano e invierno', () => {
    expect(atLocalTime('2026-11-24', '12:00').toISOString()).toBe('2026-11-24T15:00:00.000Z');
    expect(atLocalTime('2026-06-24', '12:00').toISOString()).toBe('2026-06-24T16:00:00.000Z');
  });
});
