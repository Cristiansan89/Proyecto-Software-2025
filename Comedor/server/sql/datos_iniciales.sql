USE Comedor;

-- 1. INSERTAR PERMISOS
INSERT INTO Permisos (id_permiso, nombrePermiso) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'CREAR_USUARIOS'),
(UNHEX(REPLACE(UUID(), '-', '')), 'EDITAR_USUARIOS'),
(UNHEX(REPLACE(UUID(), '-', '')), 'ELIMINAR_USUARIOS'),
(UNHEX(REPLACE(UUID(), '-', '')), 'VER_REPORTES'),
(UNHEX(REPLACE(UUID(), '-', '')), 'GESTIONAR_INVENTARIO');

-- 2. INSERTAR ROLES
INSERT INTO Roles (id_rol, nombreRol, descripcion) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 'Administrador', 'Acceso completo al sistema'),
(UNHEX(REPLACE(UUID(), '-', '')), 'Cocinero', 'Gestión de recetas y consumos'),
(UNHEX(REPLACE(UUID(), '-', '')), 'Encargado_Inventario', 'Gestión de inventario y pedidos'),
(UNHEX(REPLACE(UUID(), '-', '')), 'Docente', 'Consulta de menús y reportes básicos'),
(UNHEX(REPLACE(UUID(), '-', '')), 'Supervisor', 'Supervisión general y reportes');

-- 3. ASIGNAR PERMISOS A ROLES
-- Administrador: Todos los permisos
INSERT INTO Roles_Permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM Roles r, Permisos p
WHERE r.nombreRol = 'Administrador';

-- Cocinero: Ver reportes y gestionar inventario
INSERT INTO Roles_Permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM Roles r, Permisos p
WHERE r.nombreRol = 'Cocinero' AND p.nombrePermiso IN ('VER_REPORTES', 'GESTIONAR_INVENTARIO');

-- Encargado_Inventario: Gestionar inventario y ver reportes
INSERT INTO Roles_Permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM Roles r, Permisos p
WHERE r.nombreRol = 'Encargado_Inventario' AND p.nombrePermiso IN ('GESTIONAR_INVENTARIO', 'VER_REPORTES');

-- Docente: Solo ver reportes
INSERT INTO Roles_Permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM Roles r, Permisos p
WHERE r.nombreRol = 'Docente' AND p.nombrePermiso = 'VER_REPORTES';

-- Supervisor: Ver reportes y editar usuarios
INSERT INTO Roles_Permisos (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM Roles r, Permisos p
WHERE r.nombreRol = 'Supervisor' AND p.nombrePermiso IN ('VER_REPORTES', 'EDITAR_USUARIOS');

-- 4. INSERTAR USUARIOS
INSERT INTO Usuarios (id_usuario, id_rol, nombreUsuario, contrasena, mail, telefono, estado) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), 
 (SELECT id_rol FROM Roles WHERE nombreRol = 'Administrador'), 
 'admin', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'admin@comedor.edu.ar', 
 '1234567890', 
 'Activo'),

(UNHEX(REPLACE(UUID(), '-', '')), 
 (SELECT id_rol FROM Roles WHERE nombreRol = 'Cocinero'), 
 'chef_maria', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'maria.chef@comedor.edu.ar', 
 '1234567891', 
 'Activo'),

(UNHEX(REPLACE(UUID(), '-', '')), 
 (SELECT id_rol FROM Roles WHERE nombreRol = 'Encargado_Inventario'), 
 'inv_carlos', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'carlos.inventario@comedor.edu.ar', 
 '1234567892', 
 'Activo'),

(UNHEX(REPLACE(UUID(), '-', '')), 
 (SELECT id_rol FROM Roles WHERE nombreRol = 'Docente'), 
 'prof_ana', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'ana.profesora@comedor.edu.ar', 
 '1234567893', 
 'Activo'),

(UNHEX(REPLACE(UUID(), '-', '')), 
 (SELECT id_rol FROM Roles WHERE nombreRol = 'Supervisor'), 
 'super_juan', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 'juan.supervisor@comedor.edu.ar', 
 '1234567894', 
 'Activo');

-- 5. INSERTAR GRADOS
INSERT INTO Grados (id_grado, nombreGrado) VALUES
(UNHEX(REPLACE(UUID(), '-', '')), '1° Grado'),
(UNHEX(REPLACE(UUID(), '-', '')), '2° Grado'),
(UNHEX(REPLACE(UUID(), '-', '')), '3° Grado'),
(UNHEX(REPLACE(UUID(), '-', '')), '4° Grado'),
(UNHEX(REPLACE(UUID(), '-', '')), '5° Grado');

-- 6. INSERTAR PARÁMETROS DEL SISTEMA
INSERT INTO Parametros_Sistema (clave, valor, descripcion) VALUES
('VERSION_SISTEMA', '1.0.0', 'Versión actual del sistema'),
('HORAS_SESION', '8', 'Duración de sesión en horas'),
('STOCK_MINIMO_ALERTA', '10', 'Cantidad mínima para alertas de stock'),
('PORCIONES_POR_ALUMNO', '1', 'Porciones estimadas por alumno'),
('EMAIL_NOTIFICACIONES', 'admin@comedor.edu.ar', 'Email para notificaciones del sistema');