# Proyecto-Software-2025

Desarrollo de un sistema de gestión para el comedor de una escuela primaria. El
proyecto busca optimizar la administración de menús, el control de inventario y
el registro de alumnos.

# Sistema de Gestión de Comedor Escolar

# Backend

## 📋 Descripción

Sistema web completo para la gestión integral de un comedor escolar,
desarrollado con **Node.js v22.12.0**, **Express v5.1.0** y **MySQL 8.0.42**.
Permite administrar inventarios, planificar menús, controlar asistencias y
generar reportes detallados del funcionamiento del comedor.

## 🎯 Características Principales

- **Gestión de Usuarios y Roles**: Sistema de autenticación con roles
  diferenciados (Administrador, Cocinero, Encargado de Inventario, Docente,
  Supervisor)
- **Control de Inventario**: Seguimiento en tiempo real de insumos, stock mínimo
  y movimientos
- **Planificación de Menús**: Creación y gestión de recetas con cálculo
  automático de ingredientes
- **Registro de Asistencias**: Control diario de asistencia por grado y tipo de
  servicio
- **Gestión de Proveedores**: Administración de proveedores y pedidos de insumos
- **Auditoría Completa**: Registro detallado de todas las operaciones del sistema
- **Reportes y Estadísticas**: Generación de reportes de consumo, inventario y
  costos

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL/MariaDB
- **Autenticación**: JWT (JSON Web Tokens)
- **Encriptación**: bcrypt para contraseñas
- **Arquitectura**: API RESTful
- **Identificadores**: UUID para integridad de datos

## 📊 Estructura de la Base de Datos

El sistema cuenta con 15+ tablas relacionales que gestionan:

- Seguridad y usuarios
- Inventario y recetas
- Abastecimiento y proveedores
- Flujo operacional (consumos)
- Control y trazabilidad

## 🚀 Instalación y Uso

### Requisitos Previos

- **Node.js**: v18.0.0 o superior
- **npm** o **pnpm**: Gestor de paquetes
- **MySQL**: v8.0 o superior
- **Git**: Para clonar el repositorio

### Pasos de Instalación

#### 1. Instalar Dependencias

```bash
cd server
pnpm install
```

#### 2. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `server/`:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=comedor_escolar
DB_PORT=3306

# Servidor
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_32_caracteres_minimo
JWT_EXPIRE=7d

# Telegram Bot (Opcional - para alertas de inventario)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_BOT_USERNAME=Comedor_Escolar_Bot

# Email Service (Opcional - para notificaciones por email)
MAILTRAP_TOKEN=tu_token_mailtrap
MAILTRAP_FROM_EMAIL=noreply@comedor.escolar

# Entorno
CORS_ORIGIN=http://localhost:5173
```

#### 3. Configurar Base de Datos

```bash
# Crear base de datos
mysql -u root -p < server/sql/create_database.sql

# Cargar estructura de tablas
mysql -u root -p comedor_escolar < server/sql/schema.sql

# Cargar datos iniciales (opcional)
mysql -u root -p comedor_escolar < server/sql/seed_data.sql
```

#### 4. Iniciar el Servidor

```bash
cd server

# En modo desarrollo (con reinicio automático)
pnpm run dev

# En modo producción
pnpm start
```

El servidor estará disponible en `http://localhost:5000`

### Verificación de la Instalación

```bash
# Probar endpoint de salud
curl http://localhost:5000/api/health

# Ver logs del servidor
# Los logs deben mostrar: "✅ Servidor ejecutándose en puerto 5000"
```

## 📁 Estructura del Proyecto

```
├── server/
│   ├── models/          # Modelos de datos
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares de autenticación
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── schemas/         # Validaciones de los datos (nivel de aplicación)
│   ├── services/        # Servicio de mensajería (mailtrap y telegram)
│   └── sql/             # Scripts de base de datos
└── README.md
```

## 👥 Roles del Sistema

### Descripción de Roles

**Administrador**

- Acceso completo al sistema
- Gestión de usuarios, roles y permisos
- Gestión de alumnos, docentes y grados
- Gestión de insumos y proveedores
- Auditoría y reportes del sistema
- Configuración de parámetros del sistema

**Cocinero/Cocinera**

