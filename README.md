# Reserva UM

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
- [x] Fase 5 · Operador
- Fase 6 · Entra ID: omitida (prototipo)
- [x] Fase 7 · Pulido

## Actualizaciones (noviembre 2026)

Demo publicada: https://almuerzo-ya.onrender.com (pide una clave de demo).

**Arreglos**

- Tope de almuerzos por estudiante y día (`MAX_LUNCHES_PER_DAY`, 10). Se revisa con un bloqueo
  en la base, así que dos pedidos al mismo tiempo no pueden pasarse.
- Franjas de retiro automáticas: 6 franjas de 12:00 a 15:00, con 40 almuerzos cada una. El
  cupo cuenta almuerzos, no pedidos.
- Cada pedido guarda el nombre del plato, aunque después cambie el menú.
- Los pedidos pagados y no retirados vencen y muestran un aviso claro.
- Límites de intentos por usuario con sesión y por IP para el ingreso. Así no se bloquea a
  toda la universidad, que comparte una misma IP.
- Las claves de Render (`DEMO_ACCESS_CODE`, `OPERATOR_PASSWORD`) ignoran espacios y saltos de
  línea pegados al borde. El campo de contraseña no pone mayúscula automática.

**Nuevo**

- Simulación del refrigerador de retiro (pestaña Refri) y "Modo tótem" a pantalla completa.
- Rediseño: paleta verde con contraste AA en claro y oscuro, animaciones, confeti, sonidos,
  QR ampliable y progreso del pedido.
- Íconos nuevos y nombre nuevo: **Reserva UM**.
- La app web funciona en el celular por la red local (usa la IP del PC para llamar a la API).

**Publicación**

- `render.yaml` publica la base, la API y la web en Render ([docs/PUBLICAR.md](docs/PUBLICAR.md)).
- Publicada, la API exige una clave de demo, una clave de operador y secretos largos.
- 53 tests de la API.

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
- Máximo por estudiante y día: `MAX_LUNCHES_PER_DAY` (10, por confirmar con el casino).
- Las franjas se crean solas los días con menú; su cupo (40) cuenta almuerzos, no pedidos.
- Un pedido pagado que no se retira vence al cerrar el día o, si nadie lo cierra, al día
  siguiente.
- El pago es simulado: "Marcar como pagado" deja el pedido pagado y muestra su QR.
- Al instalar librerías nuevas, reiniciar el servidor de Expo.

## Probar el flujo del operador

- Ingreso: pestaña "Operador", `OP-0001` / `operador123`.
- Escanear: la cámara lee el QR sola, sin botón (el canvas tenía uno); "Código" permite escribirlo.
- "Modo tótem" muestra el refrigerador a pantalla completa, sin las pestañas del operador.
- Refri: simulación del refrigerador de retiro. Con el QR (o el código escrito) del estudiante se
  abre la puerta y el pedido queda entregado; cada QR abre una sola vez.
- "Cerrar día" no se puede deshacer: detiene las ventas y expira lo no retirado.
- Las fotos de los platos se guardan en `api/uploads/`.

## Apariencia y accesibilidad

- Animaciones con Reanimated; con "Reducir movimiento" se desactivan.
- En web la barra de pestañas va abajo en celulares y arriba desde 600 px.
- Modo claro y oscuro según el ajuste del teléfono (`mobile/src/theme/palette.ts`).
- Respeta "Reducir transparencia"; etiquetas y avisos para VoiceOver.
- El stock y los contadores se actualizan cada 5 s, solo con la app en primer plano.

## Seguridad de la API

- Límite de 300 peticiones por minuto: por usuario con sesión, o por IP sin ella
  (`RATE_LIMIT_PER_MINUTE`). El ingreso se limita siempre por IP: 20 para operadores y 120
  para estudiantes (`AUTH_RATE_LIMIT_PER_MINUTE`, `STUDENT_AUTH_RATE_LIMIT_PER_MINUTE`).
- Cabeceras de seguridad (Helmet), cuerpos de hasta 32 KB (3 MB al subir fotos) y
  `CORS_ORIGINS` para limitar los orígenes web.
- Publicada: exige clave de demo, clave de operador y secretos largos; si faltan no arranca.
- Para compartirla fuera de tu red: [docs/PUBLICAR.md](docs/PUBLICAR.md).

## Tests y tipos

Los tests de la API usan la base `almuerzo_test`: levantar antes `docker compose up -d db`.

```powershell
npm --prefix api install; npm --prefix api run db:generate
```

```powershell
npm --prefix api test; npm --prefix api run typecheck; npm --prefix mobile run typecheck
```

## Diferencias con el documento

- Sin Entra ID (§9): se entra con usuarios de prueba (`AUTH_MODE=mock`).
- Sin Apple Pay ni Webpay (§10): es un prototipo y el pago se marca con un botón. Por eso no
  hay selección de medio de pago ni pantallas de pasarela o de resultado.
- La paleta cambió respecto de §8: verde más profundo, neutros y estados con contraste AA en
  claro y oscuro (`mobile/src/theme/palette.ts`).
- La pestaña Refri no está en el documento: es una alternativa al retiro en mesón.
- Un QR por pedido (§4); el canvas menciona uno por almuerzo.
- "Mesón 2 · Turno almuerzo" es un texto fijo del canvas: el modelo no tiene mesones.
- "Cerrar sesión" del operador está en la pestaña Menús.
- Las rutas viven en `mobile/src/app/` (estructura actual de la plantilla de Expo).
- `User` tiene un campo `loginId` para el ID de operador.
- La base de datos solo se publica en `127.0.0.1`.
