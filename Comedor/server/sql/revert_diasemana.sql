-- Script para revertir la tabla JornadaPlanificada a solo días de semana (lunes a viernes)
-- Ejecutar en la base de datos Comedor

-- Primero, eliminar cualquier jornada de sábado y domingo que haya sido creada
DELETE FROM JornadaPlanificada WHERE diaSemana IN ('Sabado', 'Domingo');

-- Ahora cambiar el ENUM
ALTER TABLE JornadaPlanificada 
MODIFY COLUMN diaSemana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes') 
NOT NULL DEFAULT 'Lunes';

-- Verificar cambios
DESCRIBE JornadaPlanificada;

-- Verificar cambios
DESCRIBE JornadaPlanificada;
