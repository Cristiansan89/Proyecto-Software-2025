-- -----------------------------------------------------
-- Esquema de Gestión de Comedor - Con UUIDs
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS Comedor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Comedor;

-- -----------------------------------------------------
-- 1. SEGURIDAD Y PERSONAS
-- -----------------------------------------------------

-- Tabla Roles
CREATE TABLE Roles (
  id_rol BINARY(16) NOT NULL,
  nombreRol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (id_rol)
) ENGINE = InnoDB;

-- Tabla Permisos
CREATE TABLE Permisos (
  id_permiso BINARY(16) NOT NULL,
  nombrePermiso VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id_permiso)
) ENGINE = InnoDB;

-- Tabla de Asociación Roles_Permisos
CREATE TABLE Roles_Permisos (
  id_rol BINARY(16) NOT NULL,
  id_permiso BINARY(16) NOT NULL,
  PRIMARY KEY (id_rol, id_permiso),
  FOREIGN KEY (id_rol) REFERENCES Roles (id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_permiso) REFERENCES Permisos (id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Usuarios
CREATE TABLE Usuarios (
  id_usuario BINARY(16) NOT NULL,
  id_rol BINARY(16) NOT NULL,
  nombreUsuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  mail VARCHAR(100) UNIQUE,
  telefono VARCHAR(20) NULL,
  fechaUltimaActividad DATETIME NULL,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (id_usuario),
  FOREIGN KEY (id_rol) REFERENCES Roles (id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Grados
CREATE TABLE Grados (
  id_grado BINARY(16) NOT NULL,
  nombreGrado VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id_grado)
) ENGINE = InnoDB;

-- Tabla Personas (Consolida Docentes y Alumnos)
CREATE TABLE Personas (
  id_persona BINARY(16) NOT NULL,
  id_usuario BINARY(16) NULL UNIQUE,  -- FK a Usuarios (solo para Docentes/Otros)
  id_grado BINARY(16) NOT NULL,
  
  -- Atributo Corregido: tipoPersona (ENUM)
  tipoPersona ENUM('Alumno', 'Docente', 'Otro') NOT NULL, 
  
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  
  PRIMARY KEY (id_persona),
  FOREIGN KEY (id_usuario) REFERENCES Usuarios (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (id_grado) REFERENCES Grados (id_grado) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 2. INVENTARIO Y RECETAS
-- -----------------------------------------------------

-- Tabla Insumos
CREATE TABLE Insumos (
  id_insumo BINARY(16) NOT NULL,
  nombreInsumo VARCHAR(150) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  unidadDeMedida VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_insumo)
) ENGINE = InnoDB;

-- Tabla Inventario (1:1 con Insumos)
CREATE TABLE Inventario (
  id_insumo BINARY(16) NOT NULL,
  cantidadActual DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  nivelMinimoAlerta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  fechaUltimaActualizacion DATETIME NOT NULL,
  PRIMARY KEY (id_insumo),
  FOREIGN KEY (id_insumo) REFERENCES Insumos (id_insumo) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Recetas
CREATE TABLE Recetas (
  id_receta BINARY(16) NOT NULL,
  nombrePlato VARCHAR(150) NOT NULL UNIQUE,
  instrucciones TEXT NULL,
  categoriaComida VARCHAR(50) NULL,
  PRIMARY KEY (id_receta)
) ENGINE = InnoDB;

-- Tabla Items_Receta (Detalle de ingredientes)
CREATE TABLE Items_Receta (
  id_item BINARY(16) NOT NULL,
  id_receta BINARY(16) NOT NULL,
  id_insumo BINARY(16) NOT NULL,
  cantidadPorPorcion DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id_item),
  UNIQUE KEY idx_receta_insumo (id_receta, id_insumo),
  FOREIGN KEY (id_receta) REFERENCES Recetas (id_receta) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_insumo) REFERENCES Insumos (id_insumo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 3. ABASTECIMIENTO
-- -----------------------------------------------------

-- Tabla Proveedores
CREATE TABLE Proveedores (
  id_proveedor BINARY(16) NOT NULL,
  razonSocial VARCHAR(200) NOT NULL UNIQUE,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(20) NULL,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (id_proveedor)
) ENGINE = InnoDB;

-- Tabla Pedidos
CREATE TABLE Pedidos (
  id_pedido BINARY(16) NOT NULL,
  id_proveedor BINARY(16) NOT NULL,
  id_usuario_creador BINARY(16) NOT NULL,
  fechaEmision DATE NOT NULL,
  estado ENUM('Pendiente', 'Enviado', 'Recibido', 'Cancelado') NOT NULL,
  PRIMARY KEY (id_pedido),
  FOREIGN KEY (id_proveedor) REFERENCES Proveedores (id_proveedor) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario_creador) REFERENCES Usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Lineas_Pedido (Detalle del Pedido)
CREATE TABLE Lineas_Pedido (
  id_linea BINARY(16) NOT NULL,
  id_pedido BINARY(16) NOT NULL,
  id_insumo BINARY(16) NOT NULL,
  cantidadSolicitada DECIMAL(10, 2) NOT NULL,
  cantidadRecibida DECIMAL(10, 2) NULL,
  PRIMARY KEY (id_linea),
  UNIQUE KEY idx_pedido_insumo (id_pedido, id_insumo),
  FOREIGN KEY (id_pedido) REFERENCES Pedidos (id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_insumo) REFERENCES Insumos (id_insumo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 4. FLUJO OPERACIONAL (CONSUMO)
-- -----------------------------------------------------

-- Tabla Asistencias
CREATE TABLE Asistencias (
  id_asistencia BINARY(16) NOT NULL,
  id_grado BINARY(16) NOT NULL,
  fecha DATE NOT NULL,
  tipoServicio VARCHAR(50) NOT NULL,
  cantidadPresentes INT NOT NULL,
  PRIMARY KEY (id_asistencia),
  UNIQUE KEY idx_fecha_grado_servicio (fecha, id_grado, tipoServicio),
  FOREIGN KEY (id_grado) REFERENCES Grados (id_grado) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Planificaciones_Menu
CREATE TABLE Planificaciones_Menu (
  id_planificacion BINARY(16) NOT NULL,
  fecha DATE NOT NULL,
  tipoComida VARCHAR(50) NOT NULL,
  cantidadEstimada INT NOT NULL,
  PRIMARY KEY (id_planificacion),
  UNIQUE KEY idx_fecha_comida (fecha, tipoComida)
) ENGINE = InnoDB;

-- Tabla de Asociación Planificacion_Recetas
CREATE TABLE Planificacion_Recetas (
  id_planificacion BINARY(16) NOT NULL,
  id_receta BINARY(16) NOT NULL,
  PRIMARY KEY (id_planificacion, id_receta),
  FOREIGN KEY (id_planificacion) REFERENCES Planificaciones_Menu (id_planificacion) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_receta) REFERENCES Recetas (id_receta) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Consumos (Vincula Asistencia y Planificación)
CREATE TABLE Consumos (
  id_consumo BINARY(16) NOT NULL,
  id_asistencia BINARY(16) NOT NULL UNIQUE,
  id_planificacion BINARY(16) NOT NULL UNIQUE,
  id_usuario_confirmador BINARY(16) NOT NULL,
  fechaConsumo DATE NOT NULL,
  PRIMARY KEY (id_consumo),
  FOREIGN KEY (id_asistencia) REFERENCES Asistencias (id_asistencia) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_planificacion) REFERENCES Planificaciones_Menu (id_planificacion) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario_confirmador) REFERENCES Usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Detalles_Consumo (Insumos utilizados en el Consumo)
CREATE TABLE Detalles_Consumo (
  id_detalle BINARY(16) NOT NULL,
  id_consumo BINARY(16) NOT NULL,
  id_insumo BINARY(16) NOT NULL,
  cantidadUtilizada DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id_detalle),
  UNIQUE KEY idx_consumo_insumo (id_consumo, id_insumo),
  FOREIGN KEY (id_consumo) REFERENCES Consumos (id_consumo) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_insumo) REFERENCES Insumos (id_insumo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 5. CONTROL Y TRAZABILIDAD
-- -----------------------------------------------------

-- Tabla Movimientos_Inventario
CREATE TABLE Movimientos_Inventario (
  id_movimiento BINARY(16) NOT NULL,
  id_insumo BINARY(16) NOT NULL,
  id_usuario BINARY(16) NOT NULL,
  id_consumo BINARY(16) NULL,
  tipoMovimiento ENUM('Ingreso', 'Salida', 'Ajuste', 'Merma') NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  fechaHora DATETIME NOT NULL,
  comentario VARCHAR(255) NULL,
  PRIMARY KEY (id_movimiento),
  FOREIGN KEY (id_insumo) REFERENCES Insumos (id_insumo) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_consumo) REFERENCES Consumos (id_consumo) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Auditoría
CREATE TABLE Auditoria (
  id_registro BINARY(16) NOT NULL,
  id_usuario BINARY(16) NOT NULL,
  fecha DATETIME NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  tipoAccion VARCHAR(50) NOT NULL,
  registroAfectado BINARY(16) NULL, -- Se asume que el ID afectado es también un UUID
  tablaAfectada VARCHAR(50) NOT NULL,
  descripcionCambio TEXT NULL,
  PRIMARY KEY (id_registro),
  FOREIGN KEY (id_usuario) REFERENCES Usuarios (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Tabla Parametros_Sistema
CREATE TABLE Parametros_Sistema (
  clave VARCHAR(50) NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (clave)
) ENGINE = InnoDB;