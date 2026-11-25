# Almuerzo Ya — prototipo funcional iOS

> Documento de proyecto + instrucciones para Claude Code.
> Diseño de referencia (13 pantallas): canvas "Almuerzo Ya – App iOS" en Claude.

---

## 1. La idea

En la universidad, a la hora de almuerzo se forman filas largas en el casino y los menús se agotan antes de que todos alcancen a comprar. **Almuerzo Ya** permite al estudiante **reservar y pagar su almuerzo desde el iPhone** antes de la hora punta y **retirarlo mostrando un código QR**. El personal del casino **escanea el QR, valida el pedido y lo entrega**, y administra el **stock** y los **menús del día**.

**Objetivos del prototipo**

- Validar el flujo completo: login → menú → carrito → pago → QR → escaneo → entrega.
- Tener control de stock en tiempo real (nadie paga un almuerzo que ya no existe).
- Que se vea y se sienta como una app nativa de iOS 26+ (Liquid Glass, SF, tab bar flotante, sheets).

---

## 2. Roles

| Rol | Cómo entra | Qué hace |
|---|---|---|
| **Estudiante** | Botón **"Iniciar con Microsoft"** (Entra ID, cuenta universitaria) | Ve el menú del día, arma el carrito, elige hora de retiro, paga (Apple Pay o Webpay), recibe un QR por pedido |
| **Operador** (casino) | ID de operador + contraseña *(o Entra ID con rol, ver §9)* | Escanea QR, confirma entregas, ajusta stock, pausa ventas, crea/edita menús de la semana |

---

## 3. Pantallas (según el canvas)

**Estudiante**
1. **Login** — selector Estudiante / Operador. Estudiante: solo el botón "Iniciar con Microsoft".
2. **Menú del día** — 2 menús por día (Menú 1 / Menú 2), stock restante ("Quedan 42", "Últimos 8", "Agotado"), aviso de horario de reservas y retiro. CTA "Agregar al carrito". Tab bar flotante: Menú · Mis pedidos · Perfil.
3. **Carrito** — stepper de cantidad, quitar ítem, "Agregar otro menú", resumen (subtotal, cargo, total), estado vacío.
4. **Hora de retiro y método de pago** — franjas de 30 min (algunas llenas), Apple Pay o Webpay.
5. **Apple Pay** — sheet de confirmación.
6. **Webpay** — vista web segura (in-app browser) con el formulario oficial de Transbank.
7. **Resultado del pago** — aprobado / rechazado.
8. **Mis pedidos / QR** — ticket con QR, código corto (ej. `A7F3-29`), menú, franja y lugar.

**Operador**
9. **Escanear** — cámara con visor, contadores (entregados / por retirar), ingreso de código manual. Tab bar: Escanear · Stock · Menús.
10. **Validar y entregar** — sheet con resultado: válido / ya entregado / no válido; botón "Confirmar entrega".
11. **Control de stock** — por menú: stock, vendidos, disponibles, barra de avance, stepper, switch "ventas abiertas", "Cerrar día".
12. **Menús de la semana** — selector Lun–Vie, Menú 1 / Menú 2 por día con estado (Publicado, Programado, Finalizado) o "Agregar plato".
13. **Agregar menú** — tipo (Menú 1/2), foto, nombre, acompañamientos, vegetariano, fecha, precio, stock inicial, "Publicar".

---

## 4. Reglas de negocio (supuestos a confirmar con el casino)

- 2 menús por día. Reservas hasta **11:30**; retiro **12:00–15:00** en franjas de 30 min con capacidad por franja.
- El stock se **reserva** al crear el pedido (`pending_payment`) y se **libera** si el pago falla o expira (15 min).
- Un QR por pedido; es de **un solo uso**. Re-escanearlo muestra "Ya fue entregado".
- Pedido no retirado al cierre → `expired` (política de reembolso: **[POR DEFINIR]**).
- Precios en CLP enteros. Precio y cargo por servicio: **[POR DEFINIR]**.
- Máximo de almuerzos por estudiante por día: **[POR DEFINIR]** (el prototipo usa 5 por ítem).

---

## 5. Modelo de datos

```
User        id, entraOid?, email, name, role (student|operator|admin), passwordHash?
Menu        id, date, slot (1|2), name, sides, isVegetarian, priceClp, photoUrl?,
            initialStock, reservedCount, soldCount, salesOpen, status (draft|scheduled|published|closed)
PickupSlot  id, date, startsAt, endsAt, capacity, bookedCount
Order       id, shortCode, userId, pickupSlotId, status (pending_payment|paid|delivered|cancelled|expired),
            paymentMethod (apple_pay|webpay), totalClp, qrTokenHash, createdAt, paidAt?, deliveredAt?, deliveredById?
OrderItem   id, orderId, menuId, qty, unitPriceClp
Payment     id, orderId, provider, providerToken, status, amountClp, rawResponse (json), createdAt
```

