-- Agregar columnas a la tabla AlertasInventario si no existen
ALTER TABLE AlertasInventario ADD COLUMN visto BOOLEAN DEFAULT FALSE;
ALTER TABLE AlertasInventario ADD COLUMN fecha_vista DATETIME NULL;

-- Crear índice para búsquedas rápidas (ignorar si ya existe)
ALTER TABLE AlertasInventario ADD INDEX idx_visto (visto);
