# Módulo de Autenticación — `src/backend/modules/auth`

## Descripción general

Maneja todo el ciclo de identidad del usuario: registro, verificación de teléfono por WhatsApp, login con contraseña y login con Google OAuth. El módulo sigue la arquitectura **Controller → Service → Repository**, donde cada capa tiene una sola responsabilidad.

---

## Archivos del módulo

| Archivo | Rol |
|---|---|
| `auth.dto.ts` | Tipos TypeScript de entrada/salida y filas de Supabase |
| `auth.controller.ts` | Validación de request y delegación al servicio |
| `auth.service.ts` | Lógica de negocio (hash, token, flujo OAuth) |
| `auth.repository.ts` | Acceso directo a las tablas de Supabase |
| `auth.routes.ts` | Definición de rutas Express del módulo |

---

## Rutas expuestas

| Método | Ruta | Descripción | Auth requerida |
|---|---|---|---|
| POST | `/api/auth/register` | Crear cuenta nueva | No |
| POST | `/api/auth/verify-phone` | Confirmar OTP de WhatsApp | No |
| POST | `/api/auth/resend-otp` | Reenviar código OTP | No |
| POST | `/api/auth/login` | Login con correo + password | No |
| GET | `/api/auth/google` | Inicia flujo Google OAuth | No |
| GET | `/api/auth/google/callback` | Callback de Google | No |
| GET | `/api/auth/me` | Retorna usuario autenticado | Sí (JWT Bearer) |

---

## Tablas de Supabase usadas

### `usuarios`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK generado por Supabase |
| `nom_usuario` | text | **Correo electrónico** del usuario (único) |
| `nom_completo` | text | Nombre legible del usuario |
| `num_telefono` | text | Formato `+521XXXXXXXXXX` (único) |
| `password` | text | Hash bcrypt de la contraseña |
| `rol` | text | `"cliente"` o `"admin"` |
| `telefono_verificado` | boolean | `true` después de validar OTP |
| `google_id` | text | ID de Google (solo OAuth, nullable) |
| `created_at` | timestamptz | Fecha de creación |

> **Nota:** `nom_usuario` actúa como identificador de login. Para registros normales se valida que sea un correo electrónico válido. Para Google OAuth se asigna directamente el email de la cuenta Google.

### `cafeterias`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `admin_id` | uuid | FK → `usuarios.id` |
| `nom_cafeteria` | text | Nombre del negocio |
| `direccion` | text | Dirección física |
| `ciudad` | text | Ciudad |
| `descripcion` | text | Opcional |
| `horario_apertura` | text | Formato `HH:MM`, opcional |
| `horario_cierre` | text | Formato `HH:MM`, opcional |
| `activa` | boolean | Estado del negocio |

---

## Librerías utilizadas

| Librería | Versión | Uso |
|---|---|---|
| `bcryptjs` | latest | Hash y verificación de contraseñas |
| `jsonwebtoken` | latest | Generación y verificación de tokens JWT |
| `@supabase/supabase-js` | latest | Cliente de base de datos (Supabase/PostgreSQL) |
| `express` | latest | Framework HTTP y manejo de rutas |
| `dotenv` | latest | Carga de variables de entorno |

---

## Generación de contraseñas (hash)

Se usa **bcryptjs** con `SALT_ROUNDS = 12`. Esto significa que el algoritmo bcrypt aplica 2^12 = 4096 iteraciones de hashing, lo cual proporciona un balance entre seguridad y rendimiento.

```ts
// auth.service.ts
const SALT_ROUNDS = 12;
const password_hash = await bcrypt.hash(datos.password, SALT_ROUNDS);

// Al verificar login:
const passwordValido = await bcrypt.compare(datos.password, usuario.password);
```

No se usa ninguna función `Math.random()` para contraseñas — bcrypt genera internamente un salt criptográfico seguro.

---

## Generación de tokens JWT

Los tokens son generados con **jsonwebtoken** y contienen el payload mínimo necesario:

```ts
jwt.sign(
  { id: usuario.id, rol: usuario.rol },
  env.jwt.secret,
  { expiresIn: env.jwt.expiresIn }  // default: "7d"
)
```