Operaciones críticas (reservar stock, confirmar pago, canjear QR) dentro de **transacciones SQL** con `UPDATE ... WHERE available >= qty` / `WHERE status = 'paid'` para evitar sobreventa y doble entrega.

---

## 6. Stack

| Capa | Tecnología |
|---|---|
| App iOS | **React Native + Expo (SDK más reciente) + Expo Router + TypeScript** |
| Look iOS nativo | `expo-glass-effect` (`GlassView`, `GlassContainer`), `NativeTabs` de Expo Router (tab bar Liquid Glass), `@expo/ui` (componentes SwiftUI: switch, segmented, botones), sheets nativos (`presentation: 'formSheet'`), fuente del sistema (SF), `expo-symbols` (SF Symbols) |
| Estado / datos | TanStack Query + Zustand (carrito) |
| QR | `react-native-qrcode-svg` (generar) · `expo-camera` `CameraView` con `barcodeScannerSettings` (escanear) |
| Auth | `expo-auth-session` contra Microsoft Entra ID (OIDC + PKCE) · `expo-secure-store` |
| Pagos | Webpay Plus vía `transbank-sdk` (Node) en **ambiente de integración** · Apple Pay **simulado** en el prototipo |
| API | Node 22 + Fastify + Zod + Prisma |
| BD | PostgreSQL 16 |
| Tiempo real | Server-Sent Events o polling cada 5 s (stock y contadores) |
| Infra local | Docker Desktop (WSL2) + docker compose |

---

## 7. Limitación importante: iOS en Windows

**El Simulador de iOS solo corre en macOS con Xcode.** No se puede ejecutar dentro de Docker ni en Windows. Con este setup hay tres formas de "ver iOS":

1. **iPhone real + Expo Go** *(recomendada)*: el servidor de Expo corre en Docker, el iPhone escanea el QR de Expo y la app corre de verdad en iOS, con Liquid Glass real.
2. **Vista web** (`react-native-web`) en el navegador del PC dentro de un marco de iPhone, para iterar rápido. Ojo: `GlassView` en web cae a un `View` normal, así que hay que implementar un *fallback* con `backdrop-filter`.
3. **EAS Build (nube)**: generar un *development build* o TestFlight sin Mac. Es necesario para Apple Pay real y para módulos nativos que no vienen en Expo Go. Requiere cuenta de Apple Developer.

---

## 8. Design system (tokens del canvas)

```ts
// mobile/src/theme/tokens.ts
export const colors = {
  bg: '#F2F2F7',          // systemGroupedBackground
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  separator: 'rgba(60,60,67,0.29)',
  accent: '#1E7B37',      // verde marca (contraste AA sobre blanco)
  accentSoft: '#D8F0DC',
  warning: '#C93400',     // stock bajo
  danger: '#D70015',
  link: '#0A64D8',
  switchOn: '#34C759',
};
export const radius = { card: 26, sheet: 38, tile: 16, pill: 999 };
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title2:     { fontSize: 22, fontWeight: '700' },
  headline:   { fontSize: 17, fontWeight: '600' },
  body:       { fontSize: 17 },
  subhead:    { fontSize: 15 },
  footnote:   { fontSize: 13 },
  caption:    { fontSize: 12 },
};
```

Reglas: listas agrupadas *inset* (radio 26), botones primarios en cápsula de 52 pt de alto, áreas táctiles ≥ 44 pt, **controles flotantes (tab bar, botones de navegación, chips sobre imágenes) en Liquid Glass**, contenido en superficies opacas. Usar SF Symbols reales (`expo-symbols`) en vez de SVG. Respetar *Reduce Transparency* (`AccessibilityInfo`) y modo oscuro.

---

## 9. Autenticación

- **Estudiante → Entra ID.** Registrar una app en Azure (Entra ID) de tipo *Mobile and desktop*. La app usa `expo-auth-session` (código + PKCE) contra `https://login.microsoftonline.com/<TENANT_ID>/v2.0` y envía el `id_token` a la API. La API lo valida con JWKS (`jose`), revisa que `tid` sea el tenant de la universidad y crea o actualiza el `User`.
- **Redirect URI:** en Expo Go es del tipo `exp://<host>/--/auth`; se obtiene con `AuthSession.makeRedirectUri()` y hay que registrarla en Azure. En un dev build se usa el scheme `almuerzoya://auth`.
- **Operador:** login local (ID + contraseña, bcrypt) en el prototipo. Si el personal tiene Entra ID, conviene usar un solo botón y resolver el rol con un *App Role* o grupo de Entra.
- **Modo mock:** `AUTH_MODE=mock` muestra un selector de usuarios de prueba, para trabajar sin tenant.

