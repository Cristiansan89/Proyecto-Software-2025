-- Verificar la estructura de la tabla RecetaServicio
DESCRIBE RecetaServicio;

-- Mostrar las columnas disponibles
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'RecetaServicio' AND TABLE_SCHEMA = 'Comedor';
