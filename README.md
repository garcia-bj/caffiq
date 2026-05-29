# Caffiq ☕

App móvil de pedidos de café con personalización de productos, búsqueda por ubicación y gestión de sucursales.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | [Expo SDK 54](https://expo.dev) + React Native 0.81 |
| Backend | Node.js + Express (DDD) |
| Base de datos / Auth | [Supabase](https://supabase.com) |
| Mapas | [Mapbox](https://www.mapbox.com) (`@rnmapbox/maps`) |
| Imágenes | [Cloudinary](https://cloudinary.com) |
| Notificaciones | `expo-notifications` |
| Pagos QR | Pantalla de QR de pago por sucursal |

## Funcionalidades

- **Catálogo de cafeterías** con ubicación en mapa interactivo
- **Búsqueda y filtrado** de sucursales cercanas (geolocalización)
- **Menú de productos** con personalización (tamaño, temperatura, azúcar, tipo de leche, extras)
- **Carrito de compras** con cálculo de precio en tiempo real
- **Sistema de pedidos** con seguimiento
- **Autenticación** con teléfono (SMS), Google OAuth y email
- **Panel de administración** para gestión de sucursales, menú y productos
- **QR de pago** por sucursal
- **Notificaciones push**

## Estructura del proyecto

```
caffiq/
├── app/                    # Rutas Expo Router (file-based routing)
│   ├── (tabs)/             # Tabs principales (cafeterías, buscar, carrito, perfil)
│   ├── (auth)/             # Pantallas de autenticación
│   ├── sucursal/           # Detalle de sucursal [id].tsx
│   ├── cafeteria/          # Detalle de cafetería [id].tsx
│   ├── menu/               # CRUD admin de menú y productos
│   ├── sucursales/         # CRUD admin de sucursales
│   ├── pedidos/            # Gestión de pedidos
│   ├── personalizacion/    # Pantalla de personalización de producto
│   └── configuracion/      # QR de pago
├── src/
│   ├── frontend/           # Servicios, componentes, hooks, contextos
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # AuthContext, CartContext, NavbarContext
│   │   ├── hooks/          # Hooks personalizados
│   │   ├── services/       # Servicios de API (cafeterías, pedidos, auth…)
│   │   ├── constants/      # Tema y constantes
│   │   └── types/          # Tipos TypeScript
│   └── backend/            # API Express (DDD)
│       ├── src/modules/    # Módulos: auth, cafeterias, productos, pedidos, menu
│       ├── config/         # Configuración de entorno, Supabase, CORS
│       └── migrations/     # Migraciones SQL de Supabase
├── assets/                 # Imágenes, iconos, fuentes
├── app.config.js           # Configuración dinámica de Expo
└── eas.json                # Configuración de EAS Build
```

## Requisitos previos

- **Node.js** ≥ 18
- **Cuenta de Supabase** con proyecto creado
- **Cuenta de Mapbox** con token público y token de descarga SDK
- **Cuenta de Cloudinary** (opcional, para imágenes)
- **Expo CLI** (`npx expo`)

## Configuración

### 1. Variables de entorno

Crea un archivo `.env` en la raíz con las variables del frontend:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxxxxxxx
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
MAPBOX_DOWNLOADS_TOKEN=sk.xxxxxxxx
GOOGLE_REDIRECT_URL=http://192.168.x.x:3000/api/auth/google/callback
```

Crea `src/backend/.env` copiando [`src/backend/.env.example`](src/backend/.env.example):

```env
PORT=3000
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxx
JWT_SECRET=cambia_esto_por_un_secreto_seguro_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d
WHATSAPP_WEBHOOK_URL=https://tu-n8n-instancia/webhook/xxxxxxxx
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

### 2. Base de datos

Ejecuta las migraciones SQL en orden:

```
src/backend/migrations/001_create_sucursales.sql
src/backend/migrations/002_create_productos.sql
...
src/backend/migrations/010_add_push_token_to_usuarios.sql
```

### 3. Instalar dependencias

```bash
# Frontend
npm install

# Backend
npm install --prefix src/backend
```

## Scripts

### Frontend (Expo)

```bash
npm start          # Inicia Expo dev server
npm run android    # Inicia en Android
npm run ios        # Inicia en iOS
npm run web        # Inicia en web
npm run lint       # Lint del código
```

### Backend (Express)

```bash
npm run dev --prefix src/backend     # Desarrollo con hot reload
npm run build --prefix src/backend   # Compilar TypeScript
npm start --prefix src/backend       # Producción (compilado)
```

## Build nativa

El proyecto usa EAS Build para compilaciones nativas (Mapbox requiere build nativa):

```bash
npx expo prebuild --clean
npx eas build --profile development   # Build de desarrollo
npx eas build --profile production    # Build de producción
```

Configuración en [`eas.json`](eas.json).

## API Endpoints

El backend expone los siguientes endpoints bajo `http://<host>:3000`:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login con teléfono |
| GET | `/api/auth/google/callback` | Callback OAuth Google |
| GET | `/api/cafeterias` | Listar cafeterías |
| POST | `/api/cafeterias` | Crear cafetería (admin) |
| GET | `/api/cafeterias/:id/productos` | Productos por cafetería |
| GET | `/api/pedidos` | Listar pedidos |
| POST | `/api/pedidos` | Crear pedido |
| GET | `/api/menu/sucursales` | Sucursales con menú |
| GET | `/api/sucursales` | Listado global de sucursales activas |

## Licencia

Privado — Uso interno.
