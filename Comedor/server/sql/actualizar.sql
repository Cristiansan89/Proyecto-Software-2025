-- =====================================================
-- SCRIPT DE ACTUALIZACIÓN DE FOREIGN KEYS
-- Base de Datos: Comedor
-- Fecha: 2026-03-16
-- Propósito: Actualizar todas las Foreign Keys con
--           políticas de integridad referencial
-- =====================================================

-- =========== PASO 1: DESACTIVAR RESTRICCIONES ===========
SET FOREIGN_KEY_CHECKS = 0;

-- =========== PASO 2: ELIMINAR CONSTRAINTS ANTIGUOS ===========

-- AlumnoGrado
ALTER TABLE AlumnoGrado DROP FOREIGN KEY RefPersonas454;
ALTER TABLE AlumnoGrado DROP FOREIGN KEY RefGrados464;

-- Asistencias
ALTER TABLE Asistencias DROP FOREIGN KEY RefServicios884;
ALTER TABLE Asistencias DROP FOREIGN KEY RefAlumnoGrado924;

-- RegistrosAsistencias
ALTER TABLE RegistrosAsistencias DROP FOREIGN KEY RefServicios934;
ALTER TABLE RegistrosAsistencias DROP FOREIGN KEY RefGrados944;

-- Auditorias
ALTER TABLE Auditorias DROP FOREIGN KEY RefUsuarios514;

-- Consumos
ALTER TABLE Consumos DROP FOREIGN KEY RefServicios624;
ALTER TABLE Consumos DROP FOREIGN KEY RefTurnos634;
ALTER TABLE Consumos DROP FOREIGN KEY RefUsuarios894;
ALTER TABLE Consumos DROP FOREIGN KEY RefJornadaPlanificada904;

-- DetalleConsumo
ALTER TABLE DetalleConsumo DROP FOREIGN KEY RefInsumos574;
ALTER TABLE DetalleConsumo DROP FOREIGN KEY RefConsumos734;
ALTER TABLE DetalleConsumo DROP FOREIGN KEY RefItemsRecetas;

-- DetallePedido
ALTER TABLE DetallePedido DROP FOREIGN KEY RefPedidos194;
ALTER TABLE DetallePedido DROP FOREIGN KEY RefInsumos324;
ALTER TABLE DetallePedido DROP FOREIGN KEY RefProveedores814;

-- DocenteGrado
ALTER TABLE DocenteGrado DROP FOREIGN KEY RefPersonas934;
ALTER TABLE DocenteGrado DROP FOREIGN KEY RefGrados945;

-- Grados
ALTER TABLE Grados DROP FOREIGN KEY RefTurnos614;

-- Inventarios
ALTER TABLE Inventarios DROP FOREIGN KEY RefInsumos344;

-- ItemsRecetas
ALTER TABLE ItemsRecetas DROP FOREIGN KEY RefInsumos334;
ALTER TABLE ItemsRecetas DROP FOREIGN KEY RefRecetas134;

-- RecetaServicio
ALTER TABLE RecetaServicio DROP FOREIGN KEY RefRecetasServicio;
ALTER TABLE RecetaServicio DROP FOREIGN KEY RefServiciosReceta;

-- JornadaPlanificada
ALTER TABLE JornadaPlanificada DROP FOREIGN KEY RefPlanificacionMenus844;
ALTER TABLE JornadaPlanificada DROP FOREIGN KEY RefServicios864;

-- MovimientosInventarios
ALTER TABLE MovimientosInventarios DROP FOREIGN KEY RefConsumos444;
ALTER TABLE MovimientosInventarios DROP FOREIGN KEY RefInventarios714;
ALTER TABLE MovimientosInventarios DROP FOREIGN KEY RefUsuarios724;
ALTER TABLE MovimientosInventarios DROP FOREIGN KEY RefTiposMermas774;

-- Pedidos
ALTER TABLE Pedidos DROP FOREIGN KEY RefProveedores764;
ALTER TABLE Pedidos DROP FOREIGN KEY RefEstadoPedido784;
ALTER TABLE Pedidos DROP FOREIGN KEY RefUsuarios794;
ALTER TABLE Pedidos DROP FOREIGN KEY RefPlanificacionMenus804;

-- Personas
ALTER TABLE Personas DROP FOREIGN KEY RefRoles914;

-- PlanificacionMenus
ALTER TABLE PlanificacionMenus DROP FOREIGN KEY RefUsuarios834;

-- RecetaJornada
ALTER TABLE RecetaJornada DROP FOREIGN KEY RefRecetas424;
ALTER TABLE RecetaJornada DROP FOREIGN KEY RefJornadaPlanificada854;

