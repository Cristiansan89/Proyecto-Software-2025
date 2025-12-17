-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS auditorias_logs (
  id_auditoria INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT,
  nombre_usuario VARCHAR(255) NOT NULL,
  email_usuario VARCHAR(255),
  accion VARCHAR(50) NOT NULL COMMENT 'CREAR, ACTUALIZAR, ELIMINAR, CONSULTAR, LOGIN, LOGOUT, CONFIGURAR, DESCARGAR',
  modulo VARCHAR(100) NOT NULL COMMENT 'Nombre del módulo afectado',
  descripcion TEXT,
  detalles JSON,
  ip_origen VARCHAR(50),
  user_agent TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'Activo' COMMENT 'Activo, Inactivo',
  
  -- Índices para búsquedas rápidas
  INDEX idx_fecha_creacion (fecha_creacion),
  INDEX idx_id_usuario (id_usuario),
  INDEX idx_accion (accion),
  INDEX idx_modulo (modulo),
  INDEX idx_estado (estado),
  INDEX idx_email_usuario (email_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la tabla ya existe, agregar columnas faltantes (si es necesario)
-- ALTER TABLE auditorias_logs ADD COLUMN estado VARCHAR(20) DEFAULT 'Activo' IF NOT EXISTS;
