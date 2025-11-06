-- Datos de prueba para el sistema de comedor

-- Insertar roles
INSERT INTO Roles (nombreRol, descripcion, estado) VALUES 
('Administrador', 'Administrador del sistema', 'Activo'),
('Docente', 'Docente de la institución', 'Activo'),
('Alumno', 'Estudiante de la institución', 'Activo'),
('Cocinera', 'Personal de cocina', 'Activo');

-- Insertar personas
INSERT INTO Personas (nombreRol, nombre, apellido, dni, fechaNacimiento, genero, fechaAlta, estado) VALUES 
('Administrador', 'Admin', 'Sistema', '00000000', '1980-01-01', 'Otros', '2025-01-01', 'Activo'),
('Docente', 'María', 'González', '12345678', '1985-05-15', 'Femenina', '2025-01-01', 'Activo'),
('Docente', 'Juan', 'Pérez', '87654321', '1982-03-20', 'Masculino', '2025-01-01', 'Activo'),
('Alumno', 'Ana', 'Martínez', '23456789', '2010-08-10', 'Femenina', '2025-01-01', 'Activo'),
('Alumno', 'Carlos', 'López', '34567890', '2011-12-05', 'Masculino', '2025-01-01', 'Activo'),
('Cocinera', 'Carmen', 'Ruiz', '45678901', '1978-07-25', 'Femenina', '2025-01-01', 'Activo');

-- Insertar usuarios (las contraseñas están hasheadas con bcrypt, todas son "123456")
INSERT INTO Usuarios (id_persona, nombreUsuario, contrasenia, mail, telefono, fechaAlta, estado) VALUES 
(1, 'admin', '$2b$10$MsIYa85K4H7AHuBjP1TlieHvRumdtwTfmMfrXIkkf7Uk5YFFM0gyG', 'admin@comedor.com', '555-0001', NOW(), 'Activo'),
(2, 'maria.gonzalez', '$2b$10$MsIYa85K4H7AHuBjP1TlieHvRumdtwTfmMfrXIkkf7Uk5YFFM0gyG', 'maria@comedor.com', '555-0002', NOW(), 'Activo'),
(3, 'juan.perez', '$2b$10$MsIYa85K4H7AHuBjP1TlieHvRumdtwTfmMfrXIkkf7Uk5YFFM0gyG', 'juan@comedor.com', '555-0003', NOW(), 'Activo'),
(6, 'carmen.ruiz', '$2b$10$MsIYa85K4H7AHuBjP1TlieHvRumdtwTfmMfrXIkkf7Uk5YFFM0gyG', 'carmen@comedor.com', '555-0006', NOW(), 'Activo');

-- Insertar turnos
INSERT INTO Turnos (nombre, horaInicio, horaFin, estado) VALUES 
('Mañana', '08:00:00', '12:00:00', 'Activo'),
('Tarde', '13:00:00', '17:00:00', 'Activo');

-- Insertar grados
INSERT INTO Grados (nombreGrado, id_turno, estado) VALUES 
('1° A', 1, 'Activo'),
('1° B', 2, 'Activo'),
('2° A', 1, 'Activo'),
('2° B', 2, 'Activo'),
('3° A', 1, 'Activo'),
('3° B', 2, 'Activo');

-- Insertar servicios
INSERT INTO Servicios (nombre, descripcion, horaInicio, horaFin, estado) VALUES 
('Desayuno', 'Desayuno escolar', '07:30:00', '08:30:00', 'Activo'),
('Almuerzo', 'Almuerzo escolar', '12:00:00', '13:00:00', 'Activo'),
('Merienda', 'Merienda escolar', '15:30:00', '16:30:00', 'Activo'),
('Cena', 'Cena escolar', '19:00:00', '20:00:00', 'Activo');

-- Asignar docentes a grados
INSERT INTO DocenteGrado (id_persona, nombreGrado, fechaAsignado, cicloLectivo) VALUES 
(2, '1° A', '2025-01-01', '2025-01-01'),
(3, '2° A', '2025-01-01', '2025-01-01');

-- Asignar alumnos a grados  
INSERT INTO AlumnoGrado (id_persona, nombreGrado, cicloLectivo) VALUES 
(4, '1° A', '2025-01-01'),
(5, '2° A', '2025-01-01');