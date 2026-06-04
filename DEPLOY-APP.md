# Deploy de la App Móvil — Paso a Paso 📱

## Prerrequisitos

- Cuenta en [expo.dev](https://expo.dev) (gratis)
- Cuenta de Google Play Console ($25 USD one-time)
- Backend ya desplegado (la URL de tu API)
- Mapa de Mapbox con token de descarga
- Cloudinary con upload preset

---

## 1. Instalar EAS CLI

```bash
npm install -g eas-cli
eas login
```

Ingresa tus credenciales de expo.dev.

---

## 2. Crear `.env` en la raíz del proyecto

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Backend (TU dominio de Railway/Render)
EXPO_PUBLIC_API_URL=https://caffiq-api.up.railway.app

# Mapbox (mapas)
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1Ijoi...

# Cloudinary (imágenes)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=caffiq_upload

# Google OAuth
GOOGLE_REDIRECT_URL=https://caffiq-api.up.railway.app/api/auth/google/callback
```

> **IMPORTANTE:** `MAPBOX_DOWNLOADS_TOKEN` debe ser un token `sk.eyJ...` (empieza con `sk`, NO con `pk`). Se crea en mapbox.com → Tokens → Create Token → scope `Downloads:Read`.

---

## 3. Verificar la configuración

```bash
# Revisa que eas.json tenga tu projectId
npx expo config
```

El `app.config.js` ya está configurado con:
- `package: "com.bjgc.caffiq"` (ID único de la app)
- `scheme: "caffiq"` (deep links)
- `owner: "bj-gc"` (tu usuario de Expo)
- `projectId: "ae200185-360e-4304-8520-0c95c35a7996"`

---

## 4. Build de desarrollo (para probar)

```bash
eas build --platform android --profile development
```

Esto:
- Genera un **APK** (~50-80 MB)
- Lo sube a los servidores de Expo
- Tarda 5-15 minutos
- Recibirás un link para descargar el APK

Instala el APK en tu celular para probar que todo funcione.

---

## 5. Build de producción (para Play Store)

```bash
eas build --platform android --profile production
```

Esto:
- Genera un **AAB** (Android App Bundle)
- Formato requerido por Google Play
- Tarda 5-15 minutos
- Recibirás un link para descargar el AAB

---

## 6. Subir a Google Play Console

### 6.1 Crear app en Play Console
1. Ir a [play.google.com/console](https://play.google.com/console)
2. Crear aplicación → Nombre: **Caffiq**
3. Configurar:
   - Ficha de Play Store (descripción, screenshots, ícono)
   - Clasificación de contenido (cuestionario)
   - Precios y distribución (gratis, países)

### 6.2 Subir el AAB
```bash
eas submit --platform android --profile production
```

O manualmente:
1. En Play Console → Producción → Crear nuevo lanzamiento
2. Subir el archivo `.aab` que descargaste
3. Completar notas de versión
4. Revisar y publicar

> Tarda 1-3 días hábiles en ser revisado por Google la primera vez.

---

## 7. Actualizar la app (futuras versiones)

```bash
# 1. Cambiar versión en app.config.js
#    "version": "1.0.1"

# 2. Build
eas build --platform android --profile production

# 3. Subir a Play Store
eas submit --platform android --profile production
```

---

## Solución de problemas comunes

| Error | Solución |
|---|---|
| `MAPBOX_DOWNLOADS_TOKEN` inválido | El token debe empezar con `sk.eyJ...`, no `pk.eyJ...` |
| `package name already taken` | Cambia `com.bjgc.caffiq` en `app.config.js` |
| Google OAuth no funciona en el APK | El SHA-1 fingerprint del APK de desarrollo es diferente al de producción. Para prod, usa el SHA-1 de Google Play Console |
| `Cannot connect to Metro` en build dev | Es normal en builds de desarrollo. En producción no aparece |
| Firebase no configurado | Ignorar. Las notificaciones push requieren Firebase, pero no bloquean la app |
