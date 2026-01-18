-- Datos de prueba para el sistema de comedor

-- Insertar roles
INSERT INTO Roles (id_rol, nombreRol, descripcionRol, habilitaCuentaUsuario, estado) VALUES 
(1, 'Administrador', 'Administrador del sistema', 'Si', 'Activo'),
(2, 'Docente', 'Docente de la institución', 'Si', 'Activo'),
(3, 'Alumno', 'Estudiante de la institución', 'No', 'Activo'),
(4, 'Cocinera', 'Personal de cocina', 'Si', 'Activo'),
(5, 'Proveedor', 'Proveedor de insumos', 'Si', 'Activo');

-- =======================
-- Insertar personas
-- =======================

INSERT INTO Personas (nombreRol, nombre, apellido, dni, fechaNacimiento, genero, fechaAlta, estado) VALUES
('Administrador', 'Cristian', 'Sanchez', 34395807, '1989-07-06', 'Masculino', '2025-11-22', 'Activo'),
('Cocinera', 'Ramona', 'Lopez', 29876543, '1978-11-30', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Marta', 'Soprano', 27894563, '1985-05-12', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Antonela', 'Samaniego', 31246789, '1990-09-23', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Maria', 'Garcia', 33456789, '1982-02-17', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Valeria', 'Acosta', 28765432, '1975-08-14', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Mariana', 'Gomez', 30567891, '1988-12-05', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Natalia', 'Rios', 32123456, '1992-03-30', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Florencia', 'Duarte', 29987654, '1987-06-18', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Carolina', 'Medina', 31098765, '1991-10-09', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Paula', 'Cabrera', 28876543, '1983-04-25', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Hernán', 'Castillo', 32345678, '1986-11-11', 'Masculino', '2025-11-22', 'Activo'),
('Docente', 'Diego', 'Pereira', 27654321, '1977-09-09', 'Masculino', '2025-11-22', 'Activo'),
('Docente', 'Marcelo', 'Quiroga', 33567890, '1979-01-29', 'Masculino', '2025-11-22', 'Activo'),
('Docente', 'Catalina', 'Grande', 29765432, '1984-07-07', 'Femenina', '2025-11-22', 'Activo'),
('Docente', 'Gabriela', 'Torres', 31456789, '1993-05-15', 'Femenina', '2025-11-22', 'Activo');


INSERT INTO Usuarios (id_usuario, id_persona, nombreUsuario, contrasenia, mail, telefono, fechaAlta, estado) VALUES
(UUID_TO_BIN('6EA7720DF0F211F084A0C48E8F71E7A1'), 1, 'cristian.sanchez', '$2b$10$CGUCeOfc2WZ.zTHrYVUPHuAjYKXoytzKM5XRMmkahbtFtS1lBpnDG', 'crisanz89@gmail.com', '+543764239133', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7801AF0F211F084A0C48E8F71E7A1'), 2, 'ramona.lopez', '$2b$10$5wtBTimObgWMcPflePv6r.Hoi2wtoQk.Px9gU6BGwI0UbVzajF7NC', 'ramonalopez@mail.com', '+543764000001', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78273F0F211F084A0C48E8F71E7A1'), 3, 'marta.soprano', '$2b$10$ruBz9/gSXVCzmq0cTIvNLOsPhweHrj8xyIWh7mlz7OsxeWywdZ4Da', 'martasoprano@mail.com', '+543764000002', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA784B9F0F211F084A0C48E8F71E7A1'), 4, 'antonela.samaniego', '$2b$10$.JHcq0rBTOXyKsTBDvuQfe2Sb/djCjNHGnVt8RLnydvfiAoiekZ/u', 'antonelasamaniego@mail.com', '+543764000003', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA786E4F0F211F084A0C48E8F71E7A1'), 5, 'maria.garcia', '$2b$10$XNHn1tlb5uTAOfMZoro/VeOmmHKS0EOLDiWIpH7pyNAlA0B4cRd0W', 'mariagarcia@mail.com', '+543764000004', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78906F0F211F084A0C48E8F71E7A1'), 6, 'valeria.acosta', '$2b$10$D/roKVVEOJbGBOjq01JTfu3SVKNNoiTg/MzzA5LSwcNQ9KFYXTEPa', 'valeriaacosta@mail.com', '+543764000005', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78B41F0F211F084A0C48E8F71E7A1'), 7, 'mariana.gomez', '$2b$10$E43QWchQyA80CrItNnXfAO6LOoQhxzbpIrbIWstERpthm9dVscIw2', 'marianagomez@mail.com', '+543764000006', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78D74F0F211F084A0C48E8F71E7A1'), 8, 'natalia.rios', '$2b$10$zcjg18.Q4.dEOpFpumVt5ufw3a2MIIUNSQHpNoCmWcKPyDK3/pQZW', 'natalarios@mail.com', '+543764000007', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA794F2F0F211F084A0C48E8F71E7A1'), 9, 'florencia.duarte', '$2b$10$CXurp8vgSKoyJOFybrXAGujv9l1lXE0hXcu13STzPcO6F/8lFQzTe', 'florenciaduarte@mail.com', '+543764000008', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA797A1F0F211F084A0C48E8F71E7A1'), 10, 'carolina.medina', '$2b$10$f3SLhDtsDPV1Z9sFJbLgNePndp5hMSQIJaTgTlsgOPdApBTN0cvbS', 'carolinamedina@mail.com', '+543764000009', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7995BF0F211F084A0C48E8F71E7A1'), 11, 'paula.cabrera', '$2b$10$icxpAqvbkyWswNytPGrweu/iTrXP9DB4Glu4qgZ/BckHhgbEsMpaG', 'paulacabrera@mail.com', '+543764000010', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA79D6CF0F211F084A0C48E8F71E7A1'), 12, 'hernan.castillo', '$2b$10$/pl4PSKDzeRJ2tRlhdGbGeTR8hJZYJjvcnl1Qy4Oky2P9ss4zAgF.', 'hernancastillo@mail.com', '+543764000011', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A199F0F211F084A0C48E8F71E7A1'), 13, 'marcelo.quiroga', '$2b$10$fTz2QiWy8t0kYWRPTrvonOo6pa2wUP5jJAT..vORu7LgtNGilEiqu', 'marceloquiroga@mail.com', '+543764000012', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A306F0F211F084A0C48E8F71E7A1'), 14, 'diego.pereira', '$2b$10$CkgqW51yM0Q/y8/bEQ2VA.FSDp1RXTU0VtWQeZ0V8SI/esQXkwyV.', 'diegopereira@mail.com', '+543764000013', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A451F0F211F084A0C48E8F71E7A1'), 15, 'catalina.grande', '$2b$10$KoZhJD8UubyDGAXV.6PJieXxnxMlcMR7wOyE/iuatu5hSL5IohQh2', 'catalinagrande@mail.com', '+543764000014', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A598F0F211F084A0C48E8F71E7A1'), 16, 'gabriela.torres', '$2b$10$TXCq4Xh2Ws7ZME/5PQDKteW7ftzS90qdM1eiuvWIrWQ3ed78cpABC', 'gabrielatorres@mail.com', '+543764000015', '2025-11-22', 'Activo');

Insert INTO UsuariosRoles (id_usuario, id_rol, fechaAsignacion, estado) VALUES
(UUID_TO_BIN('6EA7720DF0F211F084A0C48E8F71E7A1'), 1, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7801AF0F211F084A0C48E8F71E7A1'), 4, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78273F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA784B9F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA786E4F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78906F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78B41F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA78D74F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA794F2F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA797A1F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7995BF0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA79D6CF0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A199F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A306F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A451F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6EA7A598F0F211F084A0C48E8F71E7A1'), 2, '2025-11-22', 'Activo');

INSERT INTO Personas (nombreRol, nombre, apellido, dni, fechaNacimiento, genero, fechaAlta, estado) VALUES

-- =======================
--        ALUMNOS
-- =======================

-- =======================
--        1° GRADO A
-- =======================

('Alumno','Valentina','Pérez',60110005,'2019-03-14','Femenina','2025-11-22','Activo'),
('Alumno','Isabella','Torres',60110006,'2019-06-07','Femenina','2025-11-22','Activo'),
('Alumno','Emma','Flores',60110007,'2019-09-28','Femenina','2025-11-22','Activo'),
('Alumno','Santiago','Gutiérrez',60110008,'2019-01-19','Masculino','2025-11-22','Activo'),
('Alumno','Lucas','Silva',60110009,'2019-07-30','Masculino','2025-11-22','Activo'),
('Alumno','Martina','Acosta',60110011,'2019-10-22','Femenina','2025-11-22','Activo'),
('Alumno','Lucía','Benítez',60110012,'2019-04-15','Femenina','2025-11-22','Activo'),
('Alumno','Agustín','Molina',60110013,'2019-09-04','Masculino','2025-11-22','Activo'),
('Alumno','Joaquín','Arias',60110014,'2019-02-26','Masculino','2025-11-22','Activo'),
('Alumno','Elena','Vera',60110015,'2019-06-17','Femenina','2025-11-22','Activo'),
('Alumno','Mía','Suárez',60110016,'2019-01-09','Femenina','2025-11-22','Activo'),
('Alumno','Valeria','Medina',60110017,'2019-03-29','Femenina','2025-11-22','Activo'),
('Alumno','Franco','Ríos',60110018,'2019-05-20','Masculino','2025-11-22','Activo'),
('Alumno','Tomás','Castro',60110019,'2019-07-13','Masculino','2025-11-22','Activo'),
('Alumno','Julieta','Herrera',60110020,'2019-11-03','Femenina','2025-11-22','Activo'),

-- =======================
--        1° GRADO B
-- =======================
('Alumno','Victoria','Morales',60120000,'2018-04-08','Femenina','2025-11-22','Activo'),
('Alumno','Renata','Cruz',60120001,'2018-08-23','Femenina','2025-11-22','Activo'),
('Alumno','Gabriel','Peña',60120002,'2018-01-18','Masculino','2025-11-22','Activo'),
('Alumno','Juan','Navarro',60120003,'2018-03-27','Masculino','2025-11-22','Activo'),
('Alumno','Bautista','Sosa',60120004,'2018-06-06','Masculino','2025-11-22','Activo'),
('Alumno','Lautaro','Cáceres',60120005,'2018-09-12','Masculino','2025-11-22','Activo'),
('Alumno','Ana','Ferreyra',60120006,'2018-11-25','Femenina','2025-11-22','Activo'),
('Alumno','Luana','Méndez',60120007,'2018-02-14','Femenina','2025-11-22','Activo'),
('Alumno','Chloe','Vázquez',60120008,'2018-05-01','Femenina','2025-11-22','Activo'),
('Alumno','Samuel','Bravo',60120009,'2018-07-31','Masculino','2025-11-22','Activo'),
('Alumno','Amelia','Frías',60120010,'2018-09-07','Femenina','2025-11-22','Activo'),
('Alumno','Zoe','Funes',60120011,'2018-10-29','Femenina','2025-11-22','Activo'),
('Alumno','Alexis','Barrios',60120012,'2018-03-22','Masculino','2025-11-22','Activo'),
('Alumno','Gael','Aguirre',60120013,'2018-12-02','Masculino','2025-11-22','Activo'),
('Alumno','Emilia','Quiroga',60120014,'2018-01-11','Femenina','2025-11-22','Activo'),
('Alumno','Iara','Padilla',60120015,'2018-04-27','Femenina','2025-11-22','Activo'),
('Alumno','Ian','Peralta',60120016,'2018-06-19','Masculino','2025-11-22','Activo'),
('Alumno','Kevin','Luna',60120017,'2018-08-04','Masculino','2025-11-22','Activo'),
('Alumno','Noah','Ferreyra',60120018,'2018-09-15','Masculino','2025-11-22','Activo'),
('Alumno','Alma','Montenegro',60120019,'2018-11-06','Femenina','2025-11-22','Activo'),

