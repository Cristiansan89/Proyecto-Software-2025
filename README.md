# Proyecto-Software-2025

Desarrollo de un sistema de gestión para el comedor de una escuela primaria. El proyecto busca optimizar la administración de menús, el control de inventario y el registro de alumnos.

# Backend

# Sistema de Gestión de Comedor Escolar

## 📋 Descripción

Sistema web completo para la gestión integral de un comedor escolar, desarrollado con **Node.js**, **Express** y **MySQL/MariaDB**. Permite administrar inventarios, planificar menús, controlar asistencias y generar reportes detallados del funcionamiento del comedor.

## 🎯 Características Principales

- **Gestión de Usuarios y Roles**: Sistema de autenticación con roles diferenciados (Administrador, Cocinero, Encargado de Inventario, Docente, Supervisor)
- **Control de Inventario**: Seguimiento en tiempo real de insumos, stock mínimo y movimientos
- **Planificación de Menús**: Creación y gestión de recetas con cálculo automático de ingredientes
- **Registro de Asistencias**: Control diario de asistencia por grado y tipo de servicio
- **Gestión de Proveedores**: Administración de proveedores y pedidos de insumos
- **Auditoría Completa**: Registro detallado de todas las operaciones del sistema
- **Reportes y Estadísticas**: Generación de reportes de consumo, inventario y costos

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

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar base de datos con los scripts SQL proporcionados
4. Configurar variables de entorno
5. Iniciar servidor: `npm start` o `pnpm run dev`

## 📁 Estructura del Proyecto

```
├── server/
│   ├── models/          # Modelos de datos
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares de autenticación
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── schemas/         # Validaciones de los datos (nivel de aplicación)
│   └── sql/             # Scripts de base de datos
└── README.md
```

## 👥 Roles del Sistema

- _PARA LA PRUEBA DE BD (en la carga de los datos iniciales se agregan más de un rol, en un futuro se cambiaran para el caso real que sigue abajo ⬇️⬇️⬇️)_

- **Administrador**: Acceso completo al sistema, Gestiona el registro de Alumnos, Docentes, Grados, Insumos, Proveedores, Usuarios, Seguridad, Auditoría.
- **Cocinera**: Gestión de Asistencias, Consumos, Inventarios, Pedidos, Planificación de Menús, Recetas, Reportes.
- **Docente**: Registra Asistencia del Alumno.

## 🔒 Seguridad

- Autenticación JWT
- Encriptación de contraseñas con bcrypt
- Control de acceso basado en roles
- Validación de datos de entrada
- Auditoría de operaciones

## 📈 Estado del Proyecto

Proyecto en desarrollo activo con funcionalidades core implementadas y en proceso de testing.

# Frontend

- No se realizaron avances en lo que respecta a la interfaz del usuario pero estan creada las base de lo que será el frontend con el framework de react.
