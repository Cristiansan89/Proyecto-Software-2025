-- Actualización del esquema de Roles
-- Fecha: 4 de noviembre de 2025
-- Motivo: Aumentar límite de descripción y permitir "Sí" con tilde

USE Comedor;

-- Actualizar la tabla Roles para permitir descripciones más largas
ALTER TABLE Roles 
MODIFY COLUMN descripcionRol VARCHAR(255) NOT NULL;

-- Actualizar el enum para permitir "Sí" con tilde
ALTER TABLE Roles 
MODIFY COLUMN habilitaCuentaUsuario ENUM('Si', 'Sí', 'No') NOT NULL DEFAULT 'No';

-- Verificar los cambios
DESCRIBE Roles;