-- =======================
--   2° GRADO A
-- =======================
('Alumno','David','Benavides',59110000,'2017-05-22','Masculino','2025-11-22','Activo'),
('Alumno','Nicole','Figueroa',59110001,'2017-10-02','Femenina','2025-11-22','Activo'),
('Alumno','Priscila','Domínguez',59110002,'2017-03-29','Femenina','2025-11-22','Activo'),
('Alumno','Axel','Borja',59110003,'2017-12-13','Masculino','2025-11-22','Activo'),
('Alumno','Alessia','Chávez',59110004,'2017-07-09','Femenina','2025-11-22','Activo'),
('Alumno','Malena','Miranda',59110005,'2017-09-19','Femenina','2025-11-22','Activo'),
('Alumno','Ramiro','Godoy',59110006,'2017-08-01','Masculino','2025-11-22','Activo'),
('Alumno','Luis','Villalba',59110007,'2017-01-28','Masculino','2025-11-22','Activo'),
('Alumno','Paula','Carrizo',59110008,'2017-06-12','Femenina','2025-11-22','Activo'),
('Alumno','Julián','Correa',59110009,'2017-02-17','Masculino','2025-11-22','Activo'),
('Alumno','Rocío','García',59110010,'2017-04-04','Femenina','2025-11-22','Activo'),
('Alumno','Daniel','Pacheco',59110011,'2017-08-27','Masculino','2025-11-22','Activo'),
('Alumno','Ámbar','Esquivel',59110012,'2017-10-11','Femenina','2025-11-22','Activo'),
('Alumno','Dylan','Cortés',59110013,'2017-12-29','Masculino','2025-11-22','Activo'),
('Alumno','Ariana','Galeano',59110014,'2017-03-20','Femenina','2025-11-22','Activo'),
('Alumno','Elías','Franco',59110015,'2017-05-14','Masculino','2025-11-22','Activo'),
('Alumno','Nicolás','Salinas',59110016,'2017-07-01','Masculino','2025-11-22','Activo'),
('Alumno','Ciro','Campos',59110017,'2017-09-08','Masculino','2025-11-22','Activo'),
('Alumno','Sara','Benítez',59110018,'2017-11-30','Femenina','2025-11-22','Activo'),
('Alumno','Melina','Ortega',59110019,'2017-06-25','Femenina','2025-11-22','Activo'),

-- =======================
--   2° GRADO B
-- =======================
('Alumno','Gael','Bustos',59120000,'2016-04-11','Masculino','2025-11-22','Activo'),
('Alumno','Zaira','Vega',59120001,'2016-07-21','Femenina','2025-11-22','Activo'),
('Alumno','Lionel','Palacios',59120002,'2016-10-17','Masculino','2025-11-22','Activo'),
('Alumno','Abril','Ordoñez',59120003,'2016-08-09','Femenina','2025-11-22','Activo'),
('Alumno','Ignacio','Arce',59120004,'2016-03-31','Masculino','2025-11-22','Activo'),
('Alumno','Umma','Roldán',59120005,'2016-12-03','Femenina','2025-11-22','Activo'),
('Alumno','Alan','Benavídez',59120006,'2016-09-01','Masculino','2025-11-22','Activo'),
('Alumno','Ramona','Gallo',59120007,'2016-11-14','Femenina','2025-11-22','Activo'),
('Alumno','Luciano','Carranza',59120008,'2016-06-20','Masculino','2025-11-22','Activo'),
('Alumno','Clara','Toledo',59120009,'2016-02-28','Femenina','2025-11-22','Activo'),
('Alumno','Simón','Iglesias',59120010,'2016-05-19','Masculino','2025-11-22','Activo'),
('Alumno','Carolina','Maidana',59120011,'2016-10-30','Femenina','2025-11-22','Activo'),
('Alumno','Ariel','Balbuena',59120012,'2016-01-22','Masculino','2025-11-22','Activo'),
('Alumno','Mora','León',59120013,'2016-03-12','Femenina','2025-11-22','Activo'),
('Alumno','Santino','Ojeda',59120014,'2016-07-04','Masculino','2025-11-22','Activo'),
('Alumno','Ornella','Garrido',59120015,'2016-09-16','Femenina','2025-11-22','Activo'),
('Alumno','Héctor','Bermúdez',59120016,'2016-11-28','Masculino','2025-11-22','Activo'),
('Alumno','Martín','Serrano',59120017,'2016-02-06','Masculino','2025-11-22','Activo'),
('Alumno','Tamara','Becerra',59120018,'2016-06-11','Femenina','2025-11-22','Activo'),
('Alumno','Alexia','Recalde',59120019,'2016-08-23','Femenina','2025-11-22','Activo'),

-- =======================
--   3° GRADO A
-- =======================
('Alumno','Gonzalo','Sánchez',58110000,'2015-06-18','Masculino','2025-11-22','Activo'),
('Alumno','Tiziana','Fleitas',58110001,'2015-08-02','Femenina','2025-11-22','Activo'),
('Alumno','Pedro','Núñez',58110002,'2015-03-22','Masculino','2025-11-22','Activo'),
('Alumno','Delfina','Acosta',58110003,'2015-05-12','Femenina','2025-11-22','Activo'),
('Alumno','Ian','Espinosa',58110004,'2015-12-20','Masculino','2025-11-22','Activo'),
('Alumno','Lola','Caballero',58110005,'2015-01-08','Femenina','2025-11-22','Activo'),
('Alumno','Fabricio','Montiel',58110006,'2015-09-27','Masculino','2025-11-22','Activo'),
('Alumno','Selena','Gaitán',58110007,'2015-07-15','Femenina','2025-11-22','Activo'),
('Alumno','Facundo','Santana',58110008,'2015-04-09','Masculino','2025-11-22','Activo'),
('Alumno','Juana','Ledesma',58110009,'2015-11-03','Femenina','2025-11-22','Activo'),
('Alumno','Erik','Arismendi',58110010,'2015-02-19','Masculino','2025-11-22','Activo'),
('Alumno','Milagros','Leguizamón',58110011,'2015-06-04','Femenina','2025-11-22','Activo'),
('Alumno','Camilo','Gaona',58110012,'2015-10-28','Masculino','2025-11-22','Activo'),
('Alumno','Jazmín','Salvatierra',58110013,'2015-01-30','Femenina','2025-11-22','Activo'),
('Alumno','Kevin','Montoya',58110014,'2015-03-17','Masculino','2025-11-22','Activo'),
('Alumno','Aitana','Báez',58110015,'2015-08-11','Femenina','2025-11-22','Activo'),
('Alumno','Nahuel','Fiorentino',58110016,'2015-09-03','Masculino','2025-11-22','Activo'),
('Alumno','Cecilia','Agüero',58110017,'2015-12-21','Femenina','2025-11-22','Activo'),
('Alumno','Francesco','Godoy',58110018,'2015-05-05','Masculino','2025-11-22','Activo'),
('Alumno','Aldana','Sierra',58110019,'2015-07-26','Femenina','2025-11-22','Activo'),

-- =======================
--        3° GRADO B
-- =======================

('Alumno','Leandro','Figueroa',58120000,'2017-02-11','Masculino','2025-11-22','Activo'),
('Alumno','Julieta','Vera',58120001,'2017-07-05','Femenina','2025-11-22','Activo'),
('Alumno','Tomás','Riquelme',58120002,'2017-04-22','Masculino','2025-11-22','Activo'),
('Alumno','Aylén','Coronel',58120003,'2017-11-18','Femenina','2025-11-22','Activo'),
('Alumno','Bruno','Sandoval',58120004,'2017-03-09','Masculino','2025-11-22','Activo'),
('Alumno','Morena','Curbelo',58120005,'2017-06-28','Femenina','2025-11-22','Activo'),
('Alumno','Lucas','Garrido',58120006,'2017-09-14','Masculino','2025-11-22','Activo'),
('Alumno','Alina','Maidana',58120007,'2017-12-03','Femenina','2025-11-22','Activo'),
('Alumno','Ian','Pizarro',58120008,'2017-05-17','Masculino','2025-11-22','Activo'),
('Alumno','Sabrina','Montiel',58120009,'2017-08-21','Femenina','2025-11-22','Activo'),
('Alumno','Bautista','Arévalo',58120010,'2017-01-26','Masculino','2025-11-22','Activo'),
('Alumno','Renata','Sosa',58120011,'2017-10-07','Femenina','2025-11-22','Activo'),
('Alumno','Cristian','Barrios',58120012,'2017-02-19','Masculino','2025-11-22','Activo'),
('Alumno','Emilia','Lagos',58120013,'2017-03-30','Femenina','2025-11-22','Activo'),


-- =======================
--        4° GRADO A
-- =======================

('Alumno','Matías','Alderete',57110000,'2014-10-09','Masculino','2025-11-22','Activo'),
('Alumno','Lara','Barrios',57110001,'2014-08-25','Femenina','2025-11-22','Activo'),
('Alumno','Ulises','Curbelo',57110002,'2014-12-12','Masculino','2025-11-22','Activo'),
('Alumno','Rita','Fariña',57110003,'2014-07-05','Femenina','2025-11-22','Activo'),
('Alumno','Emanuel','Alegre',57110004,'2014-02-16','Masculino','2025-11-22','Activo'),
('Alumno','Esteban','Valdez',57110005,'2014-04-28','Masculino','2025-11-22','Activo'),
('Alumno','Pilar','Zavala',57110006,'2014-11-01','Femenina','2025-11-22','Activo'),
('Alumno','Rafael','Villagra',57110007,'2014-01-07','Masculino','2025-11-22','Activo'),
('Alumno','Ambar','Moreno',57110008,'2014-09-14','Femenina','2025-11-22','Activo'),
('Alumno','Bruno','Campos',57110009,'2014-06-03','Masculino','2025-11-22','Activo'),
('Alumno','Catalina','Ferraresi',57110010,'2014-03-22','Femenina','2025-11-22','Activo'),
('Alumno','Mario','Rolón',57110011,'2014-05-11','Masculino','2025-11-22','Activo'),
('Alumno','Julia','Ocampo',57110012,'2014-08-01','Femenina','2025-11-22','Activo'),
('Alumno','Emiliano','Sarmiento',57110013,'2014-12-24','Masculino','2025-11-22','Activo'),
('Alumno','Luan','Ferreira',57110014,'2014-10-16','Masculino','2025-11-22','Activo'),
('Alumno','Andrea','Ayala',57110015,'2014-07-29','Femenina','2025-11-22','Activo'),
('Alumno','Cristian','Salomón',57110016,'2014-03-04','Masculino','2025-11-22','Activo'),
('Alumno','Juliana','Bramajo',57110017,'2014-05-31','Femenina','2025-11-22','Activo'),
('Alumno','Salvador','Soria',57110018,'2014-09-18','Masculino','2025-11-22','Activo'),
('Alumno','Amira','Merlo',57110019,'2014-11-08','Femenina','2025-11-22','Activo'),

-- =======================
--        4° GRADO B 
-- =======================

('Alumno','Thiago','Serrano',57120000,'2016-02-14','Masculino','2025-11-22','Activo'),
('Alumno','Valentina','Molina',57120001,'2016-07-03','Femenina','2025-11-22','Activo'),
('Alumno','Lautaro','Peralta',57120002,'2016-11-22','Masculino','2025-11-22','Activo'),
('Alumno','Camila','Vargas',57120003,'2016-03-09','Femenina','2025-11-22','Activo'),
('Alumno','Julián','Lozano',57120004,'2016-05-18','Masculino','2025-11-22','Activo'),
('Alumno','Martina','Correa',57120005,'2016-01-27','Femenina','2025-11-22','Activo'),
('Alumno','Benjamín','Silva',57120006,'2016-04-30','Masculino','2025-11-22','Activo'),
('Alumno','Mia','Fernández',57120007,'2016-08-19','Femenina','2025-11-22','Activo'),
('Alumno','Facundo','Rivas',57120008,'2016-06-07','Masculino','2025-11-22','Activo'),
('Alumno','Juana','Godoy',57120009,'2016-09-25','Femenina','2025-11-22','Activo'),
('Alumno','Ezequiel','Cáceres',57120010,'2016-12-02','Masculino','2025-11-22','Activo'),
('Alumno','Antonella','Benítez',57120011,'2016-10-11','Femenina','2025-11-22','Activo'),
('Alumno','Franco','Morales',57120012,'2016-01-05','Masculino','2025-11-22','Activo'),

-- =======================
--        5° GRADO A
-- =======================

('Alumno','Agustín','Pereda',56110000,'2015-01-15','Masculino','2025-11-22','Activo'),
('Alumno','Milena','Salvatierra',56110001,'2015-07-03','Femenina','2025-11-22','Activo'),
('Alumno','Joaquín','Rentería',56110002,'2015-04-19','Masculino','2025-11-22','Activo'),
('Alumno','Zoe','Barboza',56110003,'2015-11-27','Femenina','2025-11-22','Activo'),
('Alumno','Ramiro','Casas',56110004,'2015-02-06','Masculino','2025-11-22','Activo'),
('Alumno','Ariana','Páez',56110005,'2015-08-14','Femenina','2025-11-22','Activo'),
('Alumno','Thiago','Balmaceda',56110006,'2015-03-11','Masculino','2025-11-22','Activo'),
('Alumno','Catalina','Fiorio',56110007,'2015-06-29','Femenina','2025-11-22','Activo'),
('Alumno','Dylan','Escalante',56110008,'2015-10-17','Masculino','2025-11-22','Activo'),
('Alumno','Lara','Gaitán',56110009,'2015-05-08','Femenina','2025-11-22','Activo'),
('Alumno','Bruno','Montenegro',56110010,'2015-09-21','Masculino','2025-11-22','Activo'),
('Alumno','Isabella','Torales',56110011,'2015-12-02','Femenina','2025-11-22','Activo'),
('Alumno','Emanuel','Alcaraz',56110012,'2015-03-23','Masculino','2025-11-22','Activo'),

