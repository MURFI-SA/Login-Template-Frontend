# Login Template — Frontend

Frontend listo para usar en cualquier proyecto que necesite **login, registro y recuperación de contraseña** desde el día 1. Incluye además una librería completa de componentes UI lista para extender.

Está pensado para arrancar rápido: clonás, instalás, configurás 1 variable, y listo.

Funciona en pareja con [`Login-Template-Backend`](https://github.com/MURFI-SA/Login-Template-Backend).

---

## ¿Qué incluye?

- ✅ Página de **Login** (`/login`) con validación
- ✅ Página de **Registro** (`/registro`) — multi-step con OTP por email
- ✅ Página de **Recuperación de contraseña** (`/forgot-password`)
- ✅ Página de **404** (`/*`)
- ✅ Cliente tRPC configurado con cookies HttpOnly + auto-redirect a `/login` en 401
- ✅ **~40 componentes shadcn/ui** listos para usar (button, dialog, form, table, select, popover, sheet, tabs, tooltip, etc.)
- ✅ Theme provider (claro / oscuro / sistema) con toggle
- ✅ Toasts (con Sonner)
- ✅ Tipografía Geist Sans / Geist Mono ya cargada
- ✅ TailwindCSS v4 + design tokens en `index.css`

---

## Stack

- React 19 + TypeScript
- Vite 7
- Wouter (router liviano)
- tRPC client + TanStack Query (estado del server)
- TailwindCSS v4 + shadcn/ui + Radix
- Sonner (toasts) + Lucide (iconos)

---

## Requisitos previos

1. **Node.js 22 o superior** ([descargar](https://nodejs.org))
2. **El backend levantado** — el frontend le pega para todo. Si todavía no lo tenés, seguí la [guía del backend](https://github.com/MURFI-SA/Login-Template-Backend#quickstart-5-minutos) primero (5 minutos).

---

## Quickstart (3 minutos)

### 1. Clonar e instalar

```bash
git clone https://github.com/MURFI-SA/Login-Template-Frontend.git mi-frontend
cd mi-frontend
npm install
```

### 2. Configurar la URL del backend

```bash
cp .env.example .env
```

Abrí `.env` y poné la URL donde está corriendo tu backend:

```env
# Si el backend lo levantaste localmente (por default va al 3000):
VITE_API_URL=http://localhost:3000

# Si el backend está en Railway u otro hosting:
# VITE_API_URL=https://mi-backend.up.railway.app
```

### 3. Levantar

```bash
npm run dev
```

Vas a ver:

```
VITE v7.x  ready in 540 ms

➜  Local:   http://localhost:5173/
```

Abrí esa URL en el navegador y ya estás en la pantalla de login.

### 4. Probar el flujo completo

1. Click en "Crear cuenta" → te lleva a `/registro`
2. Completá email + contraseña → te llega un código OTP al mail
3. Cargás el código → ya quedás logueado y redirige a `/`
4. Si después olvidás la contraseña: `/forgot-password` y repetís el flujo de OTP

Si los emails de OTP no llegan: revisá los logs del backend (no es un problema del frontend).

---

## Comandos disponibles

| Comando | Para qué sirve |
|---------|----------------|
| `npm run dev` | Arranca el server de desarrollo (recarga en caliente) |
| `npm run build` | Genera el bundle de producción en `dist/public/` |
| `npm run preview` | Previsualiza el build de producción local |
| `npm run check` | Verifica tipos de TypeScript |
| `npm run format` | Formatea todo el código con Prettier |

---

## ¿Cómo se conecta con el backend?

Toda la comunicación pasa por **tRPC** sobre HTTP. La conexión funciona así:

1. **Variable de entorno**: el cliente lee `VITE_API_URL` (configurada en `.env`) y le pega a `${VITE_API_URL}/api/trpc/*`.
2. **Cookies HttpOnly**: cada request manda `credentials: "include"` → la cookie de sesión viaja sola, el frontend no la toca a mano.
3. **Manejo de 401**: si el backend devuelve "Please login" (cookie inválida/expirada), el frontend automáticamente redirige a `/login`.
4. **CORS**: el backend tiene que permitir el origen del frontend. Default: `http://localhost:5173`. Si lo cambiás, agregalo a `FRONTEND_URL` en el `.env` del backend.

### Hacer una nueva llamada al backend

Desde cualquier componente:

```tsx
import { trpc } from "@/lib/trpc";

function MiPagina() {
  // Query (GET-equivalente)
  const { data: usuario } = trpc.auth.me.useQuery();

  // Mutation (POST-equivalente)
  const loginMut = trpc.auth.login.useMutation({
    onSuccess: () => console.log("Logueado!"),
  });

  return (
    <button onClick={() => loginMut.mutate({ email: "x", password: "y" })}>
      Login
    </button>
  );
}
```

---

## Estructura del proyecto

```
.
├── client/
│   ├── public/                Assets estáticos (favicons, imágenes públicas)
│   └── src/
│       ├── _core/             Hooks de auth, utilidades core
│       ├── components/        Componentes propios (ErrorBoundary, etc.)
│       │   └── ui/            shadcn/ui — ~40 primitivos listos
│       ├── contexts/          ThemeContext (light/dark/system)
│       ├── hooks/             Hooks reutilizables
│       ├── lib/               Cliente tRPC, helpers
│       ├── pages/             Páginas: Login, Register, ForgotPassword, NotFound
│       ├── types/             Tipo AppRouter (stub — ver abajo cómo cambiarlo)
│       ├── App.tsx            Router + providers globales
│       ├── main.tsx           Punto de entrada
│       └── index.css          Tailwind v4 + design tokens
└── shared/                    Tipos y constantes que se comparten con el backend
```

---

## Extender el template

### Agregar una página nueva

1. Creá tu componente en `client/src/pages/MiPagina.tsx`
2. En `client/src/App.tsx` agregá el `<Route>`:
   ```tsx
   <Route path="/mi-ruta" component={MiPagina} />
   ```
3. Listo, ya tenés tu nueva ruta funcionando.

### Usar componentes shadcn

Todos los componentes ya están en `client/src/components/ui/`. Importás y usás:

```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
```

### Tipar el cliente tRPC con tu backend real

Por default, `AppRouter` es un stub genérico (sin types fuertes). Para tipar todo:

1. Asegurate que el frontend y el backend estén en la misma carpeta padre (o un monorepo).
2. Abrí `client/src/types/api.ts` y reemplazá el contenido por:
   ```ts
   export type { AppRouter } from "../../../backend/server/routers";
   ```
3. En `main.tsx`, sacá los casts a `trpcAny`. Ahora tenés autocompletado completo en `trpc.X.Y.useQuery()`.

---

## Deploy a Railway (gratis)

1. Tener una cuenta en [Railway](https://railway.app)
2. Crear un proyecto nuevo → **Deploy from GitHub** → seleccionar este repo
3. En el servicio, **Variables** → agregar `VITE_API_URL` apuntando al backend
4. Railway detecta `nixpacks.toml` y deploya. Te da una URL pública (`https://mi-frontend.up.railway.app`)
5. **Importante**: agregar esa URL a la variable `FRONTEND_URL` del backend para que CORS la acepte.

---

## Solución de problemas comunes

**"Failed to fetch" o errores de CORS**
→ El backend no está permitiendo el origen del frontend. Editá `FRONTEND_URL` en el `.env` del backend y agregale el origen actual (ej: `http://localhost:5173`).

**Se queda en blanco con error 401 al recargar**
→ La cookie de sesión expiró o el backend no la está aceptando. Revisá que el backend esté corriendo y que `VITE_API_URL` apunte ahí.

**No me llega el OTP al registrarme**
→ Es un problema del backend, no del frontend. Revisá los logs del backend (`npm run dev`) y el spam folder.

**El build falla con "Cannot find module"**
→ Probablemente alguna dependencia faltante. Probá `rm -rf node_modules package-lock.json && npm install` y volvé a intentar.

---

## Licencia

MIT — usalo libremente en proyectos privados o públicos.