- Gestión de recetas e ingredientes
- Planificación de menús por servicio y fecha
- Control de asistencias de alumnos
- Gestión de inventario
- Registro de consumos
- Generación de pedidos de insumos
- Visualización de estadísticas y reportes
- Recepción de alertas de bajo stock

**Docente**

- Registro de asistencia diaria de alumnos
- Visualización de información del grado
- Acceso a reportes de asistencia

**Supervisor**

- Acceso a reportes y estadísticas
- Monitoreo de inventario
- Generación de informes

**Encargado de Inventario**

- Gestión completa de inventario
- Control de movimientos
- Gestión de mermas
- Seguimiento de stock

## 🔒 Seguridad

- Autenticación JWT con tokens con expiración
- Encriptación de contraseñas con bcrypt (10 rondas)
- Control de acceso basado en roles (RBAC)
- Validación de datos de entrada en nivel de esquema
- Auditoría completa de operaciones
- Headers de seguridad HTTP
- Rate limiting para endpoints críticos
- CORS configurado por dominio

## 🔌 Endpoints Principales de la API

### Autenticación

```
POST   /api/auth/login              # Login de usuario
POST   /api/auth/logout             # Logout
POST   /api/auth/refresh            # Refrescar token JWT
```

### Usuarios

```
GET    /api/usuarios                # Listar usuarios
POST   /api/usuarios                # Crear usuario
GET    /api/usuarios/:id            # Obtener usuario
PUT    /api/usuarios/:id            # Actualizar usuario
DELETE /api/usuarios/:id            # Eliminar usuario
```

### Inventario

```
GET    /api/insumos                 # Listar insumos
POST   /api/insumos                 # Crear insumo
PUT    /api/insumos/:id             # Actualizar insumo
GET    /api/inventarios             # Listar inventario
POST   /api/movimientos-inventarios # Registrar movimiento
GET    /api/alertas-inventario      # Obtener alertas
```

### Recetas y Menús

```
GET    /api/recetas                 # Listar recetas
POST   /api/recetas                 # Crear receta
PUT    /api/recetas/:id             # Actualizar receta
GET    /api/planificacion-menus     # Listar planificaciones
POST   /api/planificacion-menus     # Crear planificación
PUT    /api/planificacion-menus/:id # Actualizar planificación
```

### Asistencias

```
POST   /api/asistencias             # Registrar asistencia
GET    /api/asistencias             # Obtener asistencias
PATCH  /api/asistencias/:id         # Actualizar tipo asistencia
```

### Pedidos y Proveedores

```
GET    /api/pedidos                 # Listar pedidos
POST   /api/pedidos                 # Crear pedido
GET    /api/proveedores             # Listar proveedores
POST   /api/proveedores             # Crear proveedor
```

### Alertas Telegram

```
POST   /api/telegram/enviar-alerta  # Enviar alerta manual
GET    /api/telegram/status         # Verificar estado bot
```

Todos los endpoints están protegidos con autenticación JWT excepto `/api/auth/login`.

Proyecto en desarrollo activo con funcionalidades core implementadas y en
proceso de testing.

# Frontend

## 📋 Descripción

Interfaz web moderna y responsiva para la gestión del comedor escolar, desarrollada con **React 18.3.1** y **Vite 7.1.12**. Proporciona una experiencia de usuario intuitiva para los diferentes roles del sistema, con dashboards personalizados, gráficos estadísticos interactivos y formularios validados.

## 🛠️ Tecnologías Utilizadas

### Core

- **React 18.3.1**: Framework de UI interactivo
- **Vite 7.1.12**: Bundler y servidor de desarrollo
- **React Router v6.28**: Navegación y enrutamiento
- **Axios**: Cliente HTTP para comunicación con API

### Visualización de Datos

- **Chart.js 4.5.1**: Librería de gráficos
- **react-chartjs-2 5.3.1**: Integración de Chart.js con React
- **html2canvas 1.4.1**: Captura de elementos HTML
- **jsPDF 3.0.4**: Generación de reportes en PDF
- **jspdf-autotable 5.0.2**: Generación de tabla en PDF
- **sweetalert2 11.26.17 **: Mensaje de alerta

### UI y Estilos

- **Bootstrap 5.3**: Framework CSS
- **Font Awesome 7.1.0**: Iconografía
- **CSS personalizado**: Estilos específicos de la aplicación