-- =======================
--        5° GRADO B
-- =======================

('Alumno','Ian','Olmedo',56120000,'2015-03-12','Masculino','2025-11-22','Activo'),
('Alumno','Abril','Miranda',56120001,'2015-07-25','Femenina','2025-11-22','Activo'),
('Alumno','Santino','Valdez',56120002,'2015-05-08','Masculino','2025-11-22','Activo'),
('Alumno','Lucía','Roldán',56120003,'2015-11-14','Femenina','2025-11-22','Activo'),
('Alumno','Ramiro','Torres',56120004,'2015-02-28','Masculino','2025-11-22','Activo'),
('Alumno','Ariana','Campos',56120005,'2015-06-04','Femenina','2025-11-22','Activo'),
('Alumno','Dylan','Ojeda',56120006,'2015-01-19','Masculino','2025-11-22','Activo'),
('Alumno','Isabella','Cardozo',56120007,'2015-09-03','Femenina','2025-11-22','Activo'),
('Alumno','Gabriel','Ferreyra',56120008,'2015-04-21','Masculino','2025-11-22','Activo'),
('Alumno','Mora','Acuña',56120009,'2015-12-29','Femenina','2025-11-22','Activo'),
('Alumno','Emanuel','Herrera',56120010,'2015-10-17','Masculino','2025-11-22','Activo'),
('Alumno','Zoe','Romero',56120011,'2015-08-06','Femenina','2025-11-22','Activo'),


-- =======================
--        6° GRADO A 
-- =======================

('Alumno','Nicolás','Amaya',55110000,'2014-02-28','Masculino','2025-11-22','Activo'),
('Alumno','Mora','Ledesma',55110001,'2014-09-04','Femenina','2025-11-22','Activo'),
('Alumno','Tiziano','Correa',55110002,'2014-04-12','Masculino','2025-11-22','Activo'),
('Alumno','Alma','Roldán',55110003,'2014-07-27','Femenina','2025-11-22','Activo'),
('Alumno','Kevin','Molina',55110004,'2014-11-09','Masculino','2025-11-22','Activo'),
('Alumno','Atenea','Guerra',55110005,'2014-03-25','Femenina','2025-11-22','Activo'),
('Alumno','Axel','Lucero',55110006,'2014-12-15','Masculino','2025-11-22','Activo'),
('Alumno','Renata','Cáceres',55110007,'2014-05-06','Femenina','2025-11-22','Activo'),
('Alumno','Gael','Sarmiento',55110008,'2014-08-30','Masculino','2025-11-22','Activo'),
('Alumno','Elena','Ponce',55110009,'2014-01-19','Femenina','2025-11-22','Activo'),
('Alumno','Dante','Funes',55110010,'2014-10-23','Masculino','2025-11-22','Activo'),
('Alumno','Luciana','Bustos',55110011,'2014-06-11','Femenina','2025-11-22','Activo'),

-- =======================
--        6° GRADO B
-- =======================

('Alumno','Nicolás','Mansilla',55120000,'2014-01-14','Masculino','2025-11-22','Activo'),
('Alumno','Mora','Soto',55120001,'2014-06-01','Femenina','2025-11-22','Activo'),
('Alumno','Tobías','Lagos',55120002,'2014-08-23','Masculino','2025-11-22','Activo'),
('Alumno','Alma','Rivero',55120003,'2014-03-19','Femenina','2025-11-22','Activo'),
('Alumno','Kevin','Gómez',55120004,'2014-12-04','Masculino','2025-11-22','Activo'),
('Alumno','Atenea','Escobar',55120005,'2014-04-15','Femenina','2025-11-22','Activo'),
('Alumno','Joaquín','Vega',55120006,'2014-11-09','Masculino','2025-11-22','Activo'),
('Alumno','Emma','Pizarro',55120007,'2014-05-28','Femenina','2025-11-22','Activo'),
('Alumno','Bruno','Quiroga',55120008,'2014-07-16','Masculino','2025-11-22','Activo'),
('Alumno','Renata','Palacios',55120009,'2014-10-27','Femenina','2025-11-22','Activo'),
('Alumno','Axel','Mendoza',55120010,'2014-02-05','Masculino','2025-11-22','Activo'),
('Alumno','Milena','Arias',55120011,'2014-09-11','Femenina','2025-11-22','Activo'),
('Alumno','Gael','Reynoso',55120012,'2014-03-07','Masculino','2025-11-22','Activo'),
('Alumno','Elena','Benavídez',55120013,'2014-06-25','Femenina','2025-11-22','Activo'),
('Alumno','Dante','Aguilar',55120014,'2014-12-20','Masculino','2025-11-22','Activo'),

-- =======================
--        7° GRADO A
-- =======================

('Alumno','Jeremías','Bravo',54110000,'2013-04-12','Masculino','2025-11-22','Activo'),
('Alumno','Elisa','Montoya',54110001,'2013-10-02','Femenina','2025-11-22','Activo'),
('Alumno','Agustín','Funes',54110002,'2013-05-24','Masculino','2025-11-22','Activo'),
('Alumno','Micaela','Miranda',54110003,'2013-12-19','Femenina','2025-11-22','Activo'),
('Alumno','Rafael','Herrera',54110004,'2013-03-09','Masculino','2025-11-22','Activo'),
('Alumno','Aldana','Páez',54110005,'2013-07-28','Femenina','2025-11-22','Activo'),
('Alumno','Tomás','Ojeda',54110006,'2013-02-17','Masculino','2025-11-22','Activo'),
('Alumno','Maite','Silvero',54110007,'2013-08-14','Femenina','2025-11-22','Activo'),
('Alumno','Alexis','González',54110008,'2013-01-29','Masculino','2025-11-22','Activo'),
('Alumno','Lara','Segovia',54110009,'2013-11-05','Femenina','2025-11-22','Activo'),
('Alumno','Rodrigo','Soria',54110010,'2013-06-23','Masculino','2025-11-22','Activo'),
('Alumno','Ana','Cardona',54110011,'2013-09-30','Femenina','2025-11-22','Activo'),
('Alumno','Franco','Bustamante',54110012,'2013-04-02','Masculino','2025-11-22','Activo'),
('Alumno','Isidora','Lemos',54110013,'2013-10-16','Femenina','2025-11-22','Activo'),


-- =======================
--   7° GRADO B
-- =======================
('Alumno','Ariadna','Coronel',54120020,'2013-02-13','Femenina','2025-11-22','Activo'),
('Alumno','Ulises','Franco',54120019,'2013-05-30','Masculino','2025-11-22','Activo'),
('Alumno','Agostina','Rodas',54120018,'2013-11-22','Femenina','2025-11-22','Activo'),
('Alumno','Julián','Sanabria',54120017,'2013-08-01','Masculino','2025-11-22','Activo'),
('Alumno','Dayana','Ramírez',54120016,'2013-06-03','Femenina','2025-11-22','Activo'),
('Alumno','Nicolás','Fidalgo',54120015,'2013-10-14','Masculino','2025-11-22','Activo'),
('Alumno','Tamara','Segovia',54120014,'2013-01-26','Femenina','2025-11-22','Activo'),
('Alumno','Sergio','Sena',54120013,'2013-04-19','Masculino','2025-11-22','Activo'),
('Alumno','Florencia','Cuestas',54120012,'2013-12-09','Femenina','2025-11-22','Activo'),
('Alumno','Hernán','Lescano',54120011,'2013-03-25','Masculino','2025-11-22','Activo'),
('Alumno','Melany','Jerez',54120010,'2013-07-08','Femenina','2025-11-22','Activo'),
('Alumno','Mauricio','Fornier',54120009,'2013-09-04','Masculino','2025-11-22','Activo'),
('Alumno','Jacinta','Benavides',54120008,'2013-11-29','Femenina','2025-11-22','Activo'),
('Alumno','Álvaro','Bonnin',54120007,'2013-06-12','Masculino','2025-11-22','Activo'),
('Alumno','Regina','Ribera',54120006,'2013-02-18','Femenina','2025-11-22','Activo'),
('Alumno','Ezequiel','Quiñónez',54120005,'2013-04-01','Masculino','2025-11-22','Activo'),
('Alumno','Silvia','Cáceres',54120004,'2013-10-30','Femenina','2025-11-22','Activo'),
('Alumno','Iván','Maldonado',54120003,'2013-01-15','Masculino','2025-11-22','Activo'),
('Alumno','Diana','Correa',54120002,'2013-03-09','Femenina','2025-11-22','Activo'),
('Alumno','Benicio','Bustamante',54120001,'2013-08-26','Masculino','2025-11-22','Activo');

-- Insertar turnos
INSERT INTO Turnos (nombre, horaInicio, horaFin, estado) VALUES 
('Mañana', '08:00:00', '14:30:00', 'Activo'),
('Tarde', '13:00:00', '17:00:00', 'Activo');

-- Insertar grados
INSERT INTO Grados (id_grado, nombreGrado, id_turno, estado) VALUES 
(1, '1° GRADO A', 2, 'Activo'),
(2, '1° GRADO B', 2, 'Activo'),
(3, '2° GRADO A', 2, 'Activo'),
(4, '2° GRADO B', 2, 'Activo'),
(5, '3° GRADO A', 2, 'Activo'),
(6, '3° GRADO B', 2, 'Activo'),
(7, '4° GRADO A', 1, 'Activo'),
(8, '4° GRADO B', 1, 'Activo'),
(9, '5° GRADO A', 1, 'Activo'),
(10, '5° GRADO B', 1, 'Activo'),
(11, '6° GRADO A', 1, 'Activo'),
(12, '6° GRADO B', 1, 'Activo'),
(13, '7° GRADO A', 1, 'Activo'),
(14, '7° GRADO B', 1, 'Activo');


-- Insertar servicios
INSERT INTO Servicios (nombre, descripcion, fechaAlta, estado) VALUES 
('Desayuno', 'Desayuno escolar', '2025-11-22', 'Activo'),
('Almuerzo', 'Almuerzo escolar', '2025-11-22', 'Activo'),
('Merienda', 'Merienda escolar', '2025-11-22', 'Activo');

-- Insertar Insumos y Inventarios


-- ==============================
--       Carnes y Proteínas
-- ==============================

