-- Tabla para rastrear alertas de inventario
CREATE TABLE IF NOT EXISTS AlertasInventario (
  id_alerta INT AUTO_INCREMENT PRIMARY KEY,
  id_insumo INT NOT NULL UNIQUE,
  tipo_alerta ENUM('Critico', 'Agotado') NOT NULL DEFAULT 'Critico',
  contador_envios INT NOT NULL DEFAULT 1,
  estado ENUM('activa', 'resuelta', 'completada') NOT NULL DEFAULT 'activa',
  fecha_primera_alerta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_ultima_alerta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_resolucion DATETIME NULL,
  observaciones TEXT NULL,
  
  -- Índices
  INDEX idx_id_insumo (id_insumo),
  INDEX idx_estado (estado),
  INDEX idx_fecha_ultima_alerta (fecha_ultima_alerta),
  
  -- Llave foránea
  CONSTRAINT fk_alerta_insumo FOREIGN KEY (id_insumo) 
    REFERENCES Insumos(id_insumo) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría para registrar envíos de alertas
CREATE TABLE IF NOT EXISTS AuditAlertas (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  id_alerta INT NOT NULL,
  id_insumo INT NOT NULL,
  numero_envio INT NOT NULL,
  canal_envio VARCHAR(50) NOT NULL DEFAULT 'Telegram',
  mensaje_enviado LONGTEXT NULL,
  estado_envio VARCHAR(50) NOT NULL DEFAULT 'enviado',
  fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  respuesta_sistema VARCHAR(255) NULL,
  
  -- Índices
  INDEX idx_id_alerta (id_alerta),
  INDEX idx_id_insumo (id_insumo),
  INDEX idx_fecha_envio (fecha_envio),
  
  -- Llave foránea
  CONSTRAINT fk_auditoria_alerta FOREIGN KEY (id_alerta) 
    REFERENCES AlertasInventario(id_alerta) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista para alertas activas con información completa
CREATE OR REPLACE VIEW v_alertas_activas AS
SELECT 
  aa.id_alerta,
  aa.id_insumo,
  i.nombreInsumo,
  i.categoria,
  i.unidadMedida,
  aa.tipo_alerta,
  aa.contador_envios,
  aa.estado,
  inv.cantidadActual,
  inv.nivelMinimoAlerta,
  inv.estado as estado_stock,
  aa.fecha_primera_alerta,
  aa.fecha_ultima_alerta,
  TIMESTAMPDIFF(MINUTE, aa.fecha_ultima_alerta, NOW()) as minutos_desde_ultima_alerta,
  CASE 
    WHEN aa.contador_envios >= 3 THEN 'completada'
    WHEN aa.contador_envios = 2 THEN 'penultima'
    WHEN aa.contador_envios = 1 THEN 'primera'
  END as estado_envios
FROM AlertasInventario aa
JOIN Insumos i ON aa.id_insumo = i.id_insumo
JOIN Inventarios inv ON aa.id_insumo = inv.id_insumo
WHERE aa.estado = 'activa'
ORDER BY aa.fecha_ultima_alerta DESC;

-- Vista para resumen de alertas
CREATE OR REPLACE VIEW v_resumen_alertas AS
SELECT 
  COUNT(DISTINCT aa.id_insumo) as insumos_con_alerta,
  SUM(CASE WHEN aa.estado = 'activa' THEN 1 ELSE 0 END) as alertas_activas,
  SUM(CASE WHEN aa.contador_envios >= 3 THEN 1 ELSE 0 END) as alertas_maximas,
  SUM(CASE WHEN aa.contador_envios < 3 AND aa.estado = 'activa' THEN 1 ELSE 0 END) as pendientes_envio,
  AVG(CASE WHEN aa.estado = 'activa' THEN aa.contador_envios ELSE NULL END) as promedio_envios,
  COUNT(DISTINCT aa.id_insumo) as total_insumos_criticos
FROM AlertasInventario aa
WHERE aa.estado IN ('activa', 'completada');
