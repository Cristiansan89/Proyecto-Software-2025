-- Script para actualizar la tabla JornadaPlanificada con todos los días de la semana
-- Ejecutar en la base de datos Comedor

ALTER TABLE JornadaPlanificada 
MODIFY COLUMN diaSemana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') 
NOT NULL DEFAULT 'Lunes';

-- Verificar cambios
DESCRIBE JornadaPlanificada;
