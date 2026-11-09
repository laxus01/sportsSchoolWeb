# Sports School Admin

Panel administrativo React + Vite para gestionar las licencias del backend
`sportsSchoolBackend`. El panel consume únicamente la API HTTPS; no se conecta
directamente a MySQL ni maneja la clave privada Ed25519 del servidor.

## Desarrollo local

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Vite sirve el panel en `http://127.0.0.1:5173`. Define
`VITE_API_BASE_URL` en `.env.local` si el backend usa otra URL:

```dotenv
VITE_API_BASE_URL=https://sportsschoolbackend-production.up.railway.app/v1
```

Para que el navegador pueda llamar a Railway, agrega el origen exacto del panel
a `ALLOWED_ORIGINS` en el servicio backend. En desarrollo es
`http://127.0.0.1:5173`; en producción, usa el dominio HTTPS del panel. El
backend ya permite el origen Capacitor de la app móvil; eso no autoriza
automáticamente a este panel web.

## Primer acceso

El usuario creado en la pantalla `setup` de la aplicación móvil es local y no
sirve para este panel. El primer administrador `OWNER` se crea por separado
mediante el proceso de bootstrap del backend, con
`ADMIN_BOOTSTRAP_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD` (14 caracteres como
mínimo). No hay una ruta pública para crear administradores.

Después, el administrador entra aquí con su correo y contraseña. El token
administrativo dura 20 minutos y se conserva solo en `sessionStorage`; cerrar
sesión o vencer el token requiere volver a autenticarse.

## Funciones

- Listar escuelas y consultar estado, tipo, vencimiento y revisión de licencia.
- Crear escuelas con suscripción o licencia permanente.
- Registrar pagos en COP con clave de idempotencia.
- Emitir códigos de activación de un solo uso y copiarlos al portapapeles.
- Consultar instalaciones, suspenderlas, reactivarlas o revocarlas.
- Suspender, reactivar o cancelar licencias según el rol.
- Consultar eventos de auditoría de cada licencia.

`OWNER` y `ADMIN` pueden gestionar escuelas, pagos, códigos y estados;
`SUPPORT` tiene acceso de consulta. Solo `OWNER` puede cancelar una licencia.
La API vuelve a validar permisos en cada solicitud: ocultar botones en el panel
no sustituye la autorización del backend.

Los códigos de activación se muestran una sola vez en el panel. Entrégalos de
forma segura y no los guardes en tickets ni registros compartidos.

## Build

```powershell
npm run build
npm run preview
```

El resultado estático se genera en `dist/`. Configura `VITE_API_BASE_URL` en el
momento del build; las variables `VITE_*` forman parte del JavaScript público y
nunca deben contener contraseñas ni secretos.