INSERT INTO Insumos 
(id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(1, 'Carne pulpa fresca', 'Carne vacuna pulpa sin grasa', 'Kilogramos', 'Carnes', 10.00, '2025-11-01', 'Activo'),
(2, 'Carne con hueso', 'Carne vacuna con hueso para guiso', 'Kilogramos', 'Carnes', 8.00, '2025-11-01', 'Activo'),
(3, 'Carne sin hueso', 'Carne vacuna magra sin hueso', 'Kilogramos', 'Carnes', 8.00, '2025-11-01', 'Activo'),
(4, 'Pechuga de pollo', 'Pechuga fresca sin piel', 'Kilogramos', 'Carnes', 6.00, '2025-11-01', 'Activo'),
(5, 'Muslo de pollo', 'Muslo fresco con piel', 'Kilogramos', 'Carnes', 5.00, '2025-11-01', 'Activo'),
(6, 'Carne picada', 'Picada común', 'Kilogramos', 'Carnes', 6.00, '2025-11-01', 'Activo'),
(7, 'Pata muslo de pollo', 'Pata muslo fresco', 'Kilogramos', 'Carnes', 8.00, '2025-11-01', 'Activo'),
(8, 'Costilla de cerdo', 'Tira de costilla para horno', 'Kilogramos', 'Carnes', 5.00, '2025-11-01', 'Activo'),
(9, 'Jamón cocido', 'Jamón cocido feteado', 'Gramos', 'Carnes', 500.00, '2025-11-01', 'Activo'),
(10, 'Salchichas vienesas', 'Paquete de salchichas tipo viena 300 g', 'Gramos', 'Carnes', 300.00, '2025-11-01', 'Activo'),
(11, 'Huevos', 'Huevos frescos de gallina', 'Unidades', 'Carnes', 60.00, '2025-11-01', 'Activo'),
(12, 'Albóndigas congeladas', 'Albóndigas de carne vacuna 500 g', 'Gramos', 'Carnes', 500.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios
(id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(1, 30, 10.00, 50, 'Normal'),
(2, 24, 8.00, 40, 'Normal'),
(3, 24, 8.00, 40, 'Normal'),
(4, 18, 6.00, 30, 'Normal'),
(5, 15, 5.00, 25, 'Normal'),
(6, 23, 6.00, 40, 'Normal'),
(7, 19, 8.00, 30, 'Normal'),
(8, 15, 5.00, 25, 'Normal'),
(9, 1250, 500.00, 2000, 'Normal'),
(10, 550, 300.00, 800, 'Normal'),
(11, 180, 60.00, 300, 'Normal'),
(12, 850, 500.00, 1200, 'Normal');


-- ==============================
--            Lacteos
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(13,'Leche entera','Leche fluida entera','Litros','Lacteos',10.00,'2025-11-01','Activo'),
(14,'Leche descremada','Leche fluida descremada','Litros','Lacteos',10.00,'2025-11-01','Activo'),
(15,'Leche larga vida','Leche UHT entera','Litros','Lacteos',8.00,'2025-11-01','Activo'),
(16,'Leche chocolatada','Bebida láctea sabor chocolate','Litros','Lacteos',6.00,'2025-11-01','Activo'),
(17,'Queso cremoso','Queso fresco tipo cremoso','Kilogramos','Lacteos',5.00,'2025-11-01','Activo'),
(18,'Queso rallado','Queso rallado en paquete','Gramos','Lacteos',2.00,'2025-11-01','Activo'),
(19,'Queso barra','Queso tipo barra','Kilogramos','Lacteos',4.00,'2025-11-01','Activo'),
(20,'Queso muzzarella','Queso muzzarella para cocina','Kilogramos','Lacteos',5.00,'2025-11-01','Activo'),
(21,'Yogur firme vainilla','Yogur firme sabor vainilla','Gramos','Lacteos',3.00,'2025-11-01','Activo'),
(22,'Yogur firme frutilla','Yogur firme sabor frutilla','Gramos','Lacteos',3.00,'2025-11-01','Activo'),
(23,'Yogur bebible','Yogur líquido varias frutas','Mililitros','Lacteos',5.00,'2025-11-01','Activo'),
(24,'Yogur natural','Yogur natural sin sabor','Gramos','Lacteos',3.00,'2025-11-01','Activo'),
(25,'Manteca','Manteca en paquete','Gramos','Lacteos',2.00,'2025-11-01','Activo'),
(26,'Crema de leche','Crema de leche común','Mililitros','Lacteos',3.00,'2025-11-01','Activo'),
(27,'Leche en polvo entera','Leche en polvo','Gramos','Lacteos',2.00,'2025-11-01','Activo'),
(28,'Leche en polvo descremada','Leche en polvo baja grasa','Gramos','Lacteos',2.00,'2025-11-01','Activo'),
(29,'Postre de vainilla','Postre instantáneo de vainilla','Gramos','Lacteos',3.00,'2025-11-01','Activo'),
(30,'Postre de chocolate','Postre instantáneo de chocolate','Gramos','Lacteos',3.00,'2025-11-01','Activo'),
(31,'Flan en polvo','Flan instantáneo sabor vainilla','Gramos','Lacteos',5.00,'2025-11-01','Activo'),
(32,'Ricota','Ricota fresca para cocina','Gramos','Lacteos',4.00,'2025-11-01','Activo'),
(33,'Queso untable','Queso cremoso para untar','Gramos','Lacteos',2.00,'2025-11-01','Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(13, 30, 10, 50, 'Normal'),
(14, 30, 10, 50, 'Normal'),
(15, 24, 8, 40, 'Normal'),
(16, 18, 6, 30, 'Normal'),
(17, 12, 5, 20, 'Normal'),
(18, 11, 2, 20, 'Normal'),
(19, 14, 4, 25, 'Normal'),
(20, 15, 5, 25, 'Normal'),
(21, 21, 3, 40, 'Normal'),
(22, 21, 3, 40, 'Normal'),
(23, 17, 5, 30, 'Normal'),
(24, 16, 3, 30, 'Normal'),
(25, 11, 2, 20, 'Normal'),
(26, 16, 3, 30, 'Normal'),
(27, 11, 2, 20, 'Normal'),
(28, 11, 2, 20, 'Normal'),
(29, 16, 3, 30, 'Normal'),
(30, 16, 3, 30, 'Normal'),
(31, 17, 5, 30, 'Normal'),
(32, 22, 4, 40, 'Normal'),
(33, 11, 2, 20, 'Normal');


-- ==============================
--            Cereales
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(34,'Harina de trigo común','Harina de trigo 000','Kilogramos','Cereales',10.00,'2025-11-01','Activo'),
(35,'Harina de trigo leudante','Harina leudante para repostería','Kilogramos','Cereales',8.00,'2025-11-01','Activo'),
(36,'Harina integral','Harina de trigo integral','Kilogramos','Cereales',6.00,'2025-11-01','Activo'),
(37,'Avena instantánea','Avena rápida','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(38,'Polenta','Sémola de maíz para polenta','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(39,'Maicena','Almidón de maíz','Gramos','Cereales',3.00,'2025-11-01','Activo'),
(40,'Arroz largo fino','Arroz tipo largo fino','Kilogramos','Cereales',10.00,'2025-11-01','Activo'),
(41,'Arroz parboil','Arroz precocido parboil','Kilogramos','Cereales',8.00,'2025-11-01','Activo'),
(42,'Arroz integral','Arroz integral orgánico','Kilogramos','Cereales',6.00,'2025-11-01','Activo'),
(43,'Fideos guiseros','Fideos tipo codito para guisos','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(44,'Fideos mostachol','Fideos mostachol secos','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(45,'Fideos tirabuzón','Fideos tirabuzón secos','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(46,'Fideos spaghetti','Pasta larga tipo spaghetti','Gramos','Cereales',5.00,'2025-11-01','Activo'),
(47,'Galletitas de agua','Galletitas saladas','Gramos','Cereales',3.00,'2025-11-01','Activo'),
(48,'Galletitas dulces','Galletitas dulces surtidas','Gramos','Cereales',3.00,'2025-11-01','Activo'),
(49,'Copos de maíz','Cereales tipo corn flakes','Gramos','Cereales',4.00,'2025-11-01','Activo'),
(50,'Harina de maíz amarilla','Harina de maíz fina','Gramos','Cereales',3.00,'2025-11-01','Activo'),
(51,'Pan rallado','Harina de pan seco rallado','Gramos','Cereales',3.00,'2025-11-01','Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(34, 35, 10, 60, 'Normal'),
(35, 29, 8, 50, 'Normal'),
(36, 23, 6, 40, 'Normal'),
(37, 17, 5, 30, 'Normal'),
(38, 17, 5, 30, 'Normal'),
(39, 16, 3, 30, 'Normal'),
(40, 45, 10, 80, 'Normal'),
(41, 34, 8, 60, 'Normal'),
(42, 28, 6, 50, 'Normal'),
(43, 22, 5, 40, 'Normal'),
(44, 22, 5, 40, 'Normal'),
(45, 22, 5, 40, 'Normal'),
(46, 22, 5, 40, 'Normal'),
(47, 14, 3, 25, 'Normal'),
(48, 14, 3, 25, 'Normal'),
(49, 17, 4, 30, 'Normal'),
(50, 11, 3, 20, 'Normal'),
(51, 11, 3, 20, 'Normal');


-- ==============================
--            Verduras
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(52,'Papa','Papa blanca común','Kilogramos','Verduras',10.00,'2025-11-01','Activo'),
(53,'Batata','Batata anaranjada','Kilogramos','Verduras',8.00,'2025-11-01','Activo'),
(54,'Zanahoria','Zanahoria fresca','Kilogramos','Verduras',6.00,'2025-11-01','Activo'),
(55,'Cebolla','Cebolla amarilla','Kilogramos','Verduras',5.00,'2025-11-01','Activo'),
(56,'Cebolla de verdeo','Verdeo fresco','Unidades','Verduras',15.00,'2025-11-01','Activo'),
(57,'Morrón rojo','Pimiento rojo','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(58,'Morrón verde','Pimiento verde','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(59,'Morrón amarillo','Pimiento amarillo','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(60,'Tomate redondo','Tomate fresco','Kilogramos','Verduras',6.00,'2025-11-01','Activo'),
(61,'Lechuga criolla','Lechuga fresca','Unidades','Verduras',8.00,'2025-11-01','Activo'),
(62,'Acelga','Manojo de acelga','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(63,'Espinaca','Manojo de espinaca','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(64,'Puerro','Puerro fresco','Unidades','Verduras',10.00,'2025-11-01','Activo'),
(65,'Repollo blanco','Repollo fresco','Unidades','Verduras',4.00,'2025-11-01','Activo'),
(66,'Zapallo anco','Zapallo tipo anco','Kilogramos','Verduras',6.00,'2025-11-01','Activo'),
(67,'Calabacín','Zucchini verde','Kilogramos','Verduras',5.00,'2025-11-01','Activo'),
(68,'Berenjena','Berenjena morada','Kilogramos','Verduras',5.00,'2025-11-01','Activo'),
(69,'Pepino','Pepino entero','Unidades','Verduras',8.00,'2025-11-01','Activo'),
(70,'Arvejas frescas','Arvejas verdes','Gramos','Verduras',3.00,'2025-11-01','Activo'),
(71,'Brocoli','Brócoli fresco','Unidades','Verduras',5.00,'2025-11-01','Activo'),
(72,'Coliflor','Coliflor fresco','Unidades','Verduras',5.00,'2025-11-01','Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(52, 45, 10, 80, 'Normal'),
(53, 34, 8, 60, 'Normal'),
(54, 28, 6, 50, 'Normal'),
(55, 22, 5, 40, 'Normal'),
(56, 42, 15, 70, 'Normal'),
(57, 25, 10, 40, 'Normal'),
(58, 25, 10, 40, 'Normal'),
(59, 25, 10, 40, 'Normal'),
(60, 28, 6, 50, 'Normal'),
(61, 16, 8, 25, 'Normal'),
(62, 20, 10, 30, 'Normal'),
(63, 20, 10, 30, 'Normal'),
(64, 20, 10, 30, 'Normal'),
(65, 12, 4, 20, 'Normal'),
(66, 18, 6, 30, 'Normal'),
(67, 15, 5, 25, 'Normal'),
(68, 15, 5, 25, 'Normal'),
(69, 19, 8, 30, 'Normal'),
(70, 11, 3, 20, 'Normal'),
(71, 12, 5, 20, 'Normal'),
(72, 12, 5, 20, 'Normal');


-- ==============================
--            Frutas
-- ==============================

INSERT INTO Insumos(id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(73, 'Manzana roja', 'Manzana fresca roja', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(74, 'Manzana verde', 'Manzana fresca verde', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(75, 'Banana', 'Banana madura', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(76, 'Naranja', 'Naranja jugosa', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(77, 'Mandarina', 'Mandarina fresca', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(78, 'Pera', 'Pera blanca fresca', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(79, 'Durazno', 'Durazno maduro', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(80, 'Ciruela', 'Ciruela dulce', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo'),
(81, 'Uva morada', 'Uva morada sin semilla', 'Kilogramos', 'Frutas', 5.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios(id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(73, 27.50, 5.00, 50.00, 'Normal'),
(74, 27.50, 5.00, 50.00, 'Normal'),
(75, 27.50, 5.00, 50.00, 'Normal'),
(76, 27.50, 5.00, 50.00, 'Normal'),
(77, 27.50, 5.00, 50.00, 'Normal'),
(78, 27.50, 5.00, 50.00, 'Normal'),
(79, 27.50, 5.00, 50.00, 'Normal'),
(80, 27.50, 5.00, 50.00, 'Normal'),
(81, 27.50, 5.00, 50.00, 'Normal');


-- ==============================
--            Legumbres
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(82, 'Lentejas', 'Lenteja seca para cocción', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(83, 'Porotos Negros', 'Poroto negro seco', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(84, 'Porotos Blancos', 'Poroto blanco seco', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(85, 'Garbanzos', 'Garbanzos secos para cocción', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(86, 'Arvejas Secas', 'Arvejas partidas secas', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(87, 'Arvejas Enteras', 'Arvejas verdes enteras secas', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(88, 'Porotos Rojos', 'Poroto colorado seco', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo'),
(89, 'Garbanzos Partidos', 'Garbanzos partidos secos', 'Kilogramos', 'Legumbres', 5.00, '2025-11-01', 'Activo');


INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(82, 27.50, 5.00, 50.00, 'Normal'),
(83, 27.50, 5.00, 50.00, 'Normal'),
(84, 27.50, 5.00, 50.00, 'Normal'),
(85, 27.50, 5.00, 50.00, 'Normal'),
(86, 27.50, 5.00, 50.00, 'Normal'),
(87, 27.50, 5.00, 50.00, 'Normal'),
(88, 27.50, 5.00, 50.00, 'Normal'),
(89, 27.50, 5.00, 50.00, 'Normal');


-- ==============================
--            Condimentos
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(90, 'Sal Fina', 'Sal fina para condimentar', 'Kilogramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(91, 'Sal Gruesa', 'Sal gruesa de cocina', 'Kilogramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(92, 'Pimienta Negra', 'Pimienta molida', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(93, 'Pimienta Blanca', 'Pimienta blanca molida', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(94, 'Ajo en Polvo', 'Ajo deshidratado molido', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(95, 'Curry', 'Mezcla de especias curry', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(96, 'Comino', 'Comino molido', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(97, 'Oregano', 'Orégano seco triturado', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(98, 'Laurel', 'Hojas de laurel secas', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(99, 'Pimentón Dulce', 'Pimentón molido dulce', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(100, 'Condimento para Arroz', 'Mezcla de sabor para arroz', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(101, 'Condimento para Carne', 'Mezcla especial para carnes', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(102, 'Condimento para Pollo', 'Mezcla de especias para pollo', 'Gramos', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(103, 'Mayonesa', 'Mayonesa en botella', 'Mililitros', 'Condimentos', 5.00, '2025-11-01', 'Activo'),
(104, 'Ketchup', 'Ketchup en botella', 'Mililitros', 'Condimentos', 5.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(90, 27.50, 5.00, 50.00, 'Normal'),
(91, 27.50, 5.00, 50.00, 'Normal'),
(92, 27.50, 5.00, 50.00, 'Normal'),
(93, 27.50, 5.00, 50.00, 'Normal'),
(94, 27.50, 5.00, 50.00, 'Normal'),
(95, 27.50, 5.00, 50.00, 'Normal'),
(96, 27.50, 5.00, 50.00, 'Normal'),
(97, 27.50, 5.00, 50.00, 'Normal'),
(98, 27.50, 5.00, 50.00, 'Normal'),
(99, 27.50, 5.00, 50.00, 'Normal'),
(100, 27.50, 5.00, 50.00, 'Normal'),
(101, 27.50, 5.00, 50.00, 'Normal'),
(102, 27.50, 5.00, 50.00, 'Normal'),
(103, 27.50, 5.00, 50.00, 'Normal'),
(104, 27.50, 5.00, 50.00, 'Normal');


-- ==============================
--            Bebidas
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(105, 'Agua Natural', 'Agua natural', 'Litros', 'Bebidas', 5.00, '2025-11-01', 'Activo'),
(106, 'Jugo de Naranja', 'Jugo sabor naranja en caja', 'Mililitros', 'Bebidas', 5.00, '2025-11-01', 'Activo'),
(107, 'Jugo de Manzana', 'Jugo sabor manzana en caja', 'Mililitros', 'Bebidas', 5.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(105, 27.50, 5.00, 50.00, 'Normal'),
(106, 27.50, 5.00, 50.00, 'Normal'),
(107, 27.50, 5.00, 50.00, 'Normal');

-- ==============================
--            Enlatados
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(108, 'Atún en lata', 'Atún en agua', 'Gramos', 'Enlatados', 2.00, '2025-11-01', 'Activo'),
(109, 'Sardinas en lata', 'Sardinas en aceite', 'Gramos', 'Enlatados', 2.00, '2025-11-01', 'Activo'),
(110, 'Choclo en lata', 'Maíz amarillo enlatado', 'Gramos', 'Enlatados', 3.00, '2025-11-01', 'Activo'),
(111, 'Arvejas en lata', 'Arvejas verdes cocidas', 'Gramos', 'Enlatados', 3.00, '2025-11-01', 'Activo'),
(112, 'Lentejas en lata', 'Lentejas cocidas listas para usar', 'Gramos', 'Enlatados', 3.00, '2025-11-01', 'Activo'),
(113, 'Duraznos en lata', 'Duraznos en almíbar', 'Gramos', 'Enlatados', 4.00, '2025-11-01', 'Activo'),
(114, 'Tomates en lata', 'Tomate perita triturado', 'Gramos', 'Enlatados', 5.00, '2025-11-01', 'Activo'),
(115, 'Salsa de tomate en lata', 'Salsa lista para cocinar', 'Mililitros', 'Enlatados', 4.00, '2025-11-01', 'Activo'),
(116, 'Jardinera en lata', 'Mix de verduras (zanahoria, arvejas, papa)', 'Gramos', 'Enlatados', 3.00, '2025-11-01', 'Activo'),
(117, 'Puré de tomate en lata', 'Concentrado de tomate', 'Mililitros', 'Enlatados', 5.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(108, 25, 5, 80, 'Normal'),
(109, 20, 5, 60, 'Normal'),
(110, 30, 6, 100, 'Normal'),
(111, 28, 6, 100, 'Normal'),
(112, 25, 6, 100, 'Normal'),
(113, 18, 4, 60, 'Normal'),
(114, 40, 8, 120, 'Normal'),
(115, 35, 7, 110, 'Normal'),
(116, 22, 5, 70, 'Normal'),
(117, 42, 8, 120, 'Normal');


-- ==============================
--            Conservas
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(118, 'Mermelada de durazno', 'Mermelada en frasco', 'Gramos', 'Conservas', 4.00, '2025-11-01', 'Activo'),
(119, 'Mermelada de frutilla', 'Mermelada en frasco', 'Gramos', 'Conservas', 4.00, '2025-11-01', 'Activo'),
(120, 'Mermelada de naranja', 'Mermelada cítrica', 'Gramos', 'Conservas', 4.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(118, 22.00, 6.00, 80.00, 'Normal'),
(119, 24.00, 6.00, 80.00, 'Normal'),
(120, 20.00, 6.00, 80.00, 'Normal');

-- ==============================
--            Limpieza
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(121, 'Lavandina', 'Lavandina concentrada para desinfección', 'Litros', 'Limpieza', 5.00, '2025-11-01', 'Activo'),
(122, 'Detergente', 'Detergente líquido para vajilla', 'Mililitros', 'Limpieza', 4.00, '2025-11-01', 'Activo'),
(123, 'Desinfectante', 'Desinfectante líquido para pisos', 'Mililitros', 'Limpieza', 4.00, '2025-11-01', 'Activo'),
(124, 'Desengrasante', 'Desengrasante para cocina', 'Mililitros', 'Limpieza', 4.00, '2025-11-01', 'Activo'),
(125, 'Jabón líquido de manos', 'Jabón para higiene personal', 'Mililitros', 'Limpieza', 4.00, '2025-11-01', 'Activo'),
(126, 'Esponjas', 'Esponjas multiuso para limpieza', 'Unidades', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(127, 'Fibras abrasivas', 'Fibra dura para lavado de utensilios', 'Unidades', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(128, 'Guantes de limpieza', 'Guantes de goma', 'Unidades', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(129, 'Trapos de piso', 'Pañoss para limpieza general', 'Unidades', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(130, 'Aromatizante', 'Aromatizante ambiental', 'Mililitros', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(131, 'Limpiahornos', 'Producto químico para hornos', 'Mililitros', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(132, 'Quitasarro', 'Removedor de sarro para baños y cocina', 'Mililitros', 'Limpieza', 3.00, '2025-11-01', 'Activo'),
(133, 'Desodorante de piso', 'Producto perfumante para pisos', 'Mililitros', 'Limpieza', 3.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(121, 10.00, 5.00, 60.00, 'Normal'),
(122, 20.00, 4.00, 80.00, 'Normal'),
(123, 12.00, 4.00, 70.00, 'Normal'),
(124, 14.00, 4.00, 70.00, 'Normal'),
(125, 16.00, 4.00, 80.00, 'Normal'),
(126, 25.00, 3.00, 100.00, 'Normal'),
(127, 18.00, 3.00, 100.00, 'Normal'),
(128, 12.00, 3.00, 70.00, 'Normal'),
(129, 14.00, 3.00, 70.00, 'Normal'),
(130, 20.00, 3.00, 80.00, 'Normal'),
(131, 12.00, 3.00, 60.00, 'Normal'),
(132, 10.00, 3.00, 60.00, 'Normal'),
(133, 14.00, 3.00, 70.00, 'Normal');

-- ==============================
--            Descartables
-- ==============================

INSERT INTO Insumos (id_insumo, nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, fecha, estado) VALUES
(134, 'Vasos descartables 200ml', 'Vasos plásticos para bebidas', 'Unidades', 'Descartables', 5.00, '2025-11-01', 'Activo'),
(135, 'Vasos descartables 300ml', 'Vasos plásticos reforzados', 'Unidades', 'Descartables', 5.00, '2025-11-01', 'Activo'),
(136, 'Platos descartables', 'Platos plásticos profundos', 'Unidades', 'Descartables', 5.00, '2025-11-01', 'Activo'),
(137, 'Tenedores descartables', 'Tenedores plásticos', 'Unidades', 'Descartables', 4.00, '2025-11-01', 'Activo'),
(138, 'Cucharas descartables', 'Cucharas plásticas', 'Unidades', 'Descartables', 4.00, '2025-11-01', 'Activo'),
(139, 'Cuchillos descartables', 'Cuchillos plásticos', 'Unidades', 'Descartables', 4.00, '2025-11-01', 'Activo'),
(140, 'Servilletas de papel', 'Servilletas para comedor', 'Unidades', 'Descartables', 5.00, '2025-11-01', 'Activo'),
(141, 'Rollos de cocina', 'Papel absorbente', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(142, 'Manteles descartables', 'Manteles plásticos para mesas', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(143, 'Film transparente', 'Rollo de film para cocina', 'Metros', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(144, 'Papel aluminio', 'Rollo de aluminio para cocina', 'Metros', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(145, 'Bolsas de residuos 30L', 'Bolsas para cestos medianos', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(146, 'Bolsas de residuos 60L', 'Bolsas para cestos grandes', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(147, 'Bandejas descartables', 'Bandejas de plástico para servir alimentos', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo'),
(148, 'Envases plásticos con tapa', 'Envases descartables para alimentos', 'Unidades', 'Descartables', 3.00, '2025-11-01', 'Activo');

INSERT INTO Inventarios (id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado) VALUES
(134, 325.00, 50.00, 600.00, 'Normal'),
(135, 270.00, 40.00, 500.00, 'Normal'),
(136, 220.00, 40.00, 400.00, 'Normal'),
(137, 440.00, 80.00, 800.00, 'Normal'),
(138, 440.00, 80.00, 800.00, 'Normal'),
(139, 380.00, 60.00, 700.00, 'Normal'),
(140, 800.00, 100.00, 1500.00, 'Normal'),
(141, 110.00, 20.00, 200.00, 'Normal'),
(142, 85.00, 20.00, 150.00, 'Normal'),
(143, 55.00, 10.00, 100.00, 'Normal'),
(144, 55.00, 10.00, 100.00, 'Normal'),
(145, 165.00, 30.00, 300.00, 'Normal'),
(146, 165.00, 30.00, 300.00, 'Normal'),
(147, 110.00, 20.00, 200.00, 'Normal'),
(148, 110.00, 20.00, 200.00, 'Normal');


-- ==============================
--          Proveedores
-- ==============================

INSERT INTO Proveedores (razonSocial, CUIT, direccion, telefono, mail, fechaAlta, fechaModificacion, estado) VALUES
(UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'),'Distribuidora El Buen Sabor','30-71234567-3','Av. Uruguay 2450, Posadas, Misiones','+543764123456','elbuensabor@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('63882BD2F11211F084A0C48E8F71E7A1'), 'Alimentos Don Mateo SRL','30-68952341-7','Calle Félix de Azara 1820, Posadas, Misiones','+543764559821','donmateo@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('63882DF2F11211F084A0C48E8F71E7A1'), 'Lácteos La Misión','30-70331892-4','Av. López y Planes 3215, Posadas, Misiones','+543764780012','lacteolamision@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('63882ECEF11211F084A0C48E8F71E7A1'), 'Frutas del Norte','30-71829455-8','Calle San Lorenzo 950, Posadas, Misiones','+543764992270','frutasdelnorte@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('63883149F11211F084A0C48E8F71E7A1'), 'Verdulería El Ceibo','30-69330741-9','Av. Centenario 1405, Posadas, Misiones','+543764227801','elceibo@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389AA69F11211F084A0C48E8F71E7A1'), 'Carnes Misiones SA','30-70155238-6','Calle Rivadavia 1040, Posadas, Misiones','+543764401298','carnesmisiones@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389ACF3F11211F084A0C48E8F71E7A1'), 'Super Distribuciones SRL','30-72611850-1','Av. Cabred 2150, Posadas, Misiones','+543764661128','superdistribuciones@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389AE2AF11211F084A0C48E8F71E7A1'), 'Bebidas Almafuerte','30-73229814-2','Calle Junín 1730, Posadas, Misiones','+543764788221','bebidasalmafuerte@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389AFBEF11211F084A0C48E8F71E7A1'), 'La Central de Insumos','30-74568221-5','Av. Comandante Rosales 1200, Posadas, Misiones','+543764550047','lacentralinsumos@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389B7ADF11211F084A0C48E8F71E7A1'), 'Panificados Doña Rosa','30-71994003-9','Calle Sarmiento 2035, Posadas, Misiones','+543764891176','doñarosa@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389B8C3F11211F084A0C48E8F71E7A1'), 'Distribuidora Santa Rita','30-75511234-8','Av. Alem 2510, Posadas, Misiones','+543764112288','santarita@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389B97EF11211F084A0C48E8F71E7A1'), 'Alimentos La Porteña','30-74489123-6','Calle Córdoba 1425, Posadas, Misiones','+543764221199','laportena@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BA38F11211F084A0C48E8F71E7A1'), 'NortePro Mayorista','30-76655231-4','Av. Jauretche 3500, Posadas, Misiones','+543764885622','nortepromayorista@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BAEEF11211F084A0C48E8F71E7A1'), 'Abarrotes Misiones SRL','30-77823411-5','Calle Bolívar 980, Posadas, Misiones','+543764601123','abarrotesmisiones@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BBA1F11211F084A0C48E8F71E7A1'), 'Insumos del Litoral','30-72231457-0','Av. Tambor de Tacuarí 1830, Posadas, Misiones','+543764778190','insumosdelitoral@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BC61F11211F084A0C48E8F71E7A1'), 'Proveeduría AgroAlimentos','30-73382156-2','Calle San Martín 2215, Posadas, Misiones','+543764237719','agroalimentos@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BD14F11211F084A0C48E8F71E7A1'), 'Comercial Los Hermanos','30-76195422-9','Av. Francisco de Haro 3450, Posadas, Misiones','+543764559021','ventasloshermanos@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BE57F11211F084A0C48E8F71E7A1'), 'Panificados La Estrella','30-71368290-3','Calle Salta 1880, Posadas, Misiones','+543764809911','panlaestrella@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BF21F11211F084A0C48E8F71E7A1'), 'Mercado El Puente','30-73125598-7','Av. Quaranta 4100, Posadas, Misiones','+543764967723','elpuentemayorista@mail.com','2025-11-22',NULL,'Activo'),
(UUID_TO_BIN('6389BFD2F11211F084A0C48E8F71E7A1'), 'Distribuidora Sur Tienda','30-74621893-1','Calle Entre Ríos 1120, Posadas, Misiones','+543764307721','surtienda@mail.com','2025-11-22',NULL,'Activo');

INSERT INTO Usuarios (id_usuario, id_persona, id_proveedor, nombreUsuario, contrasenia, mail, telefono, fechaAlta, estado) VALUES
(UUID_TO_BIN('3F18773AEE8311F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'elbuensabor', '$2b$10$xurzcR1SqiXdrm.LgOfdaOKu6QfDGNqMWQ3dSYGd4.auVxGeRijnC', 'elbuensabor@mail.com', '+543764123456', '2025-11-22', 'Activo'),
(UUID_TO_BIN('29C0D3BEEE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('63882BD2F11211F084A0C48E8F71E7A1'), 'donmateo', '$2b$10$TshtXSFQpq3doCJWczdtOuv64vhZAkcqcbV8WQitqxvidNw25n7Ii', 'donmateo@mail.com', '+543764559821', '2025-11-22', 'Activo'),
(UUID_TO_BIN('692C16D0EE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('63882DF2F11211F084A0C48E8F71E7A1'), 'lamision', '$2b$10$MRFb.3TsJPlcGmSqtUE2RugFshMvCzj4V/wHJofX5GSNYQGP6WhSG', 'lacteolamision@mail.com', '+543764780012', '2025-11-22', 'Activo'),
(UUID_TO_BIN('A5151C92EE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('63882ECEF11211F084A0C48E8F71E7A1'), 'frutasnorte', '$2b$10$gdS4Pz5OBtywvYJ0oEKf4Oy/EVNpbDmT5XTix2cwdxPd6xn/U19oK', 'frutasdelnorte@mail.com', '+543764992270', '2025-11-22', 'Activo'),
(UUID_TO_BIN('DA27B505EE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('63883149F11211F084A0C48E8F71E7A1'), 'elceibo', '$2b$10$Gn/E8OH7myN5tqwirYQR2.wuCDoQdg0j781oB2vTucwaFnWfFt/hi', 'elceibo@mail.com', '+543764227801', '2025-11-22', 'Activo'),
(UUID_TO_BIN('13DF34E6EE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389AA69F11211F084A0C48E8F71E7A1'), 'carnesmisiones', '$2b$10$0Byve2oS6r2SzDbPrbLbUu7xWd0Pd1IBoK.BGYpTT3HnNvj.XFBn6', 'carnesmisiones@mail.com', '+543764401298', '2025-11-22', 'Activo'),
(UUID_TO_BIN('45BA4DBFEE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389ACF3F11211F084A0C48E8F71E7A1'), 'superdistribuciones', '$2b$10$FOI0mXs640ndjN5dsI5jj.r/gCQtqu0tdWMDGJaBKV5qyhzpufCQC', 'superdistribuciones@mail.com', '+543764661128', '2025-11-22', 'Activo'),
(UUID_TO_BIN('A05286BBEE8A11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389AE2AF11211F084A0C48E8F71E7A1'), 'almafuerte', '$2b$10$dvS9RsFW2KeemVZWU2iDROZdWFxMgBYy1qz7bPjPkhkU0wDikSoRO', 'bebidasalmafuerte@mail.com', '+543764788221', '2025-11-22', 'Activo'),
(UUID_TO_BIN('DF712580EE8F11F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389AFBEF11211F084A0C48E8F71E7A1'), 'lacentral', '$2b$10$UhMWLCFmwoSOHRfjolI62OWoAUAFEIeLyJXg2tE0xHrOpqysOIoym', 'lacentralinsumos@mail.com', '+543764550047', '2025-11-22', 'Activo'),
(UUID_TO_BIN('0DFE4340EE9011F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389B7ADF11211F084A0C48E8F71E7A1'), 'doñarosa', '$2b$10$fRKJAZkBDK6xImk.btI1feVSjDv2ImYxIEcr5hTqRlixi5bUgqfWy', 'doñarosa@mail.com', '+543764891176', '2025-11-22', 'Activo'),
(UUID_TO_BIN('D5937C60EE9211F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389B8C3F11211F084A0C48E8F71E7A1'), 'santarita', '$2b$10$mpI.sdmKYcsrLk6owWW0M..4xHKxdkaf9iuP1bQpMJz1QYavNb84S', 'santarita@mail.com', '+543764112288', '2025-11-22', 'Activo'),
(UUID_TO_BIN('24301B2AEE9311F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389B97EF11211F084A0C48E8F71E7A1'), 'laporteña', '$2b$10$lv02tyEMLBUQN133zBrhK.X/YBURl35o8Y3b1lVcBZeHy6V68zE3y', 'laportena@mail.com', '+543764221199', '2025-11-22', 'Activo'),
(UUID_TO_BIN('5F1C59F3EE9311F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BA38F11211F084A0C48E8F71E7A1'), 'nortepro', '$2b$10$.hvsivG8SRb1s11T4fOV5.95LJYhfzTy5v9KwjrYyUlTFYYqoOQ7C', 'nortepromayorista@mail.com', '+543764885622', '2025-11-22', 'Activo'),
(UUID_TO_BIN('2DAF3ECFEE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BAEEF11211F084A0C48E8F71E7A1'), 'abarrotes', '$2b$10$EODBIxmgvM1UdPFjg.sWk.EsSnHT3362yYO42eAN5Yrm3plHxELZC', 'abarrotesmisiones@mail.com', '+543764601123', '2025-11-22', 'Activo'),
(UUID_TO_BIN('6AF67DAAEE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BBA1F11211F084A0C48E8F71E7A1'), 'litoral', '$2b$10$O9k3gpzc41/Gcjd8Ua7EPOTzOUkveczWJIqHq0qU.ZKUZDGFPBuWS', 'insumosdelitoral@mail.com', '+543764778190', '2025-11-22', 'Activo'),
(UUID_TO_BIN('9E94DEA7EE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BC61F11211F084A0C48E8F71E7A1'), 'agroalimentos', '$2b$10$e6fNMgYHbVuoGbpF0E9z6e2Ntj0YuUFxNIiPjGf/SUYE1NCLmEeRe', 'agroalimentos@mail.com', '+543764237719', '2025-11-22', 'Activo'),
(UUID_TO_BIN('CC09A1C0EE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BD14F11211F084A0C48E8F71E7A1'), 'loshermanos', '$2b$10$bizpzs9sELHOzOVa8WXR8.OCP8gm7ohJQ7LNYYX3gOo5fuxXmgFJi', 'ventasloshermanos@mail.com', '+543764559021', '2025-11-22', 'Activo'),
(UUID_TO_BIN('32973309EE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BE57F11211F084A0C48E8F71E7A1'), 'laestrella', '$2b$10$HDm6mMf5XeNTB6Id9C/gYeV.DIrmTm/kLLahGIznqek3BC6Zlq0Xi', 'panlaestrella@mail.com', '+543764809911', '2025-11-22', 'Activo'),
(UUID_TO_BIN('7CC3124CEE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BF21F11211F084A0C48E8F71E7A1'), 'elpuente', '$2b$10$yQoAuYW35JmxXaed02hWOuH4K9SfRxD6XkgFxi1/u4.SwT6QX0RAG', 'elpuentemayorista@mail.com', '+543764967723', '2025-11-22', 'Activo'),
(UUID_TO_BIN('E42DD03CEE9411F0AE1FC48E8F71E7A1'), NULL, UUID_TO_BIN('6389BFD2F11211F084A0C48E8F71E7A1'), 'surtienda', '$2b$10$P40PGTEoDacEZo/j8rqueOBr9c.jRg357pqr2LPOvIyykfDpCnGla', 'surtienda@mail.com', '+543764307721', '2025-11-22', 'Activo');

SET FOREIGN_KEY_CHECKS = 0;
INSERT INTO UsuariosRoles (id_usuario, id_rol, fechaAsignacion, estado) VALUES 
(UUID_TO_BIN('3F18773AEE8311F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('29C0D3BEEE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('692C16D0EE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('A5151C92EE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('DA27B505EE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('13DF34E6EE8B11F0AE1FC48E8B11F0AE'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('45BA4DBFEE8B11F0AE1FC48E8B11F0AE'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('A05286BBEE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('DF712580EE8A11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('0DFE4340EE9011F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('D5937C60EE9211F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('24301B2AEE9311F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('5F1C59F3EE9311F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('2DAF3ECFEE9411F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('6AF67DAAEE9411F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('9E94DEA7EE9411F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('CC09A1C0EE9411F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('32973309EE9D11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('7CC3124CEE9D11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo'),
(UUID_TO_BIN('E42DD03CEE9D11F0AE1FC48E8F71E7A1'), 5, '2025-11-22', 'Activo');
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
--           Proveedor-Insumo
-- ========================================

INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado) 
-- CATEGORÍA: CARNES (Insumos 1 al 12)
-- Proveedor 1: Alimentos Don Mateo SRL, Proveedor 2: Carnes Misiones SA (por lógica de rubro)
SELECT id_insumo, UUID_TO_BIN('63882BD2F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Carnes';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389AA69F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Carnes';

-- CATEGORÍA: LÁCTEOS (Insumos 13 al 33)
-- Proveedor 1: Lácteos La Misión, Proveedor 2: La Central de Insumos, Proveedor 3: Distribuidora El Buen Sabor
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63882DF2F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Lacteos';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389AFBEF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Lacteos';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Lacteos';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)

-- CATEGORÍA: CEREALES (Insumos 34 al 51)
-- Múltiples proveedores según descripción: Alimentos La Porteña, Panificados Doña Rosa, La estrella.
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389B97EF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Cereales';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389B7ADF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Cereales';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BE57F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Cereales';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Cereales';


-- CATEGORÍA: VERDURAS (Insumos 52 al 72)
-- Proveedor 1: Verdulería El Ceibo, Proveedor 2: Proveeduría AgroAlimentos, Proveedor 3: Insumos del Litoral
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63883149F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Verduras';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BC61F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Verduras';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BBA1F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Verduras';

-- CATEGORÍA: FRUTAS (Insumos 73 al 81)
-- Proveedor 1: Frutas del Norte, Proveedor 2: Comercial Los Hermanos, Proveedor 3: Mercado El Puente
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63882ECEF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Frutas';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BD14F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Frutas';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BF21F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Frutas';

-- CATEGORÍA: LEGUMBRES (Insumos 82 al 89)
-- Proveedor 1: Abarrotes Misiones SRL, Proveedor 2: NortePro Mayorista
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BAEEF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Legumbres';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BA38F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Legumbres';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Legumbres';


-- CATEGORÍA: CONDIMENTOS (Insumos 90 al 104)
-- Proveedor 1: Distribuidora Sur Tienda, Proveedor 2: Alimentos La Porteña
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BFD2F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Condimentos';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389B97EF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Condimentos';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Condimentos';

-- CATEGORÍA: BEBIDAS (Insumos 105 al 107)
-- Proveedor 1: Bebidas Almafuerte, Proveedor 2: NortePro Mayorista
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389AE2AF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Bebidas';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BA38F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Bebidas';
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria = 'Bebidas';

-- CATEGORÍA: ENLATADOS Y CONSERVAS (Insumos 108 al 120)
-- Proveedor 1: Distribuidora Santa Rita, Proveedor 2: Alimentos Don Mateo SRL
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389B8C3F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Enlatados', 'Conservas');
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63882BD2F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Enlatados', 'Conservas');
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Enlatados', 'Conservas');

-- CATEGORÍA: LIMPIEZA Y DESCARTABLES (Insumos 121 al 148)
-- Proveedor 1: Super Distribuciones SRL, Proveedor 2: Distribuidora Sur Tienda
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389ACF3F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Limpieza', 'Descartables');
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('6389BFD2F11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Limpieza', 'Descartables');
INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
SELECT id_insumo, UUID_TO_BIN('63876D5DF11211F084A0C48E8F71E7A1'), 'Bueno', 'Activo' FROM Insumos WHERE categoria IN ('Limpieza', 'Descartables');



-- ========================================
--                 Recetas
-- ========================================

INSERT INTO Recetas(id_receta, nombreReceta, instrucciones, unidadSalida, fechaAlta, estado) VALUES
  (UUID_TO_BIN('5bfadf1b-f1a8-11f0-901c-c48e8f71e7a1'),'Leche con galletitas','Calentar la leche en una olla sin que llegue a hervir. \nServir la leche caliente en una taza o vaso. \nEndulzar con azúcar o miel si se desea. \nAcompañar con galletitas o pan según preferencia.','Litro','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),'Polenta con Salsa Bolognesa','Picar la cebolla y el ajo en grandes cantidades, usando procesadora o cortadora industrial para agilizar. \nRallar la zanahoria y cortar los morrones en cubos pequeños, también con ayuda de equipos de cocina grandes. \nEn ollas industriales, calentar aceite y sofreír la cebolla, el ajo, la zanahoria y el morrón hasta que estén tiernos. \nAgregar la carne picada en tandas, removiendo constantemente para que se dore de manera uniforme. \nIncorporar el tomate triturado y condimentar con sal, pimienta y orégano. \nDejar cocinar a fuego bajo durante al menos 30 minutos, revolviendo periódicamente para que la salsa no se pegue. En otra olla grande, calentar el agua con sal. \nAñadir la polenta en forma de lluvia, revolviendo con palas largas para evitar grumos. \nCocinar la polenta hasta que espese y quede cremosa, manteniendo el fuego bajo. \nServir la polenta en bandejas gastronómicas y cubrir con la salsa bolognesa caliente. \nEspolvorear queso rallado por encima antes de servir.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c96d1-f1a8-11f0-901c-c48e8f71e7a1'),'Leche con galletitas dulces','Abrir el envase de leche larga vida. \nCalentar la leche en una olla o servir fría según preferencia. \nVerter la leche en una taza o vaso. \nEndulzar con azúcar si se desea. \nAcompañar con galletitas dulces o de agua.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),'Lenteja con carnes','Remojar las lentejas por 2 horas. \nPicar cebolla, zanahoria y morrón. \nSofreír las verduras en aceite. \nAgregar carne vacuna en cubos y dorar. \nAñadir las lentejas. \nIncorporar tomate triturado y condimentos. \nCocinar a fuego lento hasta que las lentejas estén tiernas.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),'Tallarín con salsa bolognesa','Hervir los tallarines en agua con sal hasta que estén al dente. \nPicar cebolla, zanahoria y morrón. \nSofreír las verduras en aceite. \nAgregar carne picada y cocinar hasta dorar. \nAñadir tomate triturado y condimentos. \nCocinar a fuego lento hasta que la salsa se concentre.\nServir los tallarines con la salsa por encima. \nEspolvorear queso rallado antes de servir.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),'Guiso de porotos','Remojar los porotos secos durante 12 horas. \nPicar cebolla, zanahoria y morrón. \nSofreír las verduras en aceite. \nAgregar los porotos escurridos. \nAñadir tomate triturado y condimentos. \nCocinar a fuego lento hasta que los porotos estén tiernos.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),'Arroz con Pollo','Lavar el arroz y reservar. \nCortar el pollo en trozos pequeños. \nPicar cebolla, morrón y ajo. \nSofreír las verduras en aceite hasta dorar. \nAgregar el pollo y cocinar hasta sellar. \nAñadir el arroz y cubrir con caldo caliente. \nCondimentar con sal, pimienta y laurel. \nCocinar a fuego medio hasta que el arroz esté tierno.','Porcion','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c9cd3-f1a8-11f0-901c-c48e8f71e7a1'),'Chocolatada con galletitas','Calentar la leche en una olla sin que llegue a hervir.\nAgregar el cacao en polvo o utilizar leche chocolatada ya preparada y mezclar bien hasta integrar. \nEndulzar con azúcar si se desea y mantener caliente. \nServir la leche chocolatada en taza acompañada con galletitas dulces o de agua.','Litro','2025-12-01','Activo'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),'Fideos con pollo','Hervir los fideos en agua con sal hasta que estén al dente. \nCortar el pollo en cubos pequeños. \nPicar cebolla y morrón. \nSofreír las verduras en aceite. \nAgregar el pollo y cocinar hasta dorar. \nEscurrir los fideos y mezclar con el pollo y las verduras.\nCondimentar con sal, pimienta y orégano.','Porcion','2025-12-01','Activo');

SET FOREIGN_KEY_CHECKS = 0;
INSERT INTO ItemsRecetas(id_receta, id_insumo, cantidadPorPorcion, unidadPorPorcion) VALUES
  (UUID_TO_BIN('5bfadf1b-f1a8-11f0-901c-c48e8f71e7a1'),13,200,'mililitros'),
  (UUID_TO_BIN('5bfadf1b-f1a8-11f0-901c-c48e8f71e7a1'),47,30,'gramos'),

  (UUID_TO_BIN('5c0c96d1-f1a8-11f0-901c-c48e8f71e7a1'),15,200,'mililitros'),
  (UUID_TO_BIN('5c0c96d1-f1a8-11f0-901c-c48e8f71e7a1'),48,30,'gramos'),

  (UUID_TO_BIN('5c0c9cd3-f1a8-11f0-901c-c48e8f71e7a1'),16,200,'mililitros'),
  (UUID_TO_BIN('5c0c9cd3-f1a8-11f0-901c-c48e8f71e7a1'),48,3,'gramos'),

  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),5,120,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),40,100,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),57,30,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),94,5,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),
  (UUID_TO_BIN('5c0c9bb1-f1a8-11f0-901c-c48e8f71e7a1'),98,1,'gramos'),

  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),4,120,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),43,100,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),58,30,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),97,1,'gramos'),
  (UUID_TO_BIN('5c0c9dba-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),
  
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),54,30,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),58,30,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),60,100,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),88,100,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),
  (UUID_TO_BIN('5c0c9acb-f1a8-11f0-901c-c48e8f71e7a1'),97,1,'gramos'),

  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),1,120,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),54,30,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),57,30,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),82,100,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),117,100,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),
  (UUID_TO_BIN('5c0c97d2-f1a8-11f0-901c-c48e8f71e7a1'),96,1,'gramos'),

  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),6,100,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),18,20,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),38,100,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),54,30,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),57,30,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),94,5,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),105,400,'mililitros'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),114,150,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),97,1,'gramos'),
  (UUID_TO_BIN('5c0c9268-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),

  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),6,120,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),18,20,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),46,100,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),54,30,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),55,50,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),57,30,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),90,2,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),114,150,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),149,10,'mililitros'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),92,1,'gramos'),
  (UUID_TO_BIN('5c0c989d-f1a8-11f0-901c-c48e8f71e7a1'),97,1,'gramos');
SET FOREIGN_KEY_CHECKS = 1;


-- ========================================
--           Tipos Mermas
-- ========================================

INSERT INTO TiposMermas (id_tipoMerma, nombre, descripcion, estado) VALUES
(1,'Vencimiento','Productos vencidos','Activo'),
(2,'Deterioro','Productos en mal estados','Activo'),
(3,'Error de preparación','Errores durante la preparación de alimentos','Activo');

-- ========================================
--             Servicio Turno
-- ========================================

INSERT INTO ServicioTurno(id_turno, id_servicio, fechaAsociacion) VALUES 
(1,1,'2025-12-06'),
(1,2,'2025-12-06'),
(2,3,'2025-12-06');

-- ========================================
--           Parametros Sistema
-- ========================================

INSERT INTO Parametros(id_parametro, nombreParametro, valor, tipoParametro, fechaAlta, fechaModificacion, estado) VALUES
(1,'ALERTAS_INVENTARIO_HABILITADAS','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(2,'ALERTAS_AGOTADO_HABILITADAS','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(3,'ALERTAS_CRITICO_HABILITADAS','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(4,'ALERTAS_BAJO_HABILITADAS','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(5,'PORCENTAJE_ALERTA_CRITICO','2','Numero','2025-11-30 00:00:00', NULL, 'Activo'),
(6,'PORCENTAJE_ALERTA_BAJO','10','Numero','2025-11-30 00:00:00', NULL, 'Activo'),
(7,'TELEGRAM_HABILITADO','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(8,'CANTIDAD_REINTENTOS_TELEGRAM','3','Numero','2025-11-30 00:00:00', NULL, 'Activo'),
(9,'INTERVALO_REINTENTOS_TELEGRAM','10','Numero','2025-11-30 00:00:00', NULL, 'Activo'),
(10,'EMAIL_HABILITADO','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(12,'NOTIFICACIONES_UI_HABILITADAS','false','Booleano','2025-11-30 00:00:00', NULL, 'Activo'),
(13,'TEST_ALERTAS_DEBUG','true','Booleano','2025-11-30 00:00:00',NULL,'Activo'),
(14,'INSUMOS_SEMANALES_HABILITADO','false','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(15,'INSUMOS_SEMANALES_DIA','viernes','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(16,'INSUMOS_SEMANALES_HORA','08:00','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(17,'INSUMOS_SEMANALES_NOTIFICACION','false','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(18,'PEDIDOS_AUTOMATICOS_HABILITADO','false','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(19,'PEDIDOS_AUTOMATICOS_DIA','viernes','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(20,'PEDIDOS_AUTOMATICOS_HORA','09:00','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(21,'PEDIDOS_AUTOMATICOS_NOTIFICACION','false','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(22,'CANTIDAD_REINTENTOS_PEDIDOS','3','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(23,'INTERVALO_REINTENTOS_PEDIDOS','5','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(24,'FINALIZACION_AUTOMATICA_HABILITADO','false','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(25,'FINALIZACION_AUTOMATICA_HORA','20:00','Texto','2025-11-30 00:00:00',NULL,'Activo'),
(26,'NOMBRE_ESCUELA','Escuela N° 346 San Isidro Labrador','string','2025-11-30 00:00:00', NULL, 'Activo'),
(27,'DIRECCION_ESCUELA','12438 RP213','string','2025-11-30 00:00:00', NULL, 'Activo'),
(28,'TELEFONO_ESCUELA','+543764222222','string','2025-11-30 00:00:00', NULL, 'Activo'),
(29,'EMAIL_ESCUELA','escuala-346@miescuela.edu','string','2025-11-30 00:00:00', NULL, 'Activo');

-- ========================================
--        Alumno - Grados
-- ========================================

INSERT INTO AlumnoGrado(id_alumnoGrado, id_persona, nombreGrado, cicloLectivo) VALUES
(1,17,'1° GRADO A','2026-01-01'),
(2,18,'1° GRADO A','2026-01-01'),
(3,19,'1° GRADO A','2026-01-01'),
(4,20,'1° GRADO A','2026-01-01'),
(5,21,'1° GRADO A','2026-01-01'),
(6,22,'1° GRADO A','2026-01-01'),
(7,23,'1° GRADO A','2026-01-01'),
(8,24,'1° GRADO A','2026-01-01'),
(9,25,'1° GRADO A','2026-01-01'),
(10,26,'1° GRADO A','2026-01-01'),
(11,27,'1° GRADO A','2026-01-01'),
(12,28,'1° GRADO A','2026-01-01'),
(13,29,'1° GRADO A','2026-01-01'),
(14,30,'1° GRADO A','2026-01-01'),
(15,31,'1° GRADO A','2026-01-01'),
(16,32,'1° GRADO B','2026-01-01'),
(17,33,'1° GRADO B','2026-01-01'),
(18,34,'1° GRADO B','2026-01-01'),
(19,35,'1° GRADO B','2026-01-01'),
(20,36,'1° GRADO B','2026-01-01'),
(21,37,'1° GRADO B','2026-01-01'),
(22,38,'1° GRADO B','2026-01-01'),
(23,39,'1° GRADO B','2026-01-01'),
(24,40,'1° GRADO B','2026-01-01'),
(25,41,'1° GRADO B','2026-01-01'),
(26,42,'1° GRADO B','2026-01-01'),
(27,43,'1° GRADO B','2026-01-01'),
(28,44,'1° GRADO B','2026-01-01'),
(29,45,'1° GRADO B','2026-01-01'),
(30,46,'1° GRADO B','2026-01-01'),
(31,47,'1° GRADO B','2026-01-01'),
(32,48,'1° GRADO B','2026-01-01'),
(33,49,'1° GRADO B','2026-01-01'),
(34,50,'1° GRADO B','2026-01-01'),
(35,51,'1° GRADO B','2026-01-01'),
(36,52,'2° GRADO A','2026-01-01'),
(37,53,'2° GRADO A','2026-01-01'),
(38,54,'2° GRADO A','2026-01-01'),
(39,55,'2° GRADO A','2026-01-01'),
(40,56,'2° GRADO A','2026-01-01'),
(41,57,'2° GRADO A','2026-01-01'),
(42,58,'2° GRADO A','2026-01-01'),
(43,59,'2° GRADO A','2026-01-01'),
(44,60,'2° GRADO A','2026-01-01'),
(45,61,'2° GRADO A','2026-01-01'),
(46,62,'2° GRADO A','2026-01-01'),
(47,63,'2° GRADO A','2026-01-01'),
(48,64,'2° GRADO A','2026-01-01'),
(49,65,'2° GRADO A','2026-01-01'),
(50,66,'2° GRADO A','2026-01-01'),
(51,67,'2° GRADO A','2026-01-01'),
(52,68,'2° GRADO A','2026-01-01'),
(53,69,'2° GRADO A','2026-01-01'),
(54,70,'2° GRADO A','2026-01-01'),
(55,71,'2° GRADO A','2026-01-01'),
(56,72,'2° GRADO B','2026-01-01'),
(57,73,'2° GRADO B','2026-01-01'),
(58,74,'2° GRADO B','2026-01-01'),
(59,75,'2° GRADO B','2026-01-01'),
(60,76,'2° GRADO B','2026-01-01'),
(61,77,'2° GRADO B','2026-01-01'),
(62,78,'2° GRADO B','2026-01-01'),
(63,79,'2° GRADO B','2026-01-01'),
(64,80,'2° GRADO B','2026-01-01'),
(65,81,'2° GRADO B','2026-01-01'),
(66,82,'2° GRADO B','2026-01-01'),
(67,83,'2° GRADO B','2026-01-01'),
(68,84,'2° GRADO B','2026-01-01'),
(69,85,'2° GRADO B','2026-01-01'),
(70,86,'2° GRADO B','2026-01-01'),
(71,87,'2° GRADO B','2026-01-01'),
(72,88,'2° GRADO B','2026-01-01'),
(73,89,'2° GRADO B','2026-01-01'),
(74,90,'2° GRADO B','2026-01-01'),
(75,91,'2° GRADO B','2026-01-01'),
(76,92,'3° GRADO A','2026-01-01'),
(77,93,'3° GRADO A','2026-01-01'),
(78,94,'3° GRADO A','2026-01-01'),
(79,95,'3° GRADO A','2026-01-01'),
(80,96,'3° GRADO A','2026-01-01'),
(81,97,'3° GRADO A','2026-01-01'),
(82,98,'3° GRADO A','2026-01-01'),
(83,99,'3° GRADO A','2026-01-01'),
(84,100,'3° GRADO A','2026-01-01'),
(85,101,'3° GRADO A','2026-01-01'),
(86,102,'3° GRADO A','2026-01-01'),
(87,103,'3° GRADO A','2026-01-01'),
(88,104,'3° GRADO A','2026-01-01'),
(89,105,'3° GRADO A','2026-01-01'),
(90,106,'3° GRADO A','2026-01-01'),
(91,107,'3° GRADO A','2026-01-01'),
(92,108,'3° GRADO A','2026-01-01'),
(93,109,'3° GRADO A','2026-01-01'),
(94,110,'3° GRADO A','2026-01-01'),
(95,111,'3° GRADO A','2026-01-01'),
(96,112,'3° GRADO B','2026-01-01'),
(97,113,'3° GRADO B','2026-01-01'),
(98,114,'3° GRADO B','2026-01-01'),
(99,115,'3° GRADO B','2026-01-01'),
(100,116,'3° GRADO B','2026-01-01'),
(101,117,'3° GRADO B','2026-01-01'),
(102,118,'3° GRADO B','2026-01-01'),
(103,119,'3° GRADO B','2026-01-01'),
(104,120,'3° GRADO B','2026-01-01'),
(105,121,'3° GRADO B','2026-01-01'),
(106,122,'3° GRADO B','2026-01-01'),
(107,123,'3° GRADO B','2026-01-01'),
(108,124,'3° GRADO B','2026-01-01'),
(109,125,'3° GRADO B','2026-01-01'),
(110,126,'4° GRADO A','2026-01-01'),
(111,127,'4° GRADO A','2026-01-01'),
(112,128,'4° GRADO A','2026-01-01'),
(113,129,'4° GRADO A','2026-01-01'),
(114,130,'4° GRADO A','2026-01-01'),
(115,131,'4° GRADO A','2026-01-01'),
(116,132,'4° GRADO A','2026-01-01'),
(117,133,'4° GRADO A','2026-01-01'),
(118,134,'4° GRADO A','2026-01-01'),
(119,135,'4° GRADO A','2026-01-01'),
(120,136,'4° GRADO A','2026-01-01'),
(121,137,'4° GRADO A','2026-01-01'),
(122,138,'4° GRADO A','2026-01-01'),
(123,139,'4° GRADO A','2026-01-01'),
(124,140,'4° GRADO A','2026-01-01'),
(125,141,'4° GRADO A','2026-01-01'),
(126,142,'4° GRADO A','2026-01-01'),
(127,143,'4° GRADO A','2026-01-01'),
(128,144,'4° GRADO A','2026-01-01'),
(129,145,'4° GRADO A','2026-01-01'),
(130,146,'4° GRADO B','2026-01-01'),
(131,147,'4° GRADO B','2026-01-01'),
(132,148,'4° GRADO B','2026-01-01'),
(133,149,'4° GRADO B','2026-01-01'),
(134,150,'4° GRADO B','2026-01-01'),
(135,151,'4° GRADO B','2026-01-01'),
(136,152,'4° GRADO B','2026-01-01'),
(137,153,'4° GRADO B','2026-01-01'),
(138,154,'4° GRADO B','2026-01-01'),
(139,155,'4° GRADO B','2026-01-01'),
(140,156,'4° GRADO B','2026-01-01'),
(141,157,'4° GRADO B','2026-01-01'),
(142,158,'4° GRADO B','2026-01-01'),
(143,159,'5° GRADO A','2026-01-01'),
(144,160,'5° GRADO A','2026-01-01'),
(145,161,'5° GRADO A','2026-01-01'),
(146,162,'5° GRADO A','2026-01-01'),
(147,163,'5° GRADO A','2026-01-01'),
(148,164,'5° GRADO A','2026-01-01'),
(149,165,'5° GRADO A','2026-01-01'),
(150,166,'5° GRADO A','2026-01-01'),
(151,167,'5° GRADO A','2026-01-01'),
(152,168,'5° GRADO A','2026-01-01'),
(153,169,'5° GRADO B','2026-01-01'),
(154,170,'5° GRADO B','2026-01-01'),
(155,171,'5° GRADO B','2026-01-01'),
(156,172,'5° GRADO B','2026-01-01'),
(157,173,'5° GRADO B','2026-01-01'),
(158,174,'5° GRADO B','2026-01-01'),
(159,175,'5° GRADO B','2026-01-01'),
(160,176,'5° GRADO B','2026-01-01'),
(161,177,'5° GRADO B','2026-01-01'),
(162,178,'5° GRADO B','2026-01-01'),
(163,179,'5° GRADO B','2026-01-01'),
(164,180,'5° GRADO B','2026-01-01'),
(165,181,'6° GRADO A','2026-01-01'),
(166,182,'6° GRADO A','2026-01-01'),
(167,183,'6° GRADO A','2026-01-01'),
(168,184,'6° GRADO A','2026-01-01'),
(169,185,'6° GRADO A','2026-01-01'),
(170,186,'6° GRADO A','2026-01-01'),
(171,187,'6° GRADO A','2026-01-01'),
(172,188,'6° GRADO A','2026-01-01'),
(173,189,'6° GRADO A','2026-01-01'),
(174,190,'6° GRADO A','2026-01-01'),
(175,191,'6° GRADO A','2026-01-01'),
(176,192,'6° GRADO A','2026-01-01'),
(177,193,'6° GRADO B','2026-01-01'),
(178,194,'6° GRADO B','2026-01-01'),
(179,195,'6° GRADO B','2026-01-01'),
(180,196,'6° GRADO B','2026-01-01'),
(181,197,'6° GRADO B','2026-01-01'),
(182,198,'6° GRADO B','2026-01-01'),
(183,199,'6° GRADO B','2026-01-01'),
(184,200,'6° GRADO B','2026-01-01'),
(185,201,'6° GRADO B','2026-01-01'),
(186,202,'6° GRADO B','2026-01-01'),
(187,203,'6° GRADO B','2026-01-01'),
(188,204,'6° GRADO B','2026-01-01'),
(189,205,'6° GRADO B','2026-01-01'),
(190,206,'6° GRADO B','2026-01-01'),
(191,207,'6° GRADO B','2026-01-01'),
(192,208,'7° GRADO A','2026-01-01'),
(193,209,'7° GRADO A','2026-01-01'),
(194,210,'7° GRADO A','2026-01-01'),
(195,211,'7° GRADO A','2026-01-01'),
(196,212,'7° GRADO A','2026-01-01'),
(197,213,'7° GRADO A','2026-01-01'),
(198,214,'7° GRADO A','2026-01-01'),
(199,215,'7° GRADO A','2026-01-01'),
(200,216,'7° GRADO A','2026-01-01'),
(201,217,'7° GRADO A','2026-01-01'),
(202,218,'7° GRADO A','2026-01-01'),
(203,219,'7° GRADO A','2026-01-01'),
(204,220,'7° GRADO A','2026-01-01'),
(205,221,'7° GRADO A','2026-01-01'),
(206,222,'7° GRADO B','2026-01-01'),
(207,223,'7° GRADO B','2026-01-01'),
(208,224,'7° GRADO B','2026-01-01'),
(209,225,'7° GRADO B','2026-01-01'),
(210,226,'7° GRADO B','2026-01-01'),
(211,227,'7° GRADO B','2026-01-01'),
(212,228,'7° GRADO B','2026-01-01'),
(213,229,'7° GRADO B','2026-01-01'),
(214,230,'7° GRADO B','2026-01-01'),
(215,231,'7° GRADO B','2026-01-01'),
(216,232,'7° GRADO B','2026-01-01'),
(217,233,'7° GRADO B','2026-01-01'),
(218,234,'7° GRADO B','2026-01-01'),
(219,235,'7° GRADO B','2026-01-01'),
(220,236,'7° GRADO B','2026-01-01'),
(221,237,'7° GRADO B','2026-01-01'),
(222,238,'7° GRADO B','2026-01-01'),
(223,239,'7° GRADO B','2026-01-01'),
(224,240,'7° GRADO B','2026-01-01'),
(225,241,'7° GRADO B','2026-01-01'),
(226,242,'7° GRADO B','2026-01-01'),
(227,243,'7° GRADO B','2026-01-01'),
(228,244,'7° GRADO B','2026-01-01');


-- ========================================
--        Docentes - Grados
-- ========================================

INSERT INTO DocenteGrado(id_docenteTitular, id_persona, nombreGrado, fechaAsignado, cicloLectivo) VALUES
(1,3,'1° Grado A','2026-01-01','2026-01-01'),
(2,4,'1° Grado B','2026-01-01','2026-01-01'),
(3,5,'2° Grado A','2026-01-01','2026-01-01'),
(4,6,'2° Grado B','2026-01-01','2026-01-01'),
(5,7,'3° Grado A','2026-01-01','2026-01-01'),
(6,8,'3° Grado B','2026-01-01','2026-01-01'),
(7,9,'4° Grado A','2026-01-01','2026-01-01'),
(8,10,'4° Grado B','2026-01-01','2026-01-01'),
(9,11,'5° Grado A','2026-01-01','2026-01-01'),
(10,12,'5° Grado B','2026-01-01','2026-01-01'),
(11,13,'6° Grado A','2026-01-01','2026-01-01'),
(12,14,'6° Grado B','2026-01-01','2026-01-01'),
(13,15,'7° Grado A','2026-01-01','2026-01-01'),
(14,16,'7° Grado B','2026-01-01','2026-01-01');

-- ========================================
--           Estado Pedidos
-- ========================================

INSERT INTO EstadoPedidos (id_estadoPedido, nombreEstado) VALUES
(1,'Pendiente'),
(2,'Aprobado'),
(3,'Confirmado'),
(4,'Enviado'),
(5,'En espera'),
(6,'Recibido'),
(7,'Entregado'),
(8,'Cancelado'),
(9,'Fallido');