### Validación y Formularios

- **ESLint**: Linting de código JavaScript

## 🎯 Características del Frontend

- **Dashboard Personalizado**: Vistas diferentes según rol del usuario
- **Gestión de Inventario**: Tabla interactiva con búsqueda y filtros
- **Planificación de Menús**: Calendario visual para asignar recetas por servicio
- **Control de Asistencias**: Interfaz para marcar asistencia de alumnos
- **Estadísticas Avanzadas**: 5 tipos de gráficos con opciones de filtrado
- **Generación de Reportes**: Exportación a PDF con gráficos incluidos
- **Modo Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Sistema de Alertas**: Notificaciones de bajo stock via Telegram

## 📊 Estructura del Proyecto Frontend

```
client/
├── public/                      # Archivos estáticos
├── src/
│   ├── assets/                 # Imágenes y recursos
│   ├── components/             # Componentes reutilizables
│   │   ├── SidebarMenu.jsx
│   │   ├── Navbar.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/                # Context API para estado global
│   │   └── AuthContext.jsx
│   ├── hooks/                  # Custom hooks
│   │   └── useAuth.js
│   ├── layouts/                # Layouts de página
│   │   ├── AdminLayout.jsx
│   │   ├── CocineroLayout.jsx
│   │   └── DocenteLayout.jsx
│   ├── pages/                  # Páginas/vistas
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── GestionAlumnos.jsx
│   │   │   ├── GestionDocentes.jsx
│   │   │   ├── GestionGrados.jsx
│   │   │   ├── GestionInsumos.jsx
│   │   │   ├── GestionProveedores.jsx
│   │   │   ├── GestionUsuarios.jsx
│   │   │   ├── GestionRoles.jsx
│   │   │   └── GestionRolPermisos.jsx
│   │   ├── cocinera/
│   │   │   ├── DashboardCocinero.jsx
│   │   │   ├── GestionRecetas.jsx
│   │   │   ├── RecetaForm.jsx
│   │   │   ├── PlanificacionCalendario.jsx
│   │   │   ├── PlanificacionListado.jsx
│   │   │   ├── ListaAsistencia.jsx
│   │   │   ├── Inventarios.jsx
│   │   │   ├── Consumos.jsx
│   │   │   ├── Pedidos.jsx
│   │   │   ├── Estadistica.jsx
│   │   │   └── AlertasInventario.jsx
│   │   └── docente/
│   │       ├── DashboardDocente.jsx
│   │       └── RegistroAsistencia.jsx
│   ├── routes/                 # Definición de rutas
│   │   └── AppRoutes.jsx
│   ├── services/               # Servicios API
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── alumnosService.js
│   │   ├── docentesService.js
│   │   ├── gradosService.js
│   │   ├── insumosService.js
│   │   ├── proveedoresService.js
│   │   ├── usuariosService.js
│   │   ├── rolesService.js
│   │   ├── recetasService.js
│   │   ├── planificacionMenuService.js
│   │   ├── consumosService.js
│   │   ├── asistenciasService.js
│   │   ├── pedidosService.js
│   │   ├── movimientosInventarioService.js
│   │   ├── serviciosService.js
│   │   └── alertasService.js
│   ├── styles/                 # Estilos globales y por módulo
│   │   ├── App.css
│   │   ├── PlanificacionMenus.css
│   │   ├── GestionRecetas.css
│   │   └── Estadistica.css
│   ├── utils/                  # Funciones auxiliares
│   │   ├── dateUtils.js
│   │   ├── formatUtils.js
│   │   └── validationUtils.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## 🚀 Instalación y Configuración Completa

### Requisitos Previos

- **Node.js**: v18.0.0 o superior
- **npm** o **pnpm**: Gestor de paquetes
- **MySQL**: Servidor de base de datos
- **Git**: Control de versiones

### Pasos de Instalación

#### 1. Clonar el Repositorio

```bash
git clone <URL_REPOSITORIO>
cd Comedor
```

#### 2. Configurar el Backend

```bash
cd server
pnpm install
```

#### 3. Configurar Variables de Entorno (Backend)

Crear archivo `.env` en la carpeta `server/`:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=comedor_escolar
DB_PORT=3306

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
JWT_EXPIRE=7d

# Telegram Bot (Opcional - para alertas)
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_id_de_chat
TELEGRAM_BOT_USERNAME=nombre_del_bot

# Email Service (Opcional - para notificaciones)
MAILTRAP_TOKEN=tu_token_mailtrap
MAILTRAP_FROM_EMAIL=noreply@comedor.escolar
```

