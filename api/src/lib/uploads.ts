import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AppError } from './errors';

const MAX_BYTES = 2 * 1024 * 1024;
const FILE_NAME = /^[0-9a-f-]{36}\.jpg$/;

/** Guarda una foto JPEG recibida en base64 y devuelve su ruta pública. */
export async function savePhoto(directory: string, base64: string): Promise<string> {
  const data = Buffer.from(base64, 'base64');
  const isJpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (!isJpeg || data.length > MAX_BYTES) {
    throw new AppError(400, 'invalid_photo', 'La foto debe ser JPEG de hasta 2 MB.');
  }
  const name = `${randomUUID()}.jpg`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), data);
  return `/uploads/${name}`;
}

/**
 * Publica una foto incluida en el repositorio. El nombre sale del contenido, así que
 * repetirlo no acumula copias y la restaura si el disco se vació.
 */
export async function publishPhoto(directory: string, data: Buffer): Promise<string> {
  const hex = createHash('sha256').update(data).digest('hex');
  const name = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}.jpg`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), data);
  return `/uploads/${name}`;
}

/** El nombre se valida contra un patrón fijo: no admite rutas. */
export async function readPhoto(directory: string, name: string): Promise<Buffer | null> {
  if (!FILE_NAME.test(name)) return null;
  return readFile(path.join(directory, name)).catch(() => null);
}
