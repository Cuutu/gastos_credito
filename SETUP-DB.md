# Configurar la base de datos (Neon)

Tu proyecto ya usa **Neon** (PostgreSQL serverless). Seguí estos pasos para crear la base de datos gratis:

## 1. Crear cuenta en Neon

1. Entrá a **[neon.tech](https://neon.tech)**
2. Hacé clic en **"Sign up"** (podés usar GitHub, Google o email)
3. Es gratis, no requiere tarjeta de crédito

## 2. Crear el proyecto

1. Una vez dentro, hacé clic en **"New Project"**
2. Elegí un nombre (ej: `gastito-credito`)
3. Elegí la región más cercana (ej: `South America (São Paulo)`)
4. Hacé clic en **"Create Project"**

## 3. Obtener la URL de conexión

1. En el dashboard, vas a ver **"Connection string"** o **"Connection details"**
2. En la pestaña **"Connection string"**, seleccioná **"Pooled connection"** (recomendado para serverless)
3. Copiá la URL que empieza con `postgresql://...`

## 4. Configurar en tu proyecto

1. Copiá el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Abrí `.env.local` y pegá tu URL en `DATABASE_URL` y tu contraseña en `APP_PASSWORD`:
   ```
   DATABASE_URL=postgresql://tu_usuario:tu_password@tu_host.neon.tech/tu_db?sslmode=require
   APP_PASSWORD=tu_contraseña_secreta
   ```

## 5. Crear las tablas

1. En el dashboard de Neon, andá a **"SQL Editor"** (menú lateral)
2. Abrí el archivo `scripts/001-create-tables.sql` de este proyecto
3. Copiá todo el contenido y pegálo en el SQL Editor
4. Hacé clic en **"Run"**

¡Listo! Ya podés ejecutar `npm run dev` y probar la app.

---

## Alternativa: Supabase

Si preferís otro proveedor, también podés usar:

- **[Supabase](https://supabase.com)** - PostgreSQL gratis + más opciones
- En **Settings → Database** vas a encontrar la connection string.