- **Secreto:** leído de la variable de entorno `JWT_SECRET`
- **Expiración:** configurable via `JWT_EXPIRES_IN` (default `7d`)
- **Payload:** solo `id` y `rol` — lo mínimo para autorizar sin exponer datos sensibles

---

## Generación de códigos OTP

El OTP de verificación de WhatsApp se genera con `Math.random()` nativo de Node.js:

```ts
// verificacion.service.ts
const generarCodigo = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();
```

- Produce un número de **6 dígitos** entre 100000 y 999999
- Expira en **10 minutos**
- Se invalidan códigos anteriores antes de crear uno nuevo (tabla `verificaciones`)
- **Rate limit:** solo se puede reenviar 1 código por minuto por usuario

> **Nota de seguridad:** `Math.random()` no es criptográficamente seguro. Si se requiere mayor seguridad en el futuro, se puede reemplazar por `crypto.randomInt(100000, 1000000)` de Node.js.

---

## Validaciones del controller

### Registro (`POST /api/auth/register`)
- Todos los campos obligatorios presentes: `nom_usuario`, `nom_completo`, `num_telefono`, `password`, `rol`
- `nom_usuario` debe ser un correo electrónico válido (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `rol` debe ser `"cliente"` o `"admin"`
- Si `rol === "admin"`, el objeto `cafeteria` es requerido
- Unicidad de `nom_usuario` y `num_telefono` verificada contra la DB antes de insertar

### Login (`POST /api/auth/login`)
- `nom_usuario` y `password` requeridos
- Se verifica que el teléfono esté verificado antes de permitir el acceso

### Verificar teléfono (`POST /api/auth/verify-phone`)
- `usuario_id` y `codigo` requeridos
- Código debe existir en DB, estar vigente (no expirado) y no haber sido usado

### Google OAuth
- `rol` debe ser `"cliente"` o `"admin"` (query param)
- Si el usuario no existe se crea automáticamente con el email de Google como `nom_usuario`
- Si el teléfono no está verificado, la respuesta incluye `necesita_telefono: true`

---

## Conexión con Supabase

Se usa el cliente con **Service Role Key** (permisos de administrador), lo que permite bypassear las políticas RLS de Supabase y operar directamente sobre las tablas. Este cliente **solo debe usarse en el backend**, nunca exponerse al frontend.

```ts
// config/supabase.ts
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

Variables de entorno requeridas:
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — clave de servicio (secreta)
- `JWT_SECRET` — secreto para firmar tokens
- `JWT_EXPIRES_IN` — duración del token (default: `7d`)
- `WHATSAPP_WEBHOOK_URL` — URL del webhook n8n para envío de OTPs
- `GOOGLE_REDIRECT_URL` — URL de callback para Google OAuth

---

## Flujo de registro completo

```
Cliente → POST /register
  └─ Controller: valida campos + formato email
      └─ Service: verifica unicidad → hashea password → crea usuario
          ├─ Si admin: crea cafetería vinculada
          └─ Dispara OTP por WhatsApp (webhook n8n)
              → Devuelve { mensaje, usuario_id }

Cliente → POST /verify-phone (con OTP recibido)
  └─ Service: valida OTP → marca teléfono verificado
      └─ Devuelve { token JWT, usuario }
```

---

## Flujo de Google OAuth

```
Cliente → GET /google?rol=cliente
  └─ Supabase Auth genera URL de Google → redirect

Google → GET /google/callback?code=...&rol=...
  └─ Controller: intercambia code por sesión con Supabase
      └─ Service: busca usuario por email
          ├─ Si no existe: crea usuario con email como nom_usuario
          └─ Devuelve { token, usuario, necesita_telefono }
```

---

## Middleware de autenticación

`auth.middleware.ts` protege rutas privadas:

1. Extrae el token del header `Authorization: Bearer <token>`
2. Verifica y decodifica el JWT con `jwt.verify()`
3. Busca el usuario en DB por el `id` del payload
4. Inyecta el usuario en `req.user` para uso en controllers posteriores
5. Si el token es inválido o expirado, retorna `401`
