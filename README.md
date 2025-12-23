# Portfolio Backend API

Backend API para el sitio de portafolio, diseñado para desplegarse en Dokploy.

## 🚀 Despliegue en Dokploy

### 1. Crear nuevo proyecto en Dokploy

1. Accede a tu panel de Dokploy
2. Crea un nuevo proyecto llamado "portfolio-backend"
3. Configura el repositorio Git o sube el código directamente

### 2. Configurar variables de entorno

En Dokploy, ve a la sección de variables de entorno y configura:

```env
DATABASE_URL=postgresql://postgres:tu_password_seguro@db:5432/portfolio?schema=public
JWT_SECRET=tu_clave_jwt_super_secreta_aqui
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.com
BASE_URL=https://tu-api.tu-dominio.com
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=tu_password_admin_seguro
```

### 3. Configurar PostgreSQL

En Dokploy:
1. Ve a "Services" > "Add Service" > "PostgreSQL"
2. Configura:
   - Nombre: `portfolio-db`
   - User: `postgres`
   - Password: `tu_password_seguro`
   - Database: `portfolio`

### 4. Desplegar

Dokploy detectará automáticamente el `Dockerfile` y construirá la imagen.

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/signup` - Registro de usuario
- `POST /api/auth/signin` - Inicio de sesión
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/change-password` - Cambiar contraseña

### Proyectos
- `GET /api/projects` - Listar proyectos
- `GET /api/projects/:id` - Obtener proyecto
- `POST /api/projects` - Crear proyecto (admin)
- `PUT /api/projects/:id` - Actualizar proyecto (admin)
- `DELETE /api/projects/:id` - Eliminar proyecto (admin)

### Experiencias
- `GET /api/experiences` - Listar experiencias
- `GET /api/experiences/:id` - Obtener experiencia
- `POST /api/experiences` - Crear experiencia (admin)
- `PUT /api/experiences/:id` - Actualizar experiencia (admin)
- `DELETE /api/experiences/:id` - Eliminar experiencia (admin)

### Certificaciones
- `GET /api/certifications` - Listar certificaciones
- `GET /api/certifications/:id` - Obtener certificación
- `POST /api/certifications` - Crear certificación (admin)
- `PUT /api/certifications/:id` - Actualizar certificación (admin)
- `DELETE /api/certifications/:id` - Eliminar certificación (admin)

### Mensajes de Contacto
- `POST /api/contact` - Enviar mensaje (público)
- `GET /api/contact` - Listar mensajes (admin)
- `GET /api/contact/:id` - Obtener mensaje (admin)
- `PATCH /api/contact/:id/read` - Marcar como leído (admin)
- `PATCH /api/contact/:id/archive` - Archivar mensaje (admin)

### Configuraciones
- `GET /api/settings` - Obtener todas las configuraciones
- `GET /api/settings/:key` - Obtener configuración específica
- `PUT /api/settings/:key` - Actualizar configuración (admin)
- `POST /api/settings/bulk` - Actualización masiva (admin)

### Uploads
- `POST /api/upload/single` - Subir archivo (admin)
- `POST /api/upload/multiple` - Subir múltiples archivos (admin)
- `DELETE /api/upload` - Eliminar archivo (admin)
- `GET /api/upload/list` - Listar archivos (admin)

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Seed de datos iniciales
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

## 🐳 Docker Local

```bash
# Construir y levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Ejecutar seed (primera vez)
docker-compose exec api npx tsx prisma/seed.ts
```

## 🔐 Seguridad

- Autenticación JWT con expiración de 7 días
- Passwords hasheados con bcrypt (12 rounds)
- Rate limiting: 100 requests/15min por IP
- Helmet para headers de seguridad
- CORS configurable
- Validación de inputs con Zod
- Roles de usuario (admin, moderator, user)

## 📦 Tecnologías

- **Runtime**: Node.js 20
- **Framework**: Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **File Upload**: Multer
