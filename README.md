# Almuerzo Ya

Prototipo iOS para reservar, pagar y retirar el almuerzo del casino.
Documento del proyecto: [docs/PROYECTO.md](docs/PROYECTO.md) · Diseño: [docs/design](docs/design/LEEME.md)

| Carpeta | Contenido |
|---|---|
| `mobile/` | Expo SDK 58 + Expo Router + TypeScript |
| `api/` | Node 22 + Fastify + Prisma 7 |
| `docker-compose.yml` | PostgreSQL 16, API y servidor de Expo |

## Estado

- [x] Fase 1 · Base
- [x] Fase 2 · Design system
- [x] Fase 3 · Estudiante
- [x] Fase 4 · Pagos (simulados)
- [ ] Fase 5 · Operador
- [ ] Fase 6 · Entra ID
- [ ] Fase 7 · Pulido

## Levantar

Requiere Docker Desktop.

```powershell
Copy-Item .env.example .env   # poner la IP LAN del PC en HOST_LAN_IP (ipconfig)
```

```powershell
docker compose up --build -d
```

- App web: http://localhost:8081
- API: http://localhost:3000/health

Al arrancar, la API aplica las migraciones y carga los datos de prueba: semana actual con
2 menús por día, franjas de 12:00 a 15:00 y los usuarios de prueba
(operador `OP-0001` / `operador123`). Precio, capacidad y stock son valores de relleno.

## Abrir en el iPhone

1. Instalar **Expo Go** desde el App Store (versión compatible con SDK 58) y crear o usar una cuenta Expo.
2. Iniciar sesión en el servidor con la misma cuenta (una sola vez). Dentro de Docker solo
   funciona con usuario y contraseña:

   ```powershell
   docker compose run --rm --no-deps mobile npx expo login --no-browser
   ```

   Si la cuenta entra con Google, correr Expo fuera de Docker y usar el login por navegador:

   ```powershell
   docker compose stop mobile; cd mobile; npx expo login --browser; npx expo start --lan
   ```

3. Escanear el código QR con la cámara (misma red que el PC). Con Docker se ve así:

   ```powershell
   docker compose attach mobile
   ```

   Fuera de Docker, si Expo elige otra IP, fijar `$env:REACT_NATIVE_PACKAGER_HOSTNAME`
   antes de `npx expo start`.

Si no conecta: revisar `HOST_LAN_IP` y permitir los puertos 8081 y 3000 en el Firewall de
Windows para la red privada.

## Recarga de cambios en Windows

Con el repositorio en el disco de Windows, Metro dentro de Docker no detecta los cambios.
Opciones:

- Reiniciar el servicio: `docker compose restart mobile`.
- Correr Expo fuera de Docker (recarga en vivo), con la API en Docker:

  ```powershell
  docker compose stop mobile
  ```

  ```powershell
  npm --prefix mobile install; npm --prefix mobile start
  ```

## Probar el flujo del estudiante

- Ingreso: "Iniciar con Microsoft" muestra los usuarios de prueba (`AUTH_MODE=mock`).
- Las reservas cierran a las 11:30. Para probar a cualquier hora, poner
  `ENFORCE_RESERVATION_WINDOW=false` en `.env` y correr `docker compose up -d api`.
- Un pedido sin pagar expira a los `ORDER_TTL_MINUTES` (15) y devuelve el stock.
- El pago es simulado: "Marcar como pagado" deja el pedido pagado y muestra su QR.
- Al instalar librerías nuevas, reiniciar el servidor de Expo.

## Tests y tipos

Los tests de la API usan la base `almuerzo_test`: levantar antes `docker compose up -d db`.

```powershell
npm --prefix api install; npm --prefix api run db:generate
```

```powershell
npm --prefix api test; npm --prefix api run typecheck; npm --prefix mobile run typecheck
```

## Diferencias con el documento

- Sin Apple Pay ni Webpay (§10): es un prototipo y el pago se marca con un botón. Por eso no
  hay selección de medio de pago ni pantallas de pasarela o de resultado.
- Un QR por pedido (§4); el canvas menciona uno por almuerzo.
- Las rutas viven en `mobile/src/app/` (estructura actual de la plantilla de Expo).
- `User` tiene un campo `loginId` para el ID de operador.
- La base de datos solo se publica en `127.0.0.1`.
