-- Datos de prueba para el sistema de comedor
USE Comedor;

-- Insertar personas de prueba
INSERT INTO Personas (nombreRol, nombre, apellido, dni, fechaNacimiento, genero, fechaAlta, estado) VALUES
('Administrador', 'Admin', 'Sistema', '12345678', '1990-01-01', 'Otros', '2025-01-01', 'Activo'),
('Docente', 'María', 'García', '23456789', '1985-03-15', 'Femenina', '2025-01-01', 'Activo'),
('Cocinera', 'Ana', 'López', '34567890', '1980-07-20', 'Femenina', '2025-01-01', 'Activo');

-- Insertar usuarios de prueba (contraseña: "123456" hasheada con bcrypt)
INSERT INTO Usuarios (id_persona, nombreUsuario, contrasenia, mail, telefono, fechaAlta, estado) VALUES
(1, 'admin', '$2b$10$rOvQqk6WODJyGOZHkdNXXeBThzwMpQEPwEI1N3yNhLQBzPLPhQYC6', 'admin@comedor.com', '123456789', NOW(), 'Activo'),
(2, 'docente', '$2b$10$rOvQqk6WODJyGOZHkdNXXeBThzwMpQEPwEI1N3yNhLQBzPLPhQYC6', 'docente@comedor.com', '987654321', NOW(), 'Activo'),
(3, 'cocinera', '$2b$10$rOvQqk6WODJyGOZHkdNXXeBThzwMpQEPwEI1N3yNhLQBzPLPhQYC6', 'cocinera@comedor.com', '555666777', NOW(), 'Activo');