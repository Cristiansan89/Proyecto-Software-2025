-- Crear tabla para rastrear servicios completados
CREATE TABLE IF NOT EXISTS ServiciosCompletados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  id_servicio INT NOT NULL,
  completado BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_servicio_fecha (fecha, id_servicio),
  FOREIGN KEY (id_servicio) REFERENCES Servicios(id_servicio) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para búsquedas por fecha
CREATE INDEX idx_fecha ON ServiciosCompletados(fecha);
