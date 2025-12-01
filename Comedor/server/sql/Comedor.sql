--
-- ER/Studio Data Architect SQL Code Generation
-- Company :      Cristian
-- Project :      ModeloFisico.DM1
-- Author :       Cristian
--
-- Date Created : Friday, October 31, 2025 03:00:20
-- Target DBMS : MySQL 8.x
--

-- -----------------------------------------------------
-- Esquema de Gestión de Comedor - Con UUIDs
-- -----------------------------------------------------
DROP DATABASE if exists Comedor; 
CREATE DATABASE Comedor;
USE Comedor;

-- -----------------------------------------------------
-- TABLE: AlumnoGrado 
-- -----------------------------------------------------

CREATE TABLE AlumnoGrado(
    id_alumnoGrado    INT            AUTO_INCREMENT,
    id_persona        INT            NOT NULL,
    nombreGrado       VARCHAR(100)   NOT NULL,
    cicloLectivo      DATE           DEFAULT '2025-01-01',
    PRIMARY KEY (id_alumnoGrado)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Asistencias 
-- -----------------------------------------------------

CREATE TABLE Asistencias(
    id_asistencia     INT                        AUTO_INCREMENT,
    id_servicio       INT                        NOT NULL,
    id_alumnoGrado    INT                        NOT NULL,
    fecha             DATE                       DEFAULT '2025-01-01',
    tipoAsistencia    ENUM('Si', 'No', 'Ausente')    NOT NULL DEFAULT 'No',
    estado            ENUM('Pendiente', 'Completado', 'Cancelado')    NOT NULL DEFAULT 'Pendiente',
    PRIMARY KEY (id_asistencia)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: RegistrosAsistencias 
-- Tabla agregada para registros por servicio/grado
-- -----------------------------------------------------

CREATE TABLE RegistrosAsistencias(
    id_asistencia       BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_servicio         INT                        NOT NULL,
    id_grado            INT                        NOT NULL,
    fecha               DATE                       DEFAULT '2025-01-01',
    cantidadPresentes   INT                        DEFAULT 0,
    fecha_creacion      DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME                   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_asistencia)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Auditorias 
-- -----------------------------------------------------

CREATE TABLE Auditorias(
    id_registro    BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_usuario     BINARY(16)                 NOT NULL,
    fechaHora      DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    modulo         VARCHAR(100)               NOT NULL,
    tipoAccion     ENUM('---', 'Registrar', 'Modificar', 'Eliminar', 'Buscar', 'Consultar', 'Exportar')    NOT NULL DEFAULT '---',
    descripcion    VARCHAR(100)               NOT NULL,
    estado         ENUM('---', 'Exito', 'Error', 'Advertencia')    NOT NULL DEFAULT '---',
    PRIMARY KEY (id_registro)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Consumos 
-- -----------------------------------------------------

CREATE TABLE Consumos(
    id_consumo             BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_jornada             BINARY(16)                 NOT NULL,
    id_servicio            INT                        NOT NULL,
    id_turno               INT                        NOT NULL,
    id_usuario             BINARY(16)                 NOT NULL,
    fecha                  DATE                       DEFAULT '2025-01-01',
    origenCalculo          ENUM('Calculado', 'Manual', 'Validado') DEFAULT 'Calculado',
    fechaHoraGeneracion    DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_consumo)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: DetalleConsumo 
-- -----------------------------------------------------

CREATE TABLE DetalleConsumo(
    id_detalleConsumo    INT               AUTO_INCREMENT,
    id_consumo           BINARY(16)        NOT NULL,
    id_insumo            INT               NOT NULL,
    cantidadUtilizada    DECIMAL(10, 2)    NOT NULL,
    cantidadCalcula      DECIMAL(10, 2),
    PRIMARY KEY (id_detalleConsumo)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: DetallePedido 
-- -----------------------------------------------------

CREATE TABLE DetallePedido(
    id_detallePedido      INT               AUTO_INCREMENT,
    id_pedido             BINARY(16)        NOT NULL,
    id_proveedor          BINARY(16)        NOT NULL,
    id_insumo             INT               NOT NULL,
    cantidadSolicitada    DECIMAL(10, 3)    NOT NULL,
    PRIMARY KEY (id_detallePedido)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: DocenteGrado 
-- -----------------------------------------------------

CREATE TABLE DocenteGrado(
    id_docenteTitular    INT            NOT NULL,
    id_persona           INT            NOT NULL,
    nombreGrado          VARCHAR(100)    NOT NULL,
    fechaAsignado        DATE           DEFAULT '2025-01-01',
    cicloLectivo         DATE           DEFAULT '2025-01-01',
    PRIMARY KEY (id_docenteTitular, id_persona, nombreGrado)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: EstadoPedido 
-- -----------------------------------------------------

CREATE TABLE EstadoPedido(
    id_estadoPedido    INT                        AUTO_INCREMENT,
    nombreEstado       ENUM('Pendiente', 'Aprobado', 'Cancelado', 'Entregado')	NOT NULL DEFAULT 'Pendiente',
    descripcion        VARCHAR(100),
    PRIMARY KEY (id_estadoPedido)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Grados 
-- -----------------------------------------------------

CREATE TABLE Grados(
    id_grado       INT                        AUTO_INCREMENT,
    id_turno       INT                        NOT NULL,
    nombreGrado    VARCHAR(100)               NOT NULL,
    estado         ENUM('Activo', 'Inactivo')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_grado)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Insumos 
-- -----------------------------------------------------

CREATE TABLE Insumos(
    id_insumo       INT            AUTO_INCREMENT,
    nombreInsumo    VARCHAR(100)    NOT NULL,
    descripcion     VARCHAR(100),
    unidadMedida    VARCHAR(100)    NOT NULL,
    categoria       ENUM('Carnes', 'Lacteos', 'Cereales', 'Verduras', 'Condimentos', 'Otros') DEFAULT 'Otros',
    stockMinimo     DECIMAL(10,2)  DEFAULT 0.00,
    fecha           DATE           DEFAULT '2025-01-01',
    estado          ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_insumo)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Inventarios 
-- -----------------------------------------------------

CREATE TABLE Inventarios(
    id_insumo                   INT                        NOT NULL,
    cantidadActual              DECIMAL(10, 3)             DEFAULT 0.000,
    nivelMinimoAlerta           DECIMAL(10, 3)             DEFAULT 0.000,
    stockMaximo                 DECIMAL(10, 3)             DEFAULT 999.999,
    fechaUltimaActualizacion    DATE                       DEFAULT '2025-01-01',
    estado                      ENUM('Agotado', 'Critico', 'Normal')    NOT NULL DEFAULT 'Normal',
    PRIMARY KEY (id_insumo)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: ItemsRecetas 
-- -----------------------------------------------------

CREATE TABLE ItemsRecetas(
    idItemReceta          INT               AUTO_INCREMENT,
    id_receta             BINARY(16)        NOT NULL,
    id_insumo             INT               NOT NULL,
    cantidadPorPorcion    DECIMAL(10, 3)    NOT NULL,
    unidadPorPorcion ENUM(
    'Gramo', 'Kilogramo', 'Mililitro', 'Litro', 'Unidad', 'Pizca', 'Cucharadita', 'Cucharada', 'Taza') NOT NULL DEFAULT 'Unidad';
    PRIMARY KEY (idItemReceta)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: JornadaPlanificada 
-- -----------------------------------------------------

CREATE TABLE JornadaPlanificada(
    id_jornada          BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_planificacion    BINARY(16)                 NOT NULL,
    id_servicio         INT                        NOT NULL,
    diaSemana           ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes')	NOT NULL DEFAULT 'Lunes',
    PRIMARY KEY (id_jornada)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: MovimientosInventarios 
-- -----------------------------------------------------

CREATE TABLE MovimientosInventarios(
    id_movimiento           BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_insumo               INT               NOT NULL,
    id_usuario              BINARY(16)        NOT NULL,
    id_consumo              BINARY(16),
    id_tipoMerma            INT,
    tipoMovimiento          VARCHAR(100)       NOT NULL,
    cantidadMovimiento      DECIMAL(10, 3)    NOT NULL,
    fechaHora               DATETIME          DEFAULT CURRENT_TIMESTAMP,
    comentarioMovimiento    TEXT,
    PRIMARY KEY (id_movimiento)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Parametros 
-- -----------------------------------------------------

CREATE TABLE Parametros(
    id_parametro         INT                        AUTO_INCREMENT,
    nombreParametro      VARCHAR(100)               NOT NULL,
    valor                VARCHAR(100)               NOT NULL,
    tipoParametro        CHAR(10)                   NOT NULL,
    fechaAlta            DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion    DATETIME,
    estado               ENUM('Activo', 'Inactivo')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_parametro)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Pedidos 
-- -----------------------------------------------------

CREATE TABLE Pedidos(
    id_pedido            BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_planificacion     BINARY(16),
    id_usuario           BINARY(16),
    id_estadoPedido      INT                        NOT NULL,
    id_proveedor         BINARY(16)                 NOT NULL,
    fechaEmision         DATE                       DEFAULT '2025-01-01',
    origen               ENUM('Editado', 'Generado', 'Manual')    NOT NULL DEFAULT 'Generado',
    fechaAprobacion      DATE,
    motivoCancelacion    VARCHAR(100),
    PRIMARY KEY (id_pedido)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Permisos 
-- -----------------------------------------------------

CREATE TABLE Permisos(
    id_permiso            INT                        AUTO_INCREMENT,
    nombrePermiso         VARCHAR(100)               NOT NULL,
    descripcionPermiso    VARCHAR(100)               NOT NULL,
    modulo                ENUM('Sin Módulo', 'Asistencias','Auditoria','Consumos','Insumos','Inventarios','Parámetros','Pedidos',
                            'Permisos', 'Personas','Planificación de Menús','Proveedores','Recetas','Reportes','Roles','Seguridad',
                            'Turnos','Usuarios') NOT NULL DEFAULT 'Sin Módulo',
    accion                ENUM('Sin Acción', 'Registrar', 'Modificar', 'Eliminar', 'Buscar', 'Consultar', 'Exportar')    NOT NULL DEFAULT 'Sin Acción',
    fechaAlta             DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion     DATETIME,
    estado                ENUM('Activo', 'Inactivo')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_permiso)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Personas 
-- -----------------------------------------------------

CREATE TABLE Personas(
    id_persona           INT                        AUTO_INCREMENT,
    nombreRol            VARCHAR(100)               NOT NULL,
    nombre               VARCHAR(100)               NOT NULL,
    apellido             VARCHAR(100)               NOT NULL,
    dni                  VARCHAR(100)               NOT NULL,
    fechaNacimiento      DATE                       DEFAULT '2000-01-01',
    genero               ENUM('Masculino', 'Femenina', 'Otros') DEFAULT 'Otros',
    fechaAlta            DATE                       DEFAULT '2025-01-01',
    fechaModificacion    DATE,
    estado               ENUM('Activo', 'Inactivo')	NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_persona)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: PlanificacionMenus 
-- -----------------------------------------------------

CREATE TABLE PlanificacionMenus(
    id_planificacion       BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_usuario             BINARY(16)     NOT NULL,
    fechaInicio            DATE           NOT NULL,
    fechaFin               DATE           NOT NULL,
    comensalesEstimados    INT            DEFAULT 0,
    estado                 ENUM('Activo', 'Pendiente', 'Finalizado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    PRIMARY KEY (id_planificacion)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: PlanificacionServicioReceta 
-- -----------------------------------------------------

CREATE TABLE PlanificacionServicioReceta(
    id_recetaAsignada    BINARY(16)    NOT NULL,
    id_jornada           BINARY(16)    NOT NULL,
    id_receta            BINARY(16)    NOT NULL,
    PRIMARY KEY (id_recetaAsignada)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Proveedores 
-- -----------------------------------------------------

CREATE TABLE Proveedores(
    id_proveedor         BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    razonSocial          VARCHAR(100)     NOT NULL,
    CUIT                 VARCHAR(13)      NOT NULL,
    direccion            VARCHAR(100),
    telefono             VARCHAR(20),
    mail                 VARCHAR(100)     NOT NULL,
    fechaAlta            DATE            DEFAULT '2025-01-01',
    fechaModificacion    DATE,
    estado               ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_proveedor)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: ProveedorInsumo 
-- -----------------------------------------------------

CREATE TABLE ProveedorInsumo(
    id_insumo       INT           NOT NULL,
    id_proveedor    BINARY(16)    NOT NULL,
    calificacion    ENUM('Excelente', 'Bueno', 'Regular', 'Malo') DEFAULT 'Bueno',
    estado          ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_insumo, id_proveedor)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Recetas 
-- -----------------------------------------------------

CREATE TABLE Recetas(
    id_receta        BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    nombreReceta     VARCHAR(100)               NOT NULL,
    instrucciones    TEXT                       NOT NULL,
    unidadSalida     ENUM('Bandeja', 'Gramo', 'Litro', 'Plato', 'Porcion', 'Racion', 'Unidad')    	NOT NULL DEFAULT 'Porcion',
    fechaAlta        DATE                       DEFAULT '2025-01-01',
    estado           ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_receta)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: ReemplazoDocente 
-- -----------------------------------------------------

CREATE TABLE ReemplazoDocente(
    id_reemplazoDocente    BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_persona             INT                        NOT NULL,
    id_docenteTitular      INT                        NOT NULL,
    nombreGrado            VARCHAR(100)               NOT NULL,
    cicloLectivo           DATE                       NOT NULL,
    fechaInicio            DATE                       NOT NULL,
    fechaFin               DATE,
    motivo                 ENUM('Licencia Médica', 'Licencia por Maternidad', 'Licencia Anual', 'Cambio Funciones', 'Renuncia', 'Jubilación', 'Ausencia Prolongada')    NOT NULL,
    estado                 ENUM('Activo', 'Finalizado', 'Programado')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_reemplazoDocente)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Roles 
-- -----------------------------------------------------

CREATE TABLE Roles(
    id_rol                   INT                        AUTO_INCREMENT,
    nombreRol                VARCHAR(100)               NOT NULL,
    descripcionRol           VARCHAR(255)               NOT NULL,
    habilitaCuentaUsuario    ENUM('Si', 'No')    	NOT NULL DEFAULT 'No',
    estado                   ENUM('Activo', 'Inactivo')	NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_rol)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: RolesPermisos 
-- -----------------------------------------------------

CREATE TABLE RolesPermisos(
    id_rolPermiso    INT    AUTO_INCREMENT,
    id_permiso       INT    NOT NULL,
    id_rol           INT    NOT NULL,
    PRIMARY KEY (id_rolPermiso)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Servicios 
-- -----------------------------------------------------

CREATE TABLE Servicios(
    id_servicio           INT                        AUTO_INCREMENT,
    nombre                VARCHAR(100)               NOT NULL,
    descripcion           VARCHAR(100)               NOT NULL,
    fechaAlta             DATE                       DEFAULT '2025-01-01',
    fecha_modificacion    DATE,
    estado                ENUM('Activo', 'Inactivo')	NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_servicio)
)ENGINE=INNODB;


-- -----------------------------------------------------
-- TABLE: ServicioTurno 
-- -----------------------------------------------------

CREATE TABLE ServicioTurno(
    id_turno           INT     NOT NULL,
    id_servicio        INT     NOT NULL,
    fechaAsociacion    DATE    DEFAULT '2025-01-01',
    PRIMARY KEY (id_turno, id_servicio)
)ENGINE=INNODB;


-- -----------------------------------------------------
-- TABLE: TiposMermas 
-- -----------------------------------------------------

CREATE TABLE TiposMermas(
    id_tipoMerma    INT                        AUTO_INCREMENT,
    nombre          VARCHAR(100)               NOT NULL,
    descripcion	    VARCHAR(100)               NOT NULL,
    estado          ENUM('Activo', 'Inactivo')	NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_tipoMerma)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Turnos 
-- -----------------------------------------------------

CREATE TABLE Turnos(
    id_turno             INT                        AUTO_INCREMENT,
    nombre               VARCHAR(16)                NOT NULL,
    horaInicio           TIME                       NOT NULL,
    horaFin              TIME                       NOT NULL,
    fechaAlta            DATE                       DEFAULT '2025-01-01',
    fechaModificacion    DATE,
    estado               ENUM('Activo', 'Inactivo')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_turno)
)ENGINE=INNODB;



-- -----------------------------------------------------
-- TABLE: Usuarios 
-- -----------------------------------------------------

CREATE TABLE Usuarios(
    id_usuario              BINARY(16) DEFAULT(UUID_TO_BIN(UUID()))	NOT NULL,
    id_persona              INT                        NOT NULL,
    nombreUsuario           VARCHAR(100)               NOT NULL,
    contrasenia             VARCHAR(255)               NOT NULL,
    mail                    VARCHAR(100),
    telefono                VARCHAR(20),
    fechaAlta               DATETIME                   DEFAULT CURRENT_TIMESTAMP,
    fechaUltimaActividad    DATETIME,
    estado                  ENUM('Activo', 'Inactivo')    NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (id_usuario)
)ENGINE=INNODB;


-- -----------------------------------------------------
-- Indentifiadores Únicos
-- -----------------------------------------------------

-- 
-- INDEX: Ref2145 
--

CREATE INDEX Ref2145 ON AlumnoGrado(id_persona)
;
-- 
-- INDEX: Ref646 
--

CREATE INDEX Ref646 ON AlumnoGrado(nombreGrado)
;
-- 
-- INDEX: uk_asistencias_unica 
--

CREATE UNIQUE INDEX uk_asistencias_unica ON Asistencias(fecha, id_servicio)
;
-- 
-- INDEX: Ref2688 
--

CREATE INDEX Ref2688 ON Asistencias(id_servicio)
;
-- 
-- INDEX: Ref2492 
--

CREATE INDEX Ref2492 ON Asistencias(id_alumnoGrado)
;
-- 
-- INDEX: Ref251 
--

CREATE INDEX Ref251 ON Auditorias(id_usuario)
;
-- 
-- INDEX: Ref2662 
--

CREATE INDEX Ref2662 ON Consumos(id_servicio)
;
-- 
-- INDEX: Ref2763 
--

CREATE INDEX Ref2763 ON Consumos(id_turno)
;
-- 
-- INDEX: Ref289 
--

CREATE INDEX Ref289 ON Consumos(id_usuario)
;
-- 
-- INDEX: Ref3190 
--

CREATE INDEX Ref3190 ON Consumos(id_jornada)
;
-- 
-- INDEX: uk_detalleconsumo_unico 
--

CREATE UNIQUE INDEX uk_detalleconsumo_unico ON DetalleConsumo(id_consumo, id_insumo)
;
-- 
-- INDEX: Ref1357 
--

CREATE INDEX Ref1357 ON DetalleConsumo(id_insumo)
;
-- 
-- INDEX: Ref1973 
--

CREATE INDEX Ref1973 ON DetalleConsumo(id_consumo)
;
-- 
-- INDEX: uk_detallePedido 
--

CREATE UNIQUE INDEX uk_detallePedido ON DetallePedido(id_pedido, id_insumo)
;
-- 
-- INDEX: Ref1619 
--

CREATE INDEX Ref1619 ON DetallePedido(id_pedido)
;
-- 
-- INDEX: Ref1332 
--

CREATE INDEX Ref1332 ON DetallePedido(id_insumo)
;
-- 
-- INDEX: Ref1581 
--

CREATE INDEX Ref1581 ON DetallePedido(id_proveedor)
;
-- 
-- INDEX: Ref2193 
--

CREATE INDEX Ref2193 ON DocenteGrado(id_persona)
;
-- 
-- INDEX: Ref694 
--

CREATE INDEX Ref694 ON DocenteGrado(nombreGrado)
;
-- 
-- INDEX: uk_estadoPedido 
--

CREATE UNIQUE INDEX uk_estadoPedido ON EstadoPedido(nombreEstado)
;
-- 
-- INDEX: uk_grados_nombre 
--

CREATE UNIQUE INDEX uk_grados_nombre ON Grados(nombreGrado)
;
-- 
-- INDEX: Ref2761 
--

CREATE INDEX Ref2761 ON Grados(id_turno)
;
-- 
-- INDEX: uk_insumos 
--

CREATE UNIQUE INDEX uk_insumos ON Insumos(nombreInsumo)
;
-- 
-- INDEX: uk_inventarios_insumo 
--

CREATE UNIQUE INDEX uk_inventarios_insumo ON Inventarios(id_insumo)
;
-- 
-- INDEX: Ref1334 
--

CREATE INDEX Ref1334 ON Inventarios(id_insumo)
;
-- 
-- INDEX: uk_itemsrecetas 
--

CREATE UNIQUE INDEX uk_itemsrecetas ON ItemsRecetas(id_receta, id_insumo)
;
-- 
-- INDEX: Ref1333 
--

CREATE INDEX Ref1333 ON ItemsRecetas(id_insumo)
;
-- 
-- INDEX: Ref513 
--

CREATE INDEX Ref513 ON ItemsRecetas(id_receta)
;
-- 
-- INDEX: uk_jornada 
--

CREATE UNIQUE INDEX uk_jornada ON JornadaPlanificada(id_planificacion, id_servicio, diaSemana)
;
-- 
-- INDEX: Ref1284 
--

CREATE INDEX Ref1284 ON JornadaPlanificada(id_planificacion)
;
-- 
-- INDEX: Ref2686 
--

CREATE INDEX Ref2686 ON JornadaPlanificada(id_servicio)
;
-- 
-- INDEX: Ref1944 
--

CREATE INDEX Ref1944 ON MovimientosInventarios(id_consumo)
;
-- 
-- INDEX: Ref871 
--

CREATE INDEX Ref871 ON MovimientosInventarios(id_insumo)
;
-- 
-- INDEX: Ref272 
--

CREATE INDEX Ref272 ON MovimientosInventarios(id_usuario)
;
-- 
-- INDEX: Ref2977 
--

CREATE INDEX Ref2977 ON MovimientosInventarios(id_tipoMerma)
;
-- 
-- INDEX: uk_parametro 
--

CREATE UNIQUE INDEX uk_parametro ON Parametros(nombreParametro)
;
-- 
-- INDEX: Ref1576 
--

CREATE INDEX Ref1576 ON Pedidos(id_proveedor)
;
-- 
-- INDEX: Ref3078 
--

CREATE INDEX Ref3078 ON Pedidos(id_estadoPedido)
;
-- 
-- INDEX: Ref279 
--

CREATE INDEX Ref279 ON Pedidos(id_usuario)
;
-- 
-- INDEX: Ref1280 
--

CREATE INDEX Ref1280 ON Pedidos(id_planificacion)
;
-- 
-- INDEX: uk_permiso 
--

CREATE UNIQUE INDEX uk_permiso ON Permisos(nombrePermiso, modulo, accion)
;
-- 
-- INDEX: uk_personas_dni 
--

CREATE UNIQUE INDEX uk_personas_dni ON Personas(dni)
;
-- 
-- INDEX: uk_persona_users 
--

CREATE UNIQUE INDEX uk_persona_users ON Personas(id_persona)
;
-- 
-- INDEX: Ref191 
--

CREATE INDEX Ref191 ON Personas(nombreRol)
;
-- 
-- INDEX: uk_planificacion 
--

CREATE UNIQUE INDEX uk_planificacion ON PlanificacionMenus(fechaInicio, fechaFin)
;
-- 
-- INDEX: Ref283 
--

CREATE INDEX Ref283 ON PlanificacionMenus(id_usuario)
;
-- 
-- INDEX: Ref542 
--

CREATE INDEX Ref542 ON PlanificacionServicioReceta(id_receta)
;
-- 
-- INDEX: Ref3185 
--

CREATE INDEX Ref3185 ON PlanificacionServicioReceta(id_jornada)
;
-- 
-- INDEX: uk_proveedores 
--

CREATE UNIQUE INDEX uk_proveedores ON Proveedores(razonSocial, CUIT)
;
-- 
-- INDEX: Ref1554 
--

CREATE INDEX Ref1554 ON ProveedorInsumo(id_proveedor)
;
-- 
-- INDEX: Ref1355 
--

CREATE INDEX Ref1355 ON ProveedorInsumo(id_insumo)
;
-- 
-- INDEX: uk_receta 
--

CREATE UNIQUE INDEX uk_receta ON Recetas(nombreReceta)
;
-- 
-- INDEX: Ref2682 
--

CREATE INDEX Ref3295 ON ReemplazoDocente(nombreGrado, id_docenteTitular, id_persona)
;
-- 
-- INDEX: Ref2196 
--

CREATE INDEX Ref2196 ON ReemplazoDocente(id_persona)
;
-- 
-- INDEX: uk_rol_nombre 
--

CREATE UNIQUE INDEX uk_rol_nombre ON Roles(nombreRol)
;
-- 
-- INDEX: uk_rolPermiso 
--

CREATE UNIQUE INDEX uk_rolPermiso ON RolesPermisos(id_permiso, id_rol)
;
-- 
-- INDEX: Ref1053 
--

CREATE INDEX Ref1053 ON RolesPermisos(id_permiso)
;
-- 
-- INDEX: Ref15 
--

CREATE INDEX Ref15 ON RolesPermisos(id_rol)
;
-- 
-- INDEX: uk_servicio 
--

CREATE UNIQUE INDEX uk_servicio ON Servicios(nombre)
;
-- 
-- INDEX: Ref2658 
--

CREATE INDEX Ref2658 ON ServicioTurno(id_servicio)
;
-- 
-- INDEX: Ref2759 
--

CREATE INDEX Ref2759 ON ServicioTurno(id_turno)
;
-- 
-- INDEX: uk_merma 
--

CREATE UNIQUE INDEX uk_merma ON TiposMermas(nombre)
;
-- 
-- INDEX: ul_turno 
--

CREATE UNIQUE INDEX ul_turno ON Turnos(nombre)
;
-- 
-- INDEX: uk_usuarios_nombre 
--

CREATE UNIQUE INDEX uk_usuarios_nombre ON Usuarios(nombreUsuario)
;
-- 
-- INDEX: uk_usuario_mail 
--

CREATE UNIQUE INDEX uk_usuario_mail ON Usuarios(mail)
;
-- 
-- INDEX: Ref2169 
--

CREATE INDEX Ref2169 ON Usuarios(id_persona)
;
-- 
-- 
-- TABLE: AlumnoGrado 
--

ALTER TABLE AlumnoGrado ADD CONSTRAINT RefPersonas454 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
;

ALTER TABLE AlumnoGrado ADD CONSTRAINT RefGrados464 
    FOREIGN KEY (nombreGrado)
    REFERENCES Grados(nombreGrado)
;


-- 
-- TABLE: Asistencias 
--

ALTER TABLE Asistencias ADD CONSTRAINT RefServicios884 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
;

ALTER TABLE Asistencias ADD CONSTRAINT RefAlumnoGrado924 
    FOREIGN KEY (id_alumnoGrado)
    REFERENCES AlumnoGrado(id_alumnoGrado)
;


-- 
-- TABLE: RegistrosAsistencias 
--

ALTER TABLE RegistrosAsistencias ADD CONSTRAINT RefServicios934 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
;

ALTER TABLE RegistrosAsistencias ADD CONSTRAINT RefGrados944 
    FOREIGN KEY (id_grado)
    REFERENCES Grados(id_grado)
;


-- 
-- TABLE: Auditorias 
--

ALTER TABLE Auditorias ADD CONSTRAINT RefUsuarios514 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
;


-- 
-- TABLE: Consumos 
--

ALTER TABLE Consumos ADD CONSTRAINT RefServicios624 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
;

ALTER TABLE Consumos ADD CONSTRAINT RefTurnos634 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
;

ALTER TABLE Consumos ADD CONSTRAINT RefUsuarios894 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
;

ALTER TABLE Consumos ADD CONSTRAINT RefJornadaPlanificada904 
    FOREIGN KEY (id_jornada)
    REFERENCES JornadaPlanificada(id_jornada)
;


-- 
-- TABLE: DetalleConsumo 
--

ALTER TABLE DetalleConsumo ADD CONSTRAINT RefInsumos574 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
;

ALTER TABLE DetalleConsumo ADD CONSTRAINT RefConsumos734 
    FOREIGN KEY (id_consumo)
    REFERENCES Consumos(id_consumo)
;


-- 
-- TABLE: DetallePedido 
--

ALTER TABLE DetallePedido ADD CONSTRAINT RefPedidos194 
    FOREIGN KEY (id_pedido)
    REFERENCES Pedidos(id_pedido)
;

ALTER TABLE DetallePedido ADD CONSTRAINT RefInsumos324 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
;

ALTER TABLE DetallePedido ADD CONSTRAINT RefProveedores814 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
;


-- 
-- TABLE: DocenteGrado 
--

ALTER TABLE DocenteGrado ADD CONSTRAINT RefPersonas934 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
;

ALTER TABLE DocenteGrado ADD CONSTRAINT RefGrados944 
    FOREIGN KEY (nombreGrado)
    REFERENCES Grados(nombreGrado)
;


-- 
-- TABLE: Grados 
--

ALTER TABLE Grados ADD CONSTRAINT RefTurnos614 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
;


-- 
-- TABLE: Inventarios 
--

ALTER TABLE Inventarios ADD CONSTRAINT RefInsumos344 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
;


-- 
-- TABLE: ItemsRecetas 
--

ALTER TABLE ItemsRecetas ADD CONSTRAINT RefInsumos334 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
;

ALTER TABLE ItemsRecetas ADD CONSTRAINT RefRecetas134 
    FOREIGN KEY (id_receta)
    REFERENCES Recetas(id_receta)
;


-- 
-- TABLE: JornadaPlanificada 
--

ALTER TABLE JornadaPlanificada ADD CONSTRAINT RefPlanificacionMenus844 
    FOREIGN KEY (id_planificacion)
    REFERENCES PlanificacionMenus(id_planificacion)
;

ALTER TABLE JornadaPlanificada ADD CONSTRAINT RefServicios864 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
;


-- 
-- TABLE: MovimientosInventarios 
--

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefConsumos444 
    FOREIGN KEY (id_consumo)
    REFERENCES Consumos(id_consumo)
;

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefInventarios714 
    FOREIGN KEY (id_insumo)
    REFERENCES Inventarios(id_insumo)
;

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefUsuarios724 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
;

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefTiposMermas774 
    FOREIGN KEY (id_tipoMerma)
    REFERENCES TiposMermas(id_tipoMerma)
;


-- 
-- TABLE: Pedidos 
--

ALTER TABLE Pedidos ADD CONSTRAINT RefProveedores764 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
;

ALTER TABLE Pedidos ADD CONSTRAINT RefEstadoPedido784 
    FOREIGN KEY (id_estadoPedido)
    REFERENCES EstadoPedido(id_estadoPedido)
;

ALTER TABLE Pedidos ADD CONSTRAINT RefUsuarios794 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
;

ALTER TABLE Pedidos ADD CONSTRAINT RefPlanificacionMenus804 
    FOREIGN KEY (id_planificacion)
    REFERENCES PlanificacionMenus(id_planificacion)
;


-- 
-- TABLE: Personas 
--

ALTER TABLE Personas ADD CONSTRAINT RefRoles914 
    FOREIGN KEY (nombreRol)
    REFERENCES Roles(nombreRol)
;


-- 
-- TABLE: PlanificacionMenus 
--

ALTER TABLE PlanificacionMenus ADD CONSTRAINT RefUsuarios834 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
;


-- 
-- TABLE: PlanificacionServicioReceta 
--

ALTER TABLE PlanificacionServicioReceta ADD CONSTRAINT RefRecetas424 
    FOREIGN KEY (id_receta)
    REFERENCES Recetas(id_receta)
;

ALTER TABLE PlanificacionServicioReceta ADD CONSTRAINT RefJornadaPlanificada854 
    FOREIGN KEY (id_jornada)
    REFERENCES JornadaPlanificada(id_jornada)
;


-- 
-- TABLE: ProveedorInsumo 
--

ALTER TABLE ProveedorInsumo ADD CONSTRAINT RefProveedores544 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
;

ALTER TABLE ProveedorInsumo ADD CONSTRAINT RefInsumos554 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
;


-- 
-- TABLE: ReemplazoDocente 
--

ALTER TABLE ReemplazoDocente ADD CONSTRAINT RefDocenteGrado954 
    FOREIGN KEY (id_docenteTitular, id_persona, nombreGrado)
    REFERENCES DocenteGrado(id_docenteTitular, id_persona, nombreGrado)
;

ALTER TABLE ReemplazoDocente ADD CONSTRAINT RefPersonas964 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
;


-- 
-- TABLE: RolesPermisos 
--

ALTER TABLE RolesPermisos ADD CONSTRAINT RefPermisos534 
    FOREIGN KEY (id_permiso)
    REFERENCES Permisos(id_permiso)
;

ALTER TABLE RolesPermisos ADD CONSTRAINT RefRoles54 
    FOREIGN KEY (id_rol)
    REFERENCES Roles(id_rol)
;


-- 
-- TABLE: ServicioTurno 
--

ALTER TABLE ServicioTurno ADD CONSTRAINT RefServicios584 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
;

ALTER TABLE ServicioTurno ADD CONSTRAINT RefTurnos594 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
;


-- 
-- TABLE: Usuarios 
--

ALTER TABLE Usuarios ADD CONSTRAINT RefPersonas694 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
;


