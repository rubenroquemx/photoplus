# 📸 PhotoPlus - Tienda de Fotografías Sincronizada con Google Drive

**PhotoPlus** es una plataforma profesional de comercio electrónico para fotógrafos que permite vender fotografías digitales en alta resolución sincronizadas directamente desde **Google Drive**, con pasarela de pagos mediante **Mercado Pago**, autenticación de clientes con **Google**, panel de favoritas y entrega digital con **enlaces de descarga intransferibles y protegidos**.

---

## ✨ Características Principales

- **☁️ Sincronización Automática con Google Drive**:
  - Lee carpetas de Google Drive y crea álbumes con el **nombre exacto de la carpeta**.
  - Asigna la **fecha original de creación** de la carpeta en Drive al álbum.
  - Asigna automáticamente el **precio base configurado** a todas las fotos.
  - Botón de sincronización masiva para procesar todas las carpetas nuevas en 1 clic.

- **🛡️ Protección de Fotografías con Marca de Agua (Sharp)**:
  - Muestras protegidas con marca de agua diagonal y banner de advertencia generados en tiempo real.
  - El cliente nunca tiene acceso al archivo original sin marcas antes de pagar.

- **👤 Cuentas de Clientes con Google**:
  - Inicio de sesión con Google para compradores.
  - **Panel de Fotos Favoritas**: Guarda fotos deseadas con 1 clic en el corazón y opción para comprarlas todas juntas.
  - **Panel de Compras**: Historial de pedidos y acceso a todas sus fotos adquiridas.

- **🔒 Descargas Intransferibles y Seguras**:
  - Los enlaces de descarga son personales y están vinculados exclusivamente a la cuenta de Google del comprador.
  - Si el enlace se comparte, el sistema deniega el acceso solicitando iniciar sesión con la cuenta de Google titular.
  - Control de límite de descargas (10 intentos) y caducidad automática (7 días).

- **💳 Integración con Mercado Pago**:
  - Checkout Pro oficial para México y LATAM (tarjetas de crédito/débito, transferencias SPEI, OXXO/efectivo).
  - Webhooks automáticos para acreditación inmediata de compras.

- **🎛️ Panel de Administración (`/admin`)**:
  - Conexión OAuth 2.0 con Google Drive.
  - Métricas de ingresos en MXN, fotos vendidas y órdenes totales.
  - Control de álbumes, visibilidad pública y precios personalizados.
  - Configuración de marca de agua, eslogan y datos de contacto.

---

## 🚀 Despliegue en Producción

PhotoPlus está optimizado con **Next.js Standalone**, encabezados de seguridad HTTP (HSTS, CSP, X-Frame-Options) y contenedor Docker multi-stage.

### Opción A: Despliegue con Docker / Docker Compose (Recomendado para VPS / Railway / Render)

1. **Configurar el archivo `.env` en tu servidor:**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales reales de Google y Mercado Pago
   ```

2. **Iniciar la aplicación con Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

3. **Ejecutar migraciones y sembrar si es necesario:**
   ```bash
   docker compose exec photoplus npx prisma db push
   ```

La aplicación estará activa en el puerto `3005` (o el puerto configurado) con almacenamiento persistente en el volumen Docker `photoplus_data`.

---

### Opción B: Despliegue en Railway / Render

1. Conecta tu repositorio de GitHub `https://github.com/rubenroquemx/photoplus` en el panel de Railway o Render.
2. Agrega las **Variables de Entorno** (Environment Variables) listadas abajo.
3. El comando de build configurado en `package.json` (`npm run build`) ejecutará automáticamente `prisma generate` y compilará la aplicación en modo Standalone.
4. El comando de inicio es `npm start` (o `node server.js`).

---

### Opción C: Despliegue en Vercel

1. Importa el repositorio desde GitHub en [vercel.com](https://vercel.com).
2. Para la base de datos en Vercel Serverless, puedes usar una base de datos PostgreSQL gratuita o gestionada (Supabase, Neon o Turso):
   - Cambia `provider = "postgresql"` en `prisma/schema.prisma` y coloca tu `DATABASE_URL` en las variables de entorno de Vercel.
3. Agrega las variables de entorno en Vercel y haz clic en **Deploy**.

---

## 🔑 Variables de Entorno de Producción

| Variable | Descripción | Ejemplo / Valor |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `DATABASE_URL` | Conexión de base de datos | `file:/app/prisma/prod.db` o Postgres URL |
| `NEXT_PUBLIC_APP_URL` | URL pública de tu tienda (con HTTPS) | `https://tu-dominio.com` |
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud Console | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google Cloud Console | `GOCSPX-xxxx` |
| `GOOGLE_REDIRECT_URI` | URI de redirección autorizada en Google | `https://tu-dominio.com/api/auth/google/callback` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acceso de producción de MP | `APP_USR-xxxx` |
| `MERCADO_PAGO_PUBLIC_KEY` | Llave pública de producción de MP | `APP_USR-xxxx` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secreto del webhook de MP (opcional) | `xxxx` |
| `ADMIN_PASSWORD` | Contraseña para entrar a `/admin` | `TuContraseñaSegura2026!` |
| `ADMIN_SESSION_SECRET` | Cadena aleatoria para firmar cookies | Cadena aleatoria de 32+ caracteres |

---

## 📋 Pasos para Credenciales de Producción

### 1. Google Cloud Console (Drive API y OAuth)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. En **APIs & Services > Credentials > Tu Cliente OAuth**:
   - En **Authorized JavaScript origins**, agrega: `https://tu-dominio.com`.
   - En **Authorized redirect URIs**, agrega:
     - `https://tu-dominio.com/api/auth/google/callback` (Admin / Drive)
     - `https://tu-dominio.com/api/auth/customer/google/callback` (Clientes)
3. En **OAuth consent screen**, cambia el estado a **In Production** (o mantén tus correos en usuarios de prueba).

### 2. Mercado Pago Producción
1. Ingresa a [Mercado Pago Developers](https://www.mercadopago.com.mx/developers).
2. Activa tus **Credenciales de producción** (`APP_USR-...`).
3. En **Webhooks**, configura la URL de notificación: `https://tu-dominio.com/api/webhooks/mercadopago` con el evento `payment`.

---

## 💻 Desarrollo Local

```bash
# 1. Clonar e instalar
git clone https://github.com/rubenroquemx/photoplus.git
cd photoplus
npm install

# 2. Inicializar base de datos
npx prisma db push
npx tsx prisma/seed.ts

# 3. Iniciar servidor local (Puerto 3005)
npm run dev
```

- **Tienda**: [http://localhost:3005](http://localhost:3005)
- **Panel Admin**: [http://localhost:3005/admin](http://localhost:3005/admin) (Contraseña por defecto: `adminphotoplus`)
- **Portal de Cliente**: [http://localhost:3005/mi-cuenta](http://localhost:3005/mi-cuenta)

---

## 📄 Licencia

Desarrollado con arquitectura moderna en Next.js, Prisma y Tailwind CSS. Licencia MIT.
