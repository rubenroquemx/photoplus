# 📸 PhotoPlus - Tienda de Fotografías Sincronizada con Google Drive

**PhotoPlus** es una plataforma moderna para fotógrafos profesionales y creadores que permite vender fotografías digitales en alta resolución sincronizadas directamente desde carpetas de **Google Drive**, con pasarela de pagos mediante **Mercado Pago** y protección de muestras con **marcas de agua dinámicas**.

---

## ✨ Características Principales

- **☁️ Sincronización Directa con Google Drive (OAuth 2.0)**:
  - Vincula tu cuenta de Google con un clic desde el panel de administración.
  - Explora y selecciona carpetas de Google Drive para importarlas como álbumes o eventos en la tienda.
  - Sincronización automática de fotos, nombres de archivo y metadatos.

- **🛡️ Protección de Fotografías con Marca de Agua (Sharp)**:
  - Las fotos en el catálogo público se sirven con marca de agua diagonal y banner protector generados dinámicamente en el servidor.
  - El cliente **nunca tiene acceso a la foto original** antes de pagar.
  - Personalización de marca de agua y opacidad desde la configuración.

- **🛒 Venta por Foto Individual**:
  - Catálogo filtrable por álbum o evento con buscador rápido.
  - Visualización en cuadrícula y vista detallada (lightbox) con zoom.
  - Carrito de compras interactivo con selección de fotos individuales.

- **💳 Integración con Mercado Pago**:
  - Generación de preferencias de pago con **Checkout Pro** (soporte para tarjetas, transferencias SPEI y pagos en efectivo).
  - Webhooks para confirmación automática e instantánea del pago.
  - Modo Demostración integrado para probar compras completas sin cobros reales.

- **⚡ Entrega Digital Segura**:
  - Al acreditarse el pago, se generan **tokens únicos y seguros de descarga**.
  - Los clientes descargan el archivo original nativo directamente desde Google Drive (sin marcas ni compresión).
  - Límite de descargas (por defecto 10 intentos) y caducidad programable (7 días).

- **🎛️ Panel de Administración Completo (`/admin`)**:
  - Conexión / Reconexión con Google Drive.
  - Explorador de carpetas de Drive para importar álbumes.
  - Edición de precios por foto y control de visibilidad (público / oculto).
  - Historial de órdenes, clientes y métricas de ingresos en MXN.
  - Personalización de marca del estudio, eslogan y parámetros de marca de agua.

---

## 🚀 Tecnologías Utilizadas

- **Frontend & Backend**: [Next.js](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos & ORM**: Prisma ORM con SQLite (fácilmente migrable a PostgreSQL / Turso / Supabase)
- **Procesamiento de Imágenes**: [Sharp](https://sharp.pixelplumbing.com/)
- **APIs Externas**:
  - Google Drive API v3 (`googleapis`)
  - Mercado Pago SDK Node (`mercadopago`)
- **Gestión de Estado**: Zustand con persistencia local

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/rubenroquemx/photoplus.git
cd photoplus
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz (puedes basarte en `.env.example`):

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# URL base de tu aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Credenciales de Google Cloud OAuth 2.0 (Google Drive API)
GOOGLE_CLIENT_ID="tu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Credenciales de Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="TEST-..."
MERCADO_PAGO_PUBLIC_KEY="TEST-..."
MERCADO_PAGO_WEBHOOK_SECRET=""

# Contraseña de acceso al panel administrador
ADMIN_PASSWORD="adminphotoplus"
ADMIN_SESSION_SECRET="tu_clave_secreta_para_sesion"
```

### 4. Inicializar la base de datos y datos de muestra
```bash
# Crear las tablas en SQLite
npx prisma db push

# (Opcional) Cargar álbumes y fotos de demostración
npx tsx prisma/seed.ts
```

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la tienda.

---

## 🔑 Guía para Obtener las Credenciales

### A. Google Drive API (OAuth 2.0)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (ej. `PhotoPlus Store`).
3. Ve a **APIs & Services > Library** y habilita **Google Drive API**.
4. En **APIs & Services > OAuth consent screen**:
   - Selecciona **External** y llena los datos requeridos.
   - En **Scopes**, añade: `https://www.googleapis.com/auth/drive.readonly`, `.../userinfo.profile`, `.../userinfo.email`.
   - En **Test users**, agrega el correo de Google con el que sincronizarás tus fotos.
5. En **APIs & Services > Credentials**:
   - Haz clic en **Create Credentials > OAuth client ID**.
   - Tipo de aplicación: **Web application**.
   - En **Authorized redirect URIs**, agrega: `http://localhost:3000/api/auth/google/callback` (y tu dominio en producción).
6. Copia el **Client ID** y **Client Secret** en tu `.env`.

### B. Mercado Pago
1. Ingresa a [Mercado Pago Developers](https://www.mercadopago.com.mx/developers).
2. Crea una aplicación y ve a **Credenciales de prueba** (o de producción).
3. Copia el **Access Token** y **Public Key** en tu archivo `.env`.

---

## 📦 Estructura del Código

```
photoplus/
├── prisma/
│   ├── schema.prisma           # Modelos de BD (Album, Photo, Order, OrderItem, Setting)
│   └── seed.ts                 # Datos de prueba
├── src/
│   ├── app/
│   │   ├── page.tsx            # Galería pública y catálogo
│   │   ├── admin/page.tsx      # Panel de administración y sincronizador
│   │   ├── order/[id]/page.tsx # Confirmación y descarga segura
│   │   └── api/
│   │       ├── auth/           # OAuth Google y login admin
│   │       ├── drive/          # Listado y sincronización de carpetas
│   │       ├── photos/         # Previsualizaciones con marca de agua
│   │       ├── checkout/       # Creación de pagos en Mercado Pago
│   │       ├── webhooks/       # Notificaciones de pago
│   │       └── download/       # Descarga tokenizada de alta resolución
│   ├── components/             # Navbar, Footer, PhotoCard, Lightbox, CartDrawer
│   └── lib/                    # Clientes de Prisma, Google Drive, Sharp y MP
└── .env.example
```

---

## 📄 Licencia

Desarrollado para fotógrafos independientes y agencias. Licencia MIT.
