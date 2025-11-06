-- Actualización del esquema de Roles
-- Fecha: 4 de noviembre de 2025


USE Comedor;

-- Actualizar la tabla Roles para permitir descripciones más largas
ALTER TABLE Roles 
MODIFY COLUMN descripcionRol VARCHAR(255) NOT NULL;

-- Actualizar el enum para permitir "Sí" con tilde
ALTER TABLE Roles 
MODIFY COLUMN habilitaCuentaUsuario ENUM('Si', 'No') NOT NULL DEFAULT 'No';

ALTER TABLE Asistencias
MODIFY COLUMN estado ENUM('Ausente', 'Si', 'No') NOT NULL DEFAULT 'No';