#### 4. Configurar Base de Datos

```bash
# Crear base de datos
mysql -u root -p < server/sql/create_database.sql

# Cargar estructura
mysql -u root -p comedor_escolar < server/sql/schema.sql

# Cargar datos iniciales (opcional)
mysql -u root -p comedor_escolar < server/sql/seed_data.sql
```

#### 5. Iniciar Backend

```bash
cd server
pnpm start
# o para desarrollo con reinicio automático:
pnpm run dev
```

El servidor estará disponible en `http://localhost:5000`

#### 6. Configurar el Frontend

```bash
cd client
pnpm install
```

#### 7. Iniciar Frontend

```bash
cd client
pnpm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🤖 Integración con Telegram

### Configuración Requerida

La aplicación incluye soporte para notificaciones automáticas via Telegram cuando el stock de insumos cae por debajo de los límites establecidos.

#### Paso 1: Crear un Bot de Telegram

1. Abrir Telegram y buscar `@BotFather`
2. Escribir `/start` y seguir las instrucciones
3. Usar `/newbot` para crear un nuevo bot
4. Guardar el token recibido

#### Paso 2: Obtener el Chat ID

1. Crear un grupo en Telegram o usar chat privado
2. Invitar al bot al grupo
3. Enviar cualquier mensaje
4. Usar este endpoint para obtener el Chat ID:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

Buscar el campo `"id"` en la respuesta (será el Chat ID)

#### Paso 3: Configurar Variables de Entorno

Agregar al archivo `.env` del backend:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_BOT_USERNAME=Comedor_Escolar_Bot
```

#### Paso 4: Usar Alertas en la Aplicación

Las alertas se generan automáticamente cuando:

- El stock de un insumo cae por debajo del mínimo
- Se realiza un consumo que afecta el stock mínimo
- Se registra un movimiento de inventario

**Ejemplo de alerta:**

```
🚨 ALERTA DE INVENTARIO 🚨

Insumo: Arroz Blanco
Stock Actual: 5 kg
Stock Mínimo: 10 kg

⚠️ El inventario está por debajo del nivel mínimo
```

---

## 🔐 Autenticación y Roles

### Credenciales de Prueba

```
ADMINISTRADOR:
  Usuario: admin@escuela.com
  Contraseña: Admin123!

COCINERO:
  Usuario: cocinero@escuela.com
  Contraseña: Cocinero123!

DOCENTE:
  Usuario: docente@escuela.com
  Contraseña: Docente123!
```

### Permisos por Rol

| Funcionalidad           | Admin | Cocinera | Docente | Proveedor |
| ----------------------- | ----- | -------- | ------- | ------- |
| Gestión de Usuarios     | ✅    | ❌       | ❌      |❌      |
| Gestión de Insumos      | ✅    | ✅       | ❌      |❌      |
| Planificación de Menús  | ❌    | ✅       | ❌      |❌      |
| Registro de Asistencias | ❌    | ✅       | ✅      |❌      |
| Inventario              | ✅    | ✅       | ❌      |❌      |
| Reportes y Estadísticas | ❌    | ✅       | ❌      |❌      |
| Gestión de Pedidos      | ❌    | ✅       | ❌      | ✅      |

---

## 📈 Funcionalidades Principales del Frontend

### 1. Planificación de Menús

- Calendario interactivo por semana
- Asignación de recetas por servicio (Desayuno, Almuerzo, Merienda)
- Bloqueado de fechas fuera del rango de planificación
- Vista de comensales por servicio y día
- Eliminación de menús asignados

### 2. Gestión de Recetas

- CRUD completo de recetas
- Selección de servicios aplicables
- Definición de ingredientes con cantidades
- Búsqueda y filtrado por nombre

### 3. Control de Asistencias

- Marcado de asistencia por grado y fecha
- Cambio dinámico entre estados (Presente, No confirmado, Ausente)
- Visualización de comensales por servicio
- Generación automática de enlaces de asistencia