-- ProveedorInsumo
ALTER TABLE ProveedorInsumo DROP FOREIGN KEY RefProveedores544;
ALTER TABLE ProveedorInsumo DROP FOREIGN KEY RefInsumos554;

-- ReemplazoDocente
ALTER TABLE ReemplazoDocente DROP FOREIGN KEY RefPersonas964;

-- RolesPermisos
ALTER TABLE RolesPermisos DROP FOREIGN KEY RefPermisos534;
ALTER TABLE RolesPermisos DROP FOREIGN KEY RefRoles54;

-- ServicioTurno
ALTER TABLE ServicioTurno DROP FOREIGN KEY RefServicios584;
ALTER TABLE ServicioTurno DROP FOREIGN KEY RefTurnos594;

-- Usuarios
ALTER TABLE Usuarios DROP FOREIGN KEY RefPersonas694;
ALTER TABLE Usuarios DROP FOREIGN KEY RefProveedores895;

-- =========== PASO 3: AGREGAR NUEVOS CONSTRAINTS ===========

-- *** PROTECCIÓN MÁXIMA: ON DELETE RESTRICT ***

-- AlumnoGrado - Proteger Personas y Grados
ALTER TABLE AlumnoGrado ADD CONSTRAINT RefPersonas454 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE AlumnoGrado ADD CONSTRAINT RefGrados464 
    FOREIGN KEY (nombreGrado)
    REFERENCES Grados(nombreGrado)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Asistencias - Proteger Servicios y Alumnos
ALTER TABLE Asistencias ADD CONSTRAINT RefServicios884 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Asistencias ADD CONSTRAINT RefAlumnoGrado924 
    FOREIGN KEY (id_alumnoGrado)
    REFERENCES AlumnoGrado(id_alumnoGrado)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- RegistrosAsistencias - Proteger Servicios y Grados
ALTER TABLE RegistrosAsistencias ADD CONSTRAINT RefServicios934 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE RegistrosAsistencias ADD CONSTRAINT RefGrados944 
    FOREIGN KEY (id_grado)
    REFERENCES Grados(id_grado)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Auditorias - CRÍTICO: Proteger registros de auditoría
ALTER TABLE Auditorias ADD CONSTRAINT RefUsuarios514 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Consumos - Proteger Servicios, Turnos, Usuarios, Jornadas
ALTER TABLE Consumos ADD CONSTRAINT RefServicios624 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Consumos ADD CONSTRAINT RefTurnos634 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Consumos ADD CONSTRAINT RefUsuarios894 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Consumos ADD CONSTRAINT RefJornadaPlanificada904 
    FOREIGN KEY (id_jornada)
    REFERENCES JornadaPlanificada(id_jornada)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- DetalleConsumo - Proteger Insumos, CASCADE del Consumo
ALTER TABLE DetalleConsumo ADD CONSTRAINT RefInsumos574 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE DetalleConsumo ADD CONSTRAINT RefConsumos734 
    FOREIGN KEY (id_consumo)
    REFERENCES Consumos(id_consumo)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ItemReceta opcional - SET NULL
ALTER TABLE DetalleConsumo ADD CONSTRAINT RefItemsRecetas 
    FOREIGN KEY (id_itemReceta)
    REFERENCES ItemsRecetas(id_itemReceta)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- DetallePedido - CASCADE del Pedido, Proteger Insumos y Proveedores
ALTER TABLE DetallePedido ADD CONSTRAINT RefPedidos194 
    FOREIGN KEY (id_pedido)
    REFERENCES Pedidos(id_pedido)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE DetallePedido ADD CONSTRAINT RefInsumos324 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE DetallePedido ADD CONSTRAINT RefProveedores814 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- DocenteGrado - Proteger Personas y Grados
ALTER TABLE DocenteGrado ADD CONSTRAINT RefPersonas934 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE DocenteGrado ADD CONSTRAINT RefGrados945 
    FOREIGN KEY (nombreGrado)
    REFERENCES Grados(nombreGrado)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Grados - Proteger Turnos
ALTER TABLE Grados ADD CONSTRAINT RefTurnos614 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Inventarios - Proteger Insumos
ALTER TABLE Inventarios ADD CONSTRAINT RefInsumos344 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ItemsRecetas - Proteger Insumos y Recetas
ALTER TABLE ItemsRecetas ADD CONSTRAINT RefInsumos334 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE ItemsRecetas ADD CONSTRAINT RefRecetas134 
    FOREIGN KEY (id_receta)
    REFERENCES Recetas(id_receta)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- RecetaServicio - Proteger Recetas y Servicios