## 10. Pagos

- **Webpay Plus (integración):** `POST /payments/webpay/create` → la API crea la transacción con `transbank-sdk` (`buildForIntegration` con las credenciales públicas de integración) → la app abre `url?token_ws=...` con `expo-web-browser` (`openAuthSessionAsync`) → Transbank redirige al `returnUrl` de la API → la API hace `commit`, marca el pedido `paid` y redirige al deep link de la app (`Linking.createURL('/pago/resultado')`) con el resultado. Las tarjetas de prueba están en transbankdevelopers.cl.
- **Apple Pay:** en el prototipo es un **mock** (sheet propio + `POST /payments/applepay/mock`). Apple Pay real requiere Merchant ID, un procesador compatible (p. ej. Stripe con `@stripe/stripe-react-native` *PlatformPay*) y un dev build (no funciona en Expo Go).

---

## 11. Instrucciones para Claude Code

### 11.1 Requisitos en el PC (Windows 10/11)

1. **Docker Desktop** con backend **WSL2** activado.
2. **WSL2 con Ubuntu**. **Clonar/crear el repo dentro del sistema de archivos de WSL** (`~/proyectos/almuerzo-ya`), no en `C:\`. Así funciona bien el *file watching* de Metro y es mucho más rápido.
3. **iPhone** con **Expo Go** instalado, en la misma red Wi-Fi que el PC (o usar `--tunnel`).
4. Abrir Claude Code desde WSL en la carpeta del proyecto.
5. Abrir en el Firewall de Windows los puertos **8081** (Metro) y **3000** (API) para la red privada, o usar túnel.

### 11.2 Prompt para pegar en Claude Code

```text
Lee docs/PROYECTO.md (este documento) y construye el prototipo funcional "Almuerzo Ya".

Objetivo: monorepo con app iOS en React Native + Expo (SDK más reciente, Expo Router,
TypeScript), API Node (Fastify + Prisma + Zod) y PostgreSQL, todo levantable con
`docker compose up` en Windows (Docker Desktop + WSL2). La app debe correr en un iPhone
real vía Expo Go y también en web para iterar.

Reglas:
- Antes de instalar dependencias de Expo, revisa docs.expo.dev para la versión actual
  y usa `npx expo install` (no npm install) para paquetes de Expo.
- Look nativo iOS 26+: NativeTabs de Expo Router (tab bar Liquid Glass), expo-glass-effect
  para controles flotantes, @expo/ui donde aplique (switch, segmented control), sheets
  nativos (presentation 'formSheet'), fuente del sistema, SF Symbols con expo-symbols.
  Implementa un fallback web para GlassView (backdrop-filter) y respeta Reduce Transparency.
- Usa los tokens de §8 en mobile/src/theme/tokens.ts. No inventes otra paleta.
- Implementa las 13 pantallas de §3 con navegación real y datos de la API.
- Reglas de negocio de §4, modelo de §5 con transacciones para stock y canje de QR.
- Auth según §9 con AUTH_MODE=mock por defecto; Entra ID real cuando haya variables.
- Pagos según §10: Webpay en ambiente de integración; Apple Pay mock.
- QR firmado (HMAC con QR_SECRET): payload { orderId, shortCode }, verificación en API,
  canje de un solo uso.
- Seed: semana actual con 2 menús por día, franjas 12:00–15:00 cada 30 min, 2 estudiantes
  y 1 operador de prueba (OP-0001 / operador123).
- Trabaja por fases (§11.5), haz commit al terminar cada fase y corre los tests.
- Al final, escribe README.md con cómo levantarlo y cómo abrirlo en el iPhone.
```

### 11.3 Estructura del repo

```
almuerzo-ya/
├─ docker-compose.yml
├─ .env.example
├─ docs/PROYECTO.md
├─ api/
│  ├─ Dockerfile
│  ├─ prisma/schema.prisma, seed.ts
│  └─ src/ (server.ts, routes/, services/, lib/qr.ts, lib/auth.ts)
└─ mobile/
   ├─ Dockerfile
   ├─ app.json            # scheme: "almuerzoya"
   ├─ app/
   │  ├─ (auth)/login.tsx
   │  ├─ (student)/_layout.tsx        # NativeTabs: menu, pedidos, perfil
   │  ├─ (student)/menu.tsx, carrito.tsx, checkout.tsx, pedidos/[id].tsx, perfil.tsx
   │  ├─ (student)/pago/apple.tsx (formSheet), pago/resultado.tsx
   │  ├─ (operator)/_layout.tsx       # NativeTabs: escanear, stock, menus
   │  ├─ (operator)/escanear.tsx, validar.tsx (formSheet), stock.tsx, menus/index.tsx, menus/nuevo.tsx
   └─ src/ (theme/, components/Glass.tsx, components/GroupedList.tsx, api/, store/)
