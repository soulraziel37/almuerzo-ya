# Publicar la demo para alguien que no está en tu red

Planes gratuitos: [Expo](https://expo.dev/pricing) y [Render](https://render.com/docs/free).
En Render gratis la API se duerme tras 15 minutos (tarda cerca de 1 en despertar), las fotos
subidas se pierden al reiniciar y **la base de datos expira a los 30 días**.

> Sin comprobar: que Expo Go con SDK 58 abra la app publicada. Pruébalo primero en tu iPhone.

## 1. Subir el código a GitHub

Crea un repositorio (puede ser privado) y sube este proyecto. `.env` no se sube.

## 2. API y app web en Render

1. **New → Blueprint** y elige el repositorio: lee `render.yaml`.
2. Escribe `DEMO_ACCESS_CODE` y `OPERATOR_PASSWORD` (mínimo 8 caracteres, distintas), y las
   direcciones: `EXPO_PUBLIC_API_URL` = `https://almuerzo-ya-api.onrender.com` y
   `CORS_ORIGINS` = `https://almuerzo-ya.onrender.com`, ambas sin `/` al final.
   Si Render asigna otros nombres, corrígelas en **Environment** y vuelve a desplegar.
3. Abre `https://TU-SERVICIO.onrender.com/health`: debe responder `ok`.
4. Revisa en los logs que `remoteAddress` sea tu IP pública y no una de Render. Si no lo es,
   ajusta `TRUST_PROXY_HOPS`: de eso depende el límite por IP.

5. Abre la app web y escribe la clave de demo al iniciar sesión. Con esto basta para mostrarla
   en un navegador: los pasos 3 a 5 son solo para verla en un iPhone con Expo Go.

> Antes de presentar, abre `/health` y espera a que responda `ok`: si la API estaba dormida,
> la app muestra "Sin conexión" hasta que despierta.

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
