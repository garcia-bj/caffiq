# Google OAuth en Caffiq — Cómo funciona

## Por qué fallaba antes

El flujo original usaba un **relay del backend** como paso intermedio:

```
App → Supabase → Google → Supabase → http://192.168.X.X:3000/api/auth/google/relay → App
```

El problema: la URL del relay contenía la **IP local de la computadora** (`192.168.X.X:3000`).
Cuando el teléfono intentaba acceder a esa URL después de autenticarse con Google, 
el browser del teléfono buscaba `localhost:3000` en *sí mismo* → `ERR_CONNECTION_REFUSED`.

---

## Cómo funciona ahora

El flujo nuevo elimina el relay. Supabase redirige **directamente** a la app via deep link:

```
App → Supabase → Google → Supabase → caffiq://auth/callback?code=XXX → App
```

### Diagrama completo

```
1. App llama supabase.auth.signInWithOAuth()
   - redirectTo = "caffiq://auth/callback?rol=cliente"
   - skipBrowserRedirect = true

2. Supabase genera URL de Google OAuth
   - Con redirectTo apuntando a su propio callback en supabase.co
   - Supabase luego redirigirá a nuestra redirectTo

3. App abre browser con la URL de Google

4. Usuario se autentica con Google

5. Google → Supabase callback (supabase.co/auth/v1/callback)
   Supabase procesa → redirige a caffiq://auth/callback?code=PKCE_CODE&rol=cliente

6. El sistema operativo intercepta "caffiq://" y abre la app

7. app/auth/callback.tsx recibe code + rol via useLocalSearchParams

8. supabase.auth.exchangeCodeForSession(code) → obtiene access_token de Supabase

9. POST /api/auth/google/token con el access_token → backend verifica y emite JWT de Caffiq

10. setSession(token, usuario) → usuario autenticado en la app
```

---

## Configuración requerida en Supabase

En **Dashboard → Authentication → URL Configuration → Redirect URLs** agregar:

```
caffiq://auth/callback
caffiq://**
```

Estas URLs deben estar en la lista para que Supabase permita redirigir a ellas.

---

## Configuración de app.config.js

```js
scheme: "caffiq"  // Define el deep link scheme de la app
```

Este scheme hace que el sistema operativo abra la app cuando ve una URL `caffiq://...`.

---

## Cómo se pasa el rol

El rol (`cliente` o `admin`) viaja como query param en el redirect URL:

```typescript
// auth.service.ts
const redirectTo = Linking.createURL("/auth/callback", { queryParams: { rol } });
```

Supabase preserva los query params al redirigir. En `callback.tsx`:

```typescript
const { code, rol } = useLocalSearchParams();
const result = await authService.exchangeGoogleToken(supabaseToken, rol ?? "cliente");
```

---

## Flujo post-autenticación

Después de obtener el usuario, `callback.tsx` decide a dónde navegar:

```
¿necesita_telefono?
  → /auth/agregar-telefono
    → /(auth)/verify-phone
      → admin sin cafetería? → /auth/setup-cafeteria → /(tabs)
      → cliente o admin con cafetería → /(tabs)

¿admin sin cafetería (ya tiene teléfono)?
  → /auth/setup-cafeteria → /(tabs)

Caso normal:
  → /(tabs)
```

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `app/auth/callback.tsx` | Recibe el code, intercambia token, decide navegación |
| `app/auth/agregar-telefono.tsx` | Pantalla para agregar número tras login con Google |
| `app/auth/setup-cafeteria.tsx` | Setup paso a paso de cafetería para admin Google |
| `app/(auth)/verify-phone.tsx` | Verificación OTP por WhatsApp |
| `src/frontend/services/auth.service.ts` | `googleLogin()` y `exchangeGoogleToken()` |
| `src/frontend/lib/supabase.ts` | Cliente de Supabase con PKCE |
| `src/backend/modules/auth/interfaces/auth.controller.ts` | Endpoint `POST /api/auth/google/token` |

---

## Variables de entorno necesarias

En `.env` (raíz del proyecto):
```
EXPO_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

En `src/backend/.env`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NUNCA en el frontend
JWT_SECRET=...
```