ALTER TABLE RecetaServicio ADD CONSTRAINT RefRecetasServicio 
    FOREIGN KEY (id_receta)
    REFERENCES Recetas(id_receta)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE RecetaServicio ADD CONSTRAINT RefServiciosReceta 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- JornadaPlanificada - CASCADE de Planificación, Proteger Servicios
ALTER TABLE JornadaPlanificada ADD CONSTRAINT RefPlanificacionMenus844 
    FOREIGN KEY (id_planificacion)
    REFERENCES PlanificacionMenus(id_planificacion)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE JornadaPlanificada ADD CONSTRAINT RefServicios864 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- MovimientosInventarios - SET NULL para Consumo, Proteger Inventario y Usuario
ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefConsumos444 
    FOREIGN KEY (id_consumo)
    REFERENCES Consumos(id_consumo)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefInventarios714 
    FOREIGN KEY (id_insumo)
    REFERENCES Inventarios(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefUsuarios724 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- TipoMerma opcional - SET NULL
ALTER TABLE MovimientosInventarios ADD CONSTRAINT RefTiposMermas774 
    FOREIGN KEY (id_tipoMerma)
    REFERENCES TiposMermas(id_tipoMerma)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Pedidos - Proteger Proveedores y Estados, SET NULL para Planificación
ALTER TABLE Pedidos ADD CONSTRAINT RefProveedores764 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Pedidos ADD CONSTRAINT RefEstadoPedido784 
    FOREIGN KEY (id_estadoPedido)
    REFERENCES EstadoPedido(id_estadoPedido)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Pedidos ADD CONSTRAINT RefUsuarios794 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Pedidos ADD CONSTRAINT RefPlanificacionMenus804 
    FOREIGN KEY (id_planificacion)
    REFERENCES PlanificacionMenus(id_planificacion)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Personas - Proteger Roles
ALTER TABLE Personas ADD CONSTRAINT RefRoles914 
    FOREIGN KEY (nombreRol)
    REFERENCES Roles(nombreRol)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- PlanificacionMenus - Proteger Usuarios
ALTER TABLE PlanificacionMenus ADD CONSTRAINT RefUsuarios834 
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- RecetaJornada - Proteger Recetas, CASCADE de Jornadas
ALTER TABLE RecetaJornada ADD CONSTRAINT RefRecetas424 
    FOREIGN KEY (id_receta)
    REFERENCES Recetas(id_receta)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE RecetaJornada ADD CONSTRAINT RefJornadaPlanificada854 
    FOREIGN KEY (id_jornada)
    REFERENCES JornadaPlanificada(id_jornada)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ProveedorInsumo - Proteger Proveedores e Insumos
ALTER TABLE ProveedorInsumo ADD CONSTRAINT RefProveedores544 
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE ProveedorInsumo ADD CONSTRAINT RefInsumos554 
    FOREIGN KEY (id_insumo)
    REFERENCES Insumos(id_insumo)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ReemplazoDocente - Proteger Personas
ALTER TABLE ReemplazoDocente ADD CONSTRAINT RefPersonas964 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- RolesPermisos - Proteger Permisos y Roles
ALTER TABLE RolesPermisos ADD CONSTRAINT RefPermisos534 
    FOREIGN KEY (id_permiso)
    REFERENCES Permisos(id_permiso)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE RolesPermisos ADD CONSTRAINT RefRoles54 
    FOREIGN KEY (id_rol)
    REFERENCES Roles(id_rol)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ServicioTurno - Proteger Servicios y Turnos
ALTER TABLE ServicioTurno ADD CONSTRAINT RefServicios584 
    FOREIGN KEY (id_servicio)
    REFERENCES Servicios(id_servicio)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE ServicioTurno ADD CONSTRAINT RefTurnos594 
    FOREIGN KEY (id_turno)
    REFERENCES Turnos(id_turno)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Usuarios - Proteger Personas y Proveedores
ALTER TABLE Usuarios ADD CONSTRAINT RefPersonas694 
    FOREIGN KEY (id_persona)
    REFERENCES Personas(id_persona)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE Usuarios ADD CONSTRAINT RefProveedores895
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedores(id_proveedor)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- =========== PASO 4: REACTIVAR RESTRICCIONES ===========
SET FOREIGN_KEY_CHECKS = 1;

-- =========== VALIDACIÓN FINAL ===========
SELECT '✅ ACTUALIZACIÓN COMPLETADA' AS Estado;

-- Mostrar todas las foreign keys para verificación
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_SCHEMA = 'Comedor'
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