### 4. Inventario

- Tabla interactiva de insumos
- Búsqueda y filtrado
- Stock mínimo alertas
- Movimientos de inventario
- Control de mermas

### 5. Estadísticas y Reportes

- Gráfico de consumos por día (Línea)
- Gráfico de asistencias (Doughnut)
- Consumo por servicio (Barras)
- Distribución de inventario (Pie)
- Top 5 insumos más consumidos (Barras Horizontales)
- Filtro por rango de fechas
- Exportación a PDF con gráficos

### 6. Gestión de Pedidos

- Creación de pedidos de insumos
- Seguimiento del estado
- Recepción de mercadería

---

## 🧪 Testing y Desarrollo

### Ejecutar en Modo Desarrollo

Backend:

```bash
cd server
pnpm run dev
```

Frontend:

```bash
cd client
pnpm run dev
```

### Linting

Frontend:

```bash
cd client
pnpm run lint
```

---

## 🐛 Solución de Problemas Comunes

### Error de Conexión a Base de Datos

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solución:**

- Verificar que MySQL esté ejecutándose
- Revisar credenciales en `.env`
- Confirmar que la base de datos existe

### Error CORS en el Frontend

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solución:**

- Verificar que el backend está ejecutándose en `http://localhost:3000`
- Revisar configuración de CORS en `server/middlewares/cors.js`
- Reiniciar el servidor backend

### No se reciben notificaciones de Telegram

**Checklist:**

- Verificar que `TELEGRAM_BOT_TOKEN` sea válido
- Confirmar que `TELEGRAM_CHAT_ID` sea correcto
- Revisar logs: `console.error` en `telegramController.js`
- Bot debe estar añadido al grupo/chat

---

## 📝 Scripts Útiles

### Backend

```bash
# Desarrollo con reinicio automático
pnpm run dev

# Iniciar en producción
pnpm start

# Ejecutar linting
pnpm run lint
```

### Frontend

```bash
# Desarrollo con hot reload
pnpm run dev

# Build para producción
pnpm run build

# Preview de build
pnpm run preview

# Linting
pnpm run lint
```

---

## 📚 Documentación Adicional

- **API REST**: Documentación en `server/README.md`
- **Estructura BD**: Schema en `server/sql/schema.sql`
- **Endpoints**: Disponibles en `server/routes/`

---

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.

---

## 📄 Licencia

Proyecto desarrollado para propósitos educativos y de gestión escolar.

---

## 📈 Estado del Proyecto

Proyecto en desarrollo activo con funcionalidades core implementadas y en proceso de testing.

### ✅ Funcionalidades Completadas

**Backend:**

- ✅ Sistema de autenticación y autorización JWT
- ✅ CRUD completo de usuarios, roles y permisos
- ✅ Gestión de inventario con alertas automáticas
- ✅ Planificación de menús con tabla intermedia RecetaServicio
- ✅ Control de asistencias con generación de enlaces
- ✅ Sistema de pedidos de insumos
- ✅ Integración con Telegram para alertas de bajo stock
- ✅ Validación de datos con schemas aplicación
- ✅ Auditoría completa de operaciones
- ✅ Manejo de errores mejorado con mensajes específicos
- ✅ Cascading deletes en relaciones complejas

**Frontend:**

- ✅ Interfaz de login con autenticación JWT
- ✅ Dashboard personalizado por rol (Admin, Cocinero, Docente)
- ✅ Gestión completa de usuarios y roles con permisos
- ✅ CRUD de alumnos, docentes, grados
- ✅ CRUD de insumos, proveedores y servicios
- ✅ Planificación visual de menús con calendario interactivo
- ✅ Bloqueo de fechas fuera de rango de planificación
- ✅ Control de asistencias con cambio de tipos (Si/No/Ausente)
- ✅ Dashboard de estadísticas con 5 tipos de gráficos
- ✅ Exportación de reportes a PDF con gráficos incluidos
- ✅ Interfaz responsiva con Bootstrap 5
- ✅ Alertas de bajo stock en tiempo real
- ✅ Búsqueda y filtrado en tablas
- ✅ Validación de formularios

**Última actualización:** Febrero 4, 2026