```

### 11.4 Docker

`docker-compose.yml` (punto de partida; Claude Code debe ajustarlo):

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: almuerzo
      POSTGRES_PASSWORD: almuerzo
      POSTGRES_DB: almuerzo
    ports: ["5432:5432"]
    volumes: [dbdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U almuerzo"]
      interval: 5s
      retries: 10

  api:
    build: ./api
    env_file: .env
    environment:
      DATABASE_URL: postgresql://almuerzo:almuerzo@db:5432/almuerzo
    ports: ["3000:3000"]
    volumes: ["./api:/app", "/app/node_modules"]
    depends_on:
      db: { condition: service_healthy }
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run dev"

  mobile:
    build: ./mobile
    env_file: .env
    environment:
      EXPO_DEVTOOLS_LISTEN_ADDRESS: 0.0.0.0
      REACT_NATIVE_PACKAGER_HOSTNAME: ${HOST_LAN_IP}   # IP del PC en la Wi-Fi
      EXPO_PUBLIC_API_URL: http://${HOST_LAN_IP}:3000
    ports: ["8081:8081"]
    volumes: ["./mobile:/app", "/app/node_modules"]
    stdin_open: true
    tty: true
    command: npx expo start --lan     # usar --tunnel si la red bloquea LAN
    depends_on: [api]

volumes:
  dbdata:
```

`mobile/Dockerfile`:

```dockerfile
FROM node:22-bookworm
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8081
```

`api/Dockerfile`: igual sobre `node:22-bookworm`, `EXPOSE 3000`.

`.env.example`:

```
HOST_LAN_IP=192.168.1.50
AUTH_MODE=mock
ENTRA_TENANT_ID=
ENTRA_CLIENT_ID=
JWT_SECRET=cambia-esto
QR_SECRET=cambia-esto-tambien
WEBPAY_ENV=integration
WEBPAY_RETURN_URL=http://${HOST_LAN_IP}:3000/payments/webpay/return
```

**Uso**

```bash
cp .env.example .env               # poner la IP LAN del PC (ipconfig en Windows)
docker compose up --build
docker compose attach mobile       # ver el QR de Expo en consola
# iPhone: abrir la cámara → escanear QR → abre en Expo Go
# Web:    http://localhost:8081  (presionar "w" en la consola de Expo)
```

### 11.5 Fases y criterios de aceptación

| Fase | Entregable | Listo cuando… |
|---|---|---|
| 1. Base | Monorepo, Docker, Prisma, seed, Expo Router con NativeTabs vacías | `docker compose up` levanta todo y la app abre en Expo Go |
| 2. Design system | tokens, `Glass` (con fallback web), `GroupedList`, `PrimaryButton`, `Stepper`, `Segmented` | Pantalla de muestra con todos los componentes en iPhone y web |
| 3. Estudiante | Login mock, menú, carrito, checkout con franjas | El stock baja al reservar y vuelve si el pedido expira |
| 4. Pagos | Webpay integración + Apple Pay mock + resultado | Pago aprobado → pedido `paid` + QR; rechazado → stock liberado |
| 5. Operador | Escáner, validar/entregar, stock, menús de la semana, nuevo menú | Escanear el QR del iPhone de otra persona lo marca `delivered`; re-escanear muestra "Ya fue entregado" |
| 6. Entra ID | Login Microsoft real | Con `AUTH_MODE=entra` un estudiante del tenant entra y otro tenant es rechazado |
| 7. Pulido | Tiempo real, modo oscuro, accesibilidad, tests | Tests de API para stock/canje en verde; VoiceOver lee bien las pantallas clave |

### 11.6 Problemas típicos en Windows

- **El iPhone no conecta a Metro** → `HOST_LAN_IP` incorrecta, firewall, o Wi-Fi de la universidad con aislamiento de clientes: usar `npx expo start --tunnel`.
- **Cambios que no recargan** → el repo está en `C:\` en vez de WSL. Moverlo a `~/` en Ubuntu.
- **La app no llega a la API** → usar `EXPO_PUBLIC_API_URL` con la IP LAN; `localhost` en el iPhone es el propio iPhone.
- **Webpay no vuelve a la app** → el `returnUrl` debe ser alcanzable desde el iPhone (IP LAN o túnel) y redirigir al deep link de Expo.
- **Liquid Glass no se ve** → requiere iOS 26+ en el iPhone; en web y en iOS anteriores se usa el fallback.
