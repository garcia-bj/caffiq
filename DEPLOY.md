# Guía de Deploy — Caffiq ☕

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  App Móvil   │────▶│  API Backend  │────▶│  Supabase  │
│  (Expo/EAS)  │     │  (Express)    │     │  (PG+Auth) │
└─────────────┘     └──────────────┘     └───────────┘
                           │
                    ┌──────┴──────┐
                    │  Cloudinary  │  (imágenes)
                    │  Mapbox      │  (mapas)
                    │  n8n         │  (WhatsApp OTP)
                    └─────────────┘
```

---

## Paso 1: Supabase (Base de Datos + Auth)

### 1.1 Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Elegir región cercana (ej: South America `sa-east-1`)
3. Guardar la **URL** y **Anon Key** (frontend) y **Service Role Key** (backend)

### 1.2 Ejecutar migraciones
Ejecutar en orden dentro del **SQL Editor** de Supabase:

```
src/backend/migrations/001_create_sucursales.sql
src/backend/migrations/002_create_productos.sql
src/backend/migrations/003_migrate_sucursales_to_Sucursal.sql
src/backend/migrations/004_coordenadas_prueba_cochabamba.sql
src/backend/migrations/005_pedidos_y_personalizaciones.sql
src/backend/migrations/006_seed_productos_personalizaciones.sql
src/backend/migrations/007_fix_tipo_pedido_column.sql
src/backend/migrations/008_add_google_id_to_usuarios.sql
src/backend/migrations/009_personalizaciones_por_sucursal.sql
src/backend/migrations/010_add_push_token_to_usuarios.sql
src/backend/migrations/011_add_motivo_rechazo.sql
src/backend/migrations/012_add_hora_recogida_to_pedidos.sql
src/backend/migrations/013_add_categoria_to_producto.sql
```

> **Nota:** La tabla `usuarios` se gestiona desde la UI de Authentication de Supabase. Ve a Authentication → Users y configura los campos personalizados: `nom_completo`, `num_telefono`, `password`, `rol`, `telefono_verificado`, `google_id`, `expo_push_token`.

### 1.3 Configurar Google OAuth
1. En Supabase Dashboard → Authentication → Providers → **Google**
2. Habilitar y configurar Client ID / Secret desde Google Cloud Console
3. En **URL Configuration** → Redirect URLs agregar:
   ```
   caffiq://auth/callback
   caffiq://**
   https://TU_DOMINIO_BACKEND/api/auth/google/callback
   ```

### 1.4 Configurar RLS (Row Level Security)
Habilitar políticas para las tablas si se requiere acceso público.

---

## Paso 2: Backend (API Express)

### 2.1 Opción A: Railway (Recomendado)
1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Conectar el repo de Caffiq
3. Configurar **Root Directory**: `src/backend`
4. Configurar **Build Command**: `npm install && npm run build`
5. Configurar **Start Command**: `npm start`
6. Agregar variables de entorno (ver abajo)
7. El dominio será tipo `caffiq-api.up.railway.app`

### 2.2 Opción B: Render
1. Ir a [render.com](https://render.com) → New Web Service
2. Conectar repo GitHub
3. **Root Directory**: `src/backend`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `node dist/server.js`
6. Agregar variables de entorno

### 2.3 Opción C: Servidor propio (VPS/Linux)
```bash
# Clonar el repo
git clone <repo-url> caffiq
cd caffiq/src/backend

# Instalar dependencias
npm install

# Crear .env con variables de producción
cp .env.example .env
nano .env

# Compilar
npm run build

