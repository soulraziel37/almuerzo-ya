# Publicar la demo para alguien que no está en tu red

Planes gratuitos: [Expo](https://expo.dev/pricing) y [Render](https://render.com/docs/free).
En Render gratis la API se duerme tras 15 minutos (tarda cerca de 1 en despertar), las fotos
subidas se pierden al reiniciar y **la base de datos expira a los 30 días**.

> Sin comprobar: que Expo Go con SDK 58 abra la app publicada. Pruébalo primero en tu iPhone.

## 1. Subir el código a GitHub

Crea un repositorio (puede ser privado) y sube este proyecto. `.env` no se sube.

## 2. API en Render

1. **New → Blueprint** y elige el repositorio: lee `render.yaml`.
2. Escribe `DEMO_ACCESS_CODE` y `OPERATOR_PASSWORD` (mínimo 8 caracteres, distintas).
3. Abre `https://TU-SERVICIO.onrender.com/health`: debe responder `ok`.
4. Revisa en los logs que `remoteAddress` sea tu IP pública y no una de Render. Si no lo es,
   ajusta `TRUST_PROXY_HOPS`: de eso depende el límite por IP.

## 3. Organización en Expo

En expo.dev: **Create Organization** → **Members → Invite**, con rol **Viewer**.

## 4. Publicar la app

Desde la carpeta `mobile`:

```powershell
npx eas-cli@latest login
```

```powershell
npx eas-cli@latest init
```

Elige la organización como dueña. Luego:

```powershell
npx eas-cli@latest update:configure
```

En `app.json`, deja `"runtimeVersion": { "policy": "sdkVersion" }` (lo que usa Expo Go).

```powershell
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://TU-SERVICIO.onrender.com --visibility plaintext
```

```powershell
npx eas-cli@latest update --branch demo --environment preview --message "Demo"
```

Abre el enlace del panel que entrega el comando y usa **Preview** para ver el QR.

## 5. Tu compañero

Acepta la invitación, entra a Expo Go con su cuenta, abre el proyecto y escribe la clave de
demo al iniciar sesión.