# Ejecutar con PM2 (recomendado para producción)
npm install -g pm2
pm2 start dist/server.js --name caffiq-api
pm2 save
pm2 startup
```

### 2.4 Variables de entorno del backend
Crear archivo `.env` en `src/backend/`:

```env
PORT=3000
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET=tu_secreto_jwt_min_32_caracteres_aleatorio
JWT_EXPIRES_IN=7d
WHATSAPP_WEBHOOK_URL=https://tu-n8n.com/webhook/xxx
GOOGLE_REDIRECT_URL=https://TU_DOMINIO/api/auth/google/callback
```

> **JWT_SECRET**: Generar uno con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## Paso 3: Frontend (App Móvil — EAS Build)

### 3.1 Prerrequisitos
```bash
npm install -g eas-cli
eas login
```

### 3.2 Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
EXPO_PUBLIC_API_URL=https://TU_DOMINIO_BACKEND
EXPO_PUBLIC_MAPBOX_TOKEN=pk.tu_token_publico_mapbox
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
MAPBOX_DOWNLOADS_TOKEN=sk.tu_token_descarga_mapbox
GOOGLE_REDIRECT_URL=https://TU_DOMINIO_BACKEND/api/auth/google/callback
```

> **MAPBOX_DOWNLOADS_TOKEN**: Crear en mapbox.com → Tokens → token con scope `Downloads:Read`. Es un `sk.eyJ...` obligatorio para builds nativas con `@rnmapbox/maps`.

### 3.3 Build de desarrollo (pruebas)
```bash
eas build --platform android --profile development
```
Esto genera un APK que se instala directamente. La app se conecta al dev server para hot reload.

### 3.4 Build de producción (Google Play)
```bash
eas build --platform android --profile production
```
Esto genera un **AAB** (Android App Bundle) listo para subir a Google Play Console.

### 3.5 Build preview (testing interno)
```bash
eas build --platform android --profile preview
```
APK para compartir con testers sin publicar en la tienda.

### 3.6 Subir a Google Play Console
```bash
eas submit --platform android --profile production
```

---

## Paso 4: Servicios externos

### 4.1 Cloudinary (Imágenes)
1. Crear cuenta en [cloudinary.com](https://cloudinary.com)
2. Ir a Settings → Upload → **Upload presets**
3. Crear preset con nombre (ej: `caffiq_upload`) y modo `unsigned`
4. Guardar el **cloud name** y **upload preset** para las variables de entorno

### 4.2 Mapbox (Mapas)
1. Crear cuenta en [mapbox.com](https://mapbox.com)
2. Crear dos tokens:
   - **Token público** (`pk.eyJ...`) — para el mapa en la app
   - **Token de descarga** (`sk.eyJ...`) — con scope `Downloads:Read` para el build nativo

### 4.3 WhatsApp OTP (n8n)
1. Tener una instancia de n8n con webhook de WhatsApp
2. Configurar el webhook URL en `WHATSAPP_WEBHOOK_URL`
3. El formato esperado del POST: `{ telefono, codigo, nombre, mensaje }`

---

## Paso 5: Checklist pre-producción

- [ ] Migraciones ejecutadas en Supabase (paso 1.2)
- [ ] Google OAuth configurado en Supabase (paso 1.3)
- [ ] Backend desplegado y funcionando (`/api/health` responde)
- [ ] Variables de entorno del backend actualizadas con dominio real
- [ ] `GOOGLE_REDIRECT_URL` apunta al dominio del backend real
- [ ] `.env` del frontend con `EXPO_PUBLIC_API_URL` apuntando al backend real
- [ ] Cloudinary configurado con upload preset
- [ ] Mapbox tokens generados (público + descarga)
- [ ] Build de producción ejecutado con `eas build --profile production`
- [ ] App firmada y subida a Google Play Console
- [ ] HTTPS habilitado en el backend (Railway/Render lo hacen automático)

---

## Comandos rápidos

```bash
# ── Backend ──────────────────────────────────────────
cd src/backend
npm install
cp .env.example .env      # editar con valores reales
npm run build
npm start                  # producción
npm run dev                # desarrollo con hot reload

# ── Frontend ─────────────────────────────────────────
npm install
eas build --platform android --profile development   # dev APK
eas build --platform android --profile preview       # testing APK
eas build --platform android --profile production    # producción AAB
eas submit --platform android --profile production   # subir a Play Store
```
