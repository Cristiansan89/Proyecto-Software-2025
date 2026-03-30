CREATE DATABASE  IF NOT EXISTS `comedor` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `comedor`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: comedor
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alertasinventario`
--

DROP TABLE IF EXISTS `alertasinventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertasinventario` (
  `id_alerta` int NOT NULL AUTO_INCREMENT,
  `id_insumo` int NOT NULL,
  `tipoAlerta` enum('Critico','Agotado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contadorEnvios` int DEFAULT '0',
  `contadorEnvio` int DEFAULT NULL,
  `estado` enum('activa','resuelta','completada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `fechaPrimeraAlerta` datetime DEFAULT NULL,
  `fechaUltimaAlerta` datetime DEFAULT NULL,
  `fechaResolucion` datetime DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `visto` tinyint(1) DEFAULT '0',
  `fechaVista` datetime DEFAULT NULL,
  PRIMARY KEY (`id_alerta`),
  UNIQUE KEY `id_insumo` (`id_insumo`),
  KEY `idx_id_insumo` (`id_insumo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_ultima_alerta` (`fechaUltimaAlerta`),
  KEY `idx_visto` (`visto`),
  CONSTRAINT `fk_alerta_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alumnogrado`
--

DROP TABLE IF EXISTS `alumnogrado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnogrado` (
  `id_alumnoGrado` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `nombreGrado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cicloLectivo` date DEFAULT '2025-01-01',
  PRIMARY KEY (`id_alumnoGrado`),
  KEY `Ref2145` (`id_persona`),
  KEY `Ref646` (`nombreGrado`),
  CONSTRAINT `RefGrados464` FOREIGN KEY (`nombreGrado`) REFERENCES `grados` (`nombreGrado`),
  CONSTRAINT `RefPersonas454` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asistencias`
--

DROP TABLE IF EXISTS `asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencias` (
  `id_asistencia` int NOT NULL AUTO_INCREMENT,
  `id_servicio` int NOT NULL,
  `id_alumnoGrado` int NOT NULL,
  `fecha` date DEFAULT '2025-01-01',
  `tipoAsistencia` enum('Si','No','Ausente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No',
  `estado` enum('Pendiente','Completado','Cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `uk_asistencias_unica` (`fecha`,`id_servicio`,`id_alumnoGrado`),
  KEY `Ref2688` (`id_servicio`),
  KEY `Ref2492` (`id_alumnoGrado`),
  CONSTRAINT `RefAlumnoGrado924` FOREIGN KEY (`id_alumnoGrado`) REFERENCES `alumnogrado` (`id_alumnoGrado`),
  CONSTRAINT `RefServicios884` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=361 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auditalertas`
--

DROP TABLE IF EXISTS `auditalertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditalertas` (
  `id_auditoria` int NOT NULL AUTO_INCREMENT,
  `id_alerta` int NOT NULL,
  `id_insumo` int NOT NULL,
  `numeroEnvio` int DEFAULT NULL,
  `canalEnvio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensajeEnviado` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estadoEnvio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fechaEnvio` datetime DEFAULT NULL,
  `respuestaSistema` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_id_alerta` (`id_alerta`),
  KEY `idx_id_insumo` (`id_insumo`),
  KEY `idx_fecha_envio` (`fechaEnvio`),
  CONSTRAINT `fk_auditoria_alerta` FOREIGN KEY (`id_alerta`) REFERENCES `alertasinventario` (`id_alerta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auditorias`
--

DROP TABLE IF EXISTS `auditorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditorias` (
  `id_registro` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_usuario` binary(16) NOT NULL,
  `fechaHora` datetime DEFAULT CURRENT_TIMESTAMP,
  `modulo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipoAccion` enum('---','Registrar','Modificar','Eliminar','Buscar','Consultar','Exportar','Login','Logout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '---',
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('---','Exito','Error','Advertencia') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '---',
  `nombreReporte` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipoReporte` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detallesReporte` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_anterior` longtext COLLATE utf8mb4_unicode_ci,
  `valor_nuevo` longtext COLLATE utf8mb4_unicode_ci,
  `id_registro_afectado` int DEFAULT NULL COMMENT 'ID numérico del registro afectado (para integers)',
  `id_registro_afectado_uuid` binary(16) DEFAULT NULL COMMENT 'UUID del registro afectado',
  `nivel_criticidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultado_accion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_registro`),
  KEY `Ref251` (`id_usuario`),
  KEY `idx_id_registro_afectado_uuid` (`id_registro_afectado_uuid`),
  KEY `idx_id_registro_afectado_int` (`id_registro_afectado`),
  CONSTRAINT `RefUsuarios514` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracionserviciosautomaticos`
--

DROP TABLE IF EXISTS `configuracionserviciosautomaticos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracionserviciosautomaticos` (
  `id_configuracion` int NOT NULL AUTO_INCREMENT,
  `id_servicio` int NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time NOT NULL,
  `procesarAutomaticamente` tinyint(1) DEFAULT '1',
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_configuracion`),
  UNIQUE KEY `unique_servicio` (`id_servicio`),
  CONSTRAINT `ConfiguracionServiciosAutomaticos_ibfk_1` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumos`
--

DROP TABLE IF EXISTS `consumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumos` (
  `id_consumo` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_jornada` binary(16) NOT NULL,
  `id_servicio` int NOT NULL,
  `id_turno` int NOT NULL,
  `id_usuario` binary(16) NOT NULL,
  `fecha` date DEFAULT '2025-01-01',
  `origenCalculo` enum('Calculado','Manual','Validado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Calculado',
  `fechaHoraGeneracion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_consumo`),
  KEY `Ref2662` (`id_servicio`),
  KEY `Ref2763` (`id_turno`),
  KEY `Ref289` (`id_usuario`),
  KEY `Ref3190` (`id_jornada`),
  CONSTRAINT `RefJornadaPlanificada904` FOREIGN KEY (`id_jornada`) REFERENCES `jornadaplanificada` (`id_jornada`),
  CONSTRAINT `RefServicios624` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`),
  CONSTRAINT `RefTurnos634` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`),
  CONSTRAINT `RefUsuarios894` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalleconsumo`
--

DROP TABLE IF EXISTS `detalleconsumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalleconsumo` (
  `id_detalleConsumo` int NOT NULL AUTO_INCREMENT,
  `id_consumo` binary(16) NOT NULL,
  `id_insumo` int NOT NULL,
  `id_itemReceta` int DEFAULT NULL,
  `cantidadUtilizada` decimal(10,3) NOT NULL,
  `cantidadCalculada` decimal(10,3) NOT NULL,
  `unidadMedida` enum('gramo','gramos','kilogramo','kilogramos','mililitro','mililitros','litro','litros','unidad','unidades') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unidad',
  PRIMARY KEY (`id_detalleConsumo`),
  UNIQUE KEY `uk_detalleconsumo_unico` (`id_consumo`,`id_insumo`),
  KEY `RefItemsRecetas` (`id_itemReceta`),
  KEY `Ref1357` (`id_insumo`),
  KEY `Ref1973` (`id_consumo`),
  CONSTRAINT `RefConsumos734` FOREIGN KEY (`id_consumo`) REFERENCES `consumos` (`id_consumo`),
  CONSTRAINT `RefInsumos574` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`),
  CONSTRAINT `RefItemsRecetas` FOREIGN KEY (`id_itemReceta`) REFERENCES `itemsrecetas` (`id_itemReceta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detallepedido`
--

DROP TABLE IF EXISTS `detallepedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallepedido` (
  `id_detallePedido` int NOT NULL AUTO_INCREMENT,
  `id_pedido` binary(16) NOT NULL,
  `id_proveedor` binary(16) NOT NULL,
  `id_insumo` int NOT NULL,
  `cantidadSolicitada` decimal(10,3) NOT NULL,
  `estadoConfirmacion` enum('Pendiente','Disponible','No Disponible') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `fechaConfirmacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_detallePedido`),
  UNIQUE KEY `uk_detallePedido` (`id_pedido`,`id_insumo`),
  KEY `Ref1619` (`id_pedido`),
  KEY `Ref1332` (`id_insumo`),
  KEY `Ref1581` (`id_proveedor`),
  CONSTRAINT `RefInsumos324` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`),
  CONSTRAINT `RefPedidos194` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `RefProveedores814` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docenteconfiguraciontelegram`
--

DROP TABLE IF EXISTS `docenteconfiguraciontelegram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docenteconfiguraciontelegram` (
  `id_configDocente` int NOT NULL AUTO_INCREMENT,
  `id_docenteTitular` int NOT NULL,
  `telegramChatId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramUsuario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notificacionesTelegram` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Inactivo',
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_configDocente`),
  UNIQUE KEY `id_docenteTitular` (`id_docenteTitular`),
  CONSTRAINT `docenteconfiguraciontelegram_ibfk_1` FOREIGN KEY (`id_docenteTitular`) REFERENCES `docentegrado` (`id_docenteTitular`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docentegrado`
--

DROP TABLE IF EXISTS `docentegrado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docentegrado` (
  `id_docenteTitular` int NOT NULL,
  `id_persona` int NOT NULL,
  `nombreGrado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaAsignado` date DEFAULT '2025-01-01',
  `cicloLectivo` date DEFAULT '2025-01-01',
  PRIMARY KEY (`id_docenteTitular`,`id_persona`,`nombreGrado`),
  KEY `Ref2193` (`id_persona`),
  KEY `Ref694` (`nombreGrado`),
  CONSTRAINT `RefGrados945` FOREIGN KEY (`nombreGrado`) REFERENCES `grados` (`nombreGrado`),
  CONSTRAINT `RefPersonas934` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emailsenviados`
--

DROP TABLE IF EXISTS `emailsenviados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailsenviados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pedido` binary(16) NOT NULL,
  `id_proveedor` binary(16) NOT NULL,
  `emailDestinatario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asunto` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enlaceConfirmacion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fechaEnvio` timestamp NULL DEFAULT NULL,
  `estado` enum('Pendiente','Enviado','Fallido','Simulado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `fechaLectura` timestamp NULL DEFAULT NULL,
  `intentos` int DEFAULT '0',
  `ultimoIntento` timestamp NULL DEFAULT NULL,
  `errorMensaje` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_id_pedido` (`id_pedido`),
  KEY `idx_id_proveedor` (`id_proveedor`),
  KEY `idx_email` (`emailDestinatario`),
  KEY `idx_fecha_envio` (`fechaEnvio`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_email_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_email_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `estadopedido`
--

DROP TABLE IF EXISTS `estadopedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadopedido` (
  `id_estadoPedido` int NOT NULL AUTO_INCREMENT,
  `nombreEstado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_estadoPedido`),
  UNIQUE KEY `uk_estadoPedido` (`nombreEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grados`
--

DROP TABLE IF EXISTS `grados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grados` (
  `id_grado` int NOT NULL AUTO_INCREMENT,
  `id_turno` int NOT NULL,
  `nombreGrado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_grado`),
  UNIQUE KEY `uk_grados_nombre` (`nombreGrado`),
  KEY `Ref2761` (`id_turno`),
  CONSTRAINT `RefTurnos614` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `nombreInsumo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unidadMedida` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` enum('Carnes','Lacteos','Cereales','Verduras','Frutas','Legumbres','Condimentos','Bebidas','Enlatados','Conservas','Limpieza','Descartables','Otros') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Otros',
  `stockMinimo` decimal(10,3) NOT NULL DEFAULT '0.000',
  `fecha` date DEFAULT '2025-01-01',
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_insumo`),
  UNIQUE KEY `uk_insumos` (`nombreInsumo`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventarios`
--

DROP TABLE IF EXISTS `inventarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventarios` (
  `id_insumo` int NOT NULL,
  `cantidadActual` decimal(10,3) NOT NULL,
  `nivelMinimoAlerta` decimal(10,3) NOT NULL,
  `stockMaximo` decimal(10,3) NOT NULL,
  `fechaUltimaActualizacion` date DEFAULT '2025-01-01',
  `estado` enum('Agotado','Critico','Normal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  PRIMARY KEY (`id_insumo`),
  UNIQUE KEY `uk_inventarios_insumo` (`id_insumo`),
  KEY `Ref1334` (`id_insumo`),
  CONSTRAINT `RefInsumos344` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itemsrecetas`
--

DROP TABLE IF EXISTS `itemsrecetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemsrecetas` (
  `id_itemReceta` int NOT NULL AUTO_INCREMENT,
  `id_receta` binary(16) NOT NULL,
  `id_insumo` int NOT NULL,
  `cantidadPorPorcion` decimal(10,3) NOT NULL DEFAULT '0.000',
  `unidadPorPorcion` enum('gramo','gramos','kilogramo','kilogramos','mililitro','mililitros','litro','litros','unidad','unidades') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unidad',
  PRIMARY KEY (`id_itemReceta`),
  UNIQUE KEY `uk_itemsrecetas` (`id_receta`,`id_insumo`),
  KEY `Ref1333` (`id_insumo`),
  KEY `Ref513` (`id_receta`),
  CONSTRAINT `RefInsumos334` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`),
  CONSTRAINT `RefRecetas134` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id_receta`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jornadaplanificada`
--

DROP TABLE IF EXISTS `jornadaplanificada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jornadaplanificada` (
  `id_jornada` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_planificacion` binary(16) NOT NULL,
  `id_servicio` int NOT NULL,
  `diaSemana` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Lunes',
  PRIMARY KEY (`id_jornada`),
  UNIQUE KEY `uk_jornada` (`id_planificacion`,`id_servicio`,`diaSemana`),
  KEY `Ref1284` (`id_planificacion`),
  KEY `Ref2686` (`id_servicio`),
  CONSTRAINT `RefPlanificacionMenus844` FOREIGN KEY (`id_planificacion`) REFERENCES `planificacionmenus` (`id_planificacion`),
  CONSTRAINT `RefServicios864` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientosinventarios`
--

DROP TABLE IF EXISTS `movimientosinventarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientosinventarios` (
  `id_movimiento` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_insumo` int NOT NULL,
  `id_usuario` binary(16) NOT NULL,
  `id_consumo` binary(16) DEFAULT NULL,
  `id_tipoMerma` int DEFAULT NULL,
  `tipoMovimiento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidadMovimiento` decimal(10,3) NOT NULL,
  `fechaHora` datetime DEFAULT CURRENT_TIMESTAMP,
  `comentarioMovimiento` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_movimiento`),
  KEY `Ref1944` (`id_consumo`),
  KEY `Ref871` (`id_insumo`),
  KEY `Ref272` (`id_usuario`),
  KEY `Ref2977` (`id_tipoMerma`),
  CONSTRAINT `RefConsumos444` FOREIGN KEY (`id_consumo`) REFERENCES `consumos` (`id_consumo`),
  CONSTRAINT `RefInventarios714` FOREIGN KEY (`id_insumo`) REFERENCES `inventarios` (`id_insumo`),
  CONSTRAINT `RefTiposMermas774` FOREIGN KEY (`id_tipoMerma`) REFERENCES `tiposmermas` (`id_tipoMerma`),
  CONSTRAINT `RefUsuarios724` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parametros`
--

DROP TABLE IF EXISTS `parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametros` (
  `id_parametro` int NOT NULL AUTO_INCREMENT,
  `nombreParametro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipoParametro` char(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaAlta` datetime DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion` datetime DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_parametro`),
  UNIQUE KEY `uk_parametro` (`nombreParametro`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_planificacion` binary(16) DEFAULT NULL,
  `id_usuario` binary(16) DEFAULT NULL,
  `id_estadoPedido` int NOT NULL,
  `id_proveedor` binary(16) NOT NULL,
  `fechaEmision` datetime NOT NULL,
  `origen` enum('Editado','Generado','Manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Generado',
  `fechaAprobacion` datetime DEFAULT NULL,
  `fechaConfirmacion` datetime DEFAULT NULL,
  `motivoCancelacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `Ref1576` (`id_proveedor`),
  KEY `Ref3078` (`id_estadoPedido`),
  KEY `Ref279` (`id_usuario`),
  KEY `Ref1280` (`id_planificacion`),
  CONSTRAINT `RefEstadoPedido784` FOREIGN KEY (`id_estadoPedido`) REFERENCES `estadopedido` (`id_estadoPedido`),
  CONSTRAINT `RefPlanificacionMenus804` FOREIGN KEY (`id_planificacion`) REFERENCES `planificacionmenus` (`id_planificacion`),
  CONSTRAINT `RefProveedores764` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  CONSTRAINT `RefUsuarios794` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id_permiso` int NOT NULL AUTO_INCREMENT,
  `nombrePermiso` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcionPermiso` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modulo` enum('Sin Módulo','Asistencias','Auditoria','Configuración del Sistema','Consumos','Estadística','Grados','PersonasGrados','Insumos','Inventarios','Menú del Día','Parámetros','Pedidos','Permisos','Personas','Planificación de Menús','Proveedores','Recetas','Reportes','Roles','Seguridad','Usuarios') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sin Módulo',
  `accion` enum('Sin AcciÃ³n','Registrar','Modificar','Eliminar','Buscar','Consultar','Exportar') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sin AcciÃ³n',
  `fechaAlta` datetime DEFAULT CURRENT_TIMESTAMP,
  `fechaModificacion` datetime DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `uk_permiso` (`nombrePermiso`,`modulo`,`accion`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id_persona` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dni` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaNacimiento` date DEFAULT '2000-01-01',
  `genero` enum('Masculino','Femenina','Otros') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Otros',
  `fechaAlta` date DEFAULT '2025-01-01',
  `fechaModificacion` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `uk_personas_dni` (`dni`),
  UNIQUE KEY `uk_persona_users` (`id_persona`),
  KEY `Ref191` (`nombreRol`),
  CONSTRAINT `RefRoles914` FOREIGN KEY (`nombreRol`) REFERENCES `roles` (`nombreRol`)
) ENGINE=InnoDB AUTO_INCREMENT=249 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planificacionmenus`
--

DROP TABLE IF EXISTS `planificacionmenus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planificacionmenus` (
  `id_planificacion` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_usuario` binary(16) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `comensalesEstimados` int DEFAULT '0',
  `estado` enum('Pendiente','Programado','Activo','Finalizado','Cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id_planificacion`),
  UNIQUE KEY `uk_planificacion` (`fechaInicio`,`fechaFin`),
  KEY `Ref283` (`id_usuario`),
  CONSTRAINT `RefUsuarios834` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedorconfiguraciontelegram`
--

DROP TABLE IF EXISTS `proveedorconfiguraciontelegram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedorconfiguraciontelegram` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `id_proveedor` binary(16) NOT NULL,
  `telegramChatId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegramUsuario` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notificacionesTelegram` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Inactivo',
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_config`),
  UNIQUE KEY `id_proveedor` (`id_proveedor`),
  CONSTRAINT `ProveedorConfiguracionTelegram_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id_proveedor` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `razonSocial` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CUIT` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mail` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaAlta` date DEFAULT '2025-01-01',
  `fechaModificacion` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_proveedor`),
  UNIQUE KEY `uk_proveedores` (`razonSocial`,`CUIT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedorinsumo`
--

DROP TABLE IF EXISTS `proveedorinsumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedorinsumo` (
  `id_insumo` int NOT NULL,
  `id_proveedor` binary(16) NOT NULL,
  `calificacion` enum('Excelente','Bueno','Regular','Malo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Bueno',
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_insumo`,`id_proveedor`),
  KEY `Ref1554` (`id_proveedor`),
  KEY `Ref1355` (`id_insumo`),
  CONSTRAINT `RefInsumos554` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`),
  CONSTRAINT `RefProveedores544` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recetajornada`
--

DROP TABLE IF EXISTS `recetajornada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetajornada` (
  `id_recetaAsignada` binary(16) NOT NULL,
  `id_jornada` binary(16) NOT NULL,
  `id_receta` binary(16) NOT NULL,
  PRIMARY KEY (`id_recetaAsignada`),
  KEY `Ref542` (`id_receta`),
  KEY `Ref3185` (`id_jornada`),
  CONSTRAINT `RefJornadaPlanificada854` FOREIGN KEY (`id_jornada`) REFERENCES `jornadaplanificada` (`id_jornada`),
  CONSTRAINT `RefRecetas424` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id_receta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `id_receta` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `nombreReceta` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `instrucciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidadSalida` enum('Bandeja','Gramo','Litro','Plato','Porcion','Racion','Unidad') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Porcion',
  `fechaAlta` date DEFAULT '2025-01-01',
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_receta`),
  UNIQUE KEY `uk_receta` (`nombreReceta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recetaservicio`
--

DROP TABLE IF EXISTS `recetaservicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetaservicio` (
  `id_receta` binary(16) NOT NULL,
  `id_servicio` int NOT NULL,
  `fechaAsociacion` date DEFAULT (curdate()),
  PRIMARY KEY (`id_receta`,`id_servicio`),
  KEY `idx_rs_receta` (`id_receta`),
  KEY `idx_rs_servicio` (`id_servicio`),
  CONSTRAINT `fk_rs_hacia_recetas` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id_receta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rs_hacia_servicios` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reemplazodocente`
--

DROP TABLE IF EXISTS `reemplazodocente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reemplazodocente` (
  `id_reemplazoDocente` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_persona` int NOT NULL,
  `id_docenteTitular` int NOT NULL,
  `nombreGrado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cicloLectivo` date NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date DEFAULT NULL,
  `estado` enum('Activo','Finalizado','Programado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `motivo` enum('licencia_medica','licencia_maternidad','licencia_anual','cambio_funciones','renuncia','jubilacion','ausencia_prolongada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_reemplazoDocente`),
  KEY `Ref3295` (`nombreGrado`,`id_docenteTitular`,`id_persona`),
  KEY `Ref2196` (`id_persona`),
  KEY `RefDocenteGrado954` (`id_docenteTitular`,`id_persona`,`nombreGrado`),
  CONSTRAINT `RefPersonas964` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registrosasistencias`
--

DROP TABLE IF EXISTS `registrosasistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrosasistencias` (
  `id_asistencia` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_servicio` int NOT NULL,
  `id_grado` int NOT NULL,
  `fecha` date DEFAULT '2025-01-01',
  `cantidadPresentes` int DEFAULT '0',
  `fechaCreacion` datetime DEFAULT NULL,
  `fechaActualizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_asistencia`),
  KEY `RefServicios934` (`id_servicio`),
  KEY `RefGrados944` (`id_grado`),
  CONSTRAINT `RefGrados944` FOREIGN KEY (`id_grado`) REFERENCES `grados` (`id_grado`),
  CONSTRAINT `RefServicios934` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcionRol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitaCuentaUsuario` enum('Si','No') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No',
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uk_rol_nombre` (`nombreRol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rolespermisos`
--

DROP TABLE IF EXISTS `rolespermisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolespermisos` (
  `id_rolPermiso` int NOT NULL AUTO_INCREMENT,
  `id_permiso` int NOT NULL,
  `id_rol` int NOT NULL,
  PRIMARY KEY (`id_rolPermiso`),
  UNIQUE KEY `uk_rolPermiso` (`id_permiso`,`id_rol`),
  KEY `Ref1053` (`id_permiso`),
  KEY `Ref15` (`id_rol`),
  CONSTRAINT `RefPermisos534` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`),
  CONSTRAINT `RefRoles54` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id_servicio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaAlta` date DEFAULT '2025-01-01',
  `fechaModificacion` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_servicio`),
  UNIQUE KEY `uk_servicio` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicioscompletados`
--

DROP TABLE IF EXISTS `servicioscompletados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicioscompletados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `id_servicio` int NOT NULL,
  `completado` tinyint(1) DEFAULT '0',
  `fechaCreacion` timestamp NULL DEFAULT NULL,
  `fechaActualizacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_servicio_fecha` (`fecha`,`id_servicio`),
  KEY `id_servicio` (`id_servicio`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `ServiciosCompletados_ibfk_1` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicioturno`
--

DROP TABLE IF EXISTS `servicioturno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicioturno` (
  `id_turno` int NOT NULL,
  `id_servicio` int NOT NULL,
  `fechaAsociacion` date DEFAULT '2025-01-01',
  PRIMARY KEY (`id_turno`,`id_servicio`),
  KEY `Ref2658` (`id_servicio`),
  KEY `Ref2759` (`id_turno`),
  CONSTRAINT `RefServicios584` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`),
  CONSTRAINT `RefTurnos594` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tiposmermas`
--

DROP TABLE IF EXISTS `tiposmermas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiposmermas` (
  `id_tipoMerma` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_tipoMerma`),
  UNIQUE KEY `uk_merma` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos`
--

DROP TABLE IF EXISTS `turnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos` (
  `id_turno` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time NOT NULL,
  `fechaAlta` date DEFAULT '2025-01-01',
  `fechaModificacion` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_turno`),
  UNIQUE KEY `ul_turno` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ultimopedidoautomatico`
--

DROP TABLE IF EXISTS `ultimopedidoautomatico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ultimopedidoautomatico` (
  `id_ultimoPedido` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `fecha_ultimoPedido` datetime DEFAULT CURRENT_TIMESTAMP,
  `proximaPermitidaEn` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ultimoPedido`),
  KEY `idx_fecha_ultimoPedido` (`fecha_ultimoPedido`),
  KEY `idx_proximaPermitidaEn` (`proximaPermitidaEn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` binary(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
  `id_persona` int DEFAULT NULL,
  `id_proveedor` binary(16) DEFAULT NULL,
  `nombreUsuario` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasenia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mail` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fechaAlta` datetime DEFAULT CURRENT_TIMESTAMP,
  `fechaUltimaActividad` datetime DEFAULT NULL,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_usuarios_nombre` (`nombreUsuario`),
  UNIQUE KEY `uk_usuario_mail` (`mail`),
  KEY `idx_usuario_proveedor` (`id_proveedor`),
  KEY `Ref2169` (`id_persona`),
  CONSTRAINT `RefPersonas694` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`),
  CONSTRAINT `RefProveedores895` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  CONSTRAINT `chk_usuario_persona_or_proveedor` CHECK (((`id_persona` is not null) or (`id_proveedor` is not null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuariosroles`
--

DROP TABLE IF EXISTS `usuariosroles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuariosroles` (
  `id_usuarioRol` int NOT NULL AUTO_INCREMENT,
  `id_usuario` binary(16) NOT NULL,
  `id_rol` int NOT NULL,
  `fechaAsignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  PRIMARY KEY (`id_usuarioRol`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_rol` (`id_rol`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_usuariorol_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuariorol_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_alertas_activas`
--

DROP TABLE IF EXISTS `v_alertas_activas`;
/*!50001 DROP VIEW IF EXISTS `v_alertas_activas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_alertas_activas` AS SELECT 
 1 AS `id_alerta`,
 1 AS `id_insumo`,
 1 AS `nombreInsumo`,
 1 AS `categoria`,
 1 AS `unidadMedida`,
 1 AS `tipoAlerta`,
 1 AS `contadorEnvios`,
 1 AS `estado`,
 1 AS `cantidadActual`,
 1 AS `nivelMinimoAlerta`,
 1 AS `estadoStock`,
 1 AS `fechaPrimeraAlerta`,
 1 AS `fechaUltimaAlerta`,
 1 AS `minutosDesdeUltimaAlerta`,
 1 AS `estadoEnvios`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_resumen_alertas`
--

DROP TABLE IF EXISTS `v_resumen_alertas`;
/*!50001 DROP VIEW IF EXISTS `v_resumen_alertas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_resumen_alertas` AS SELECT 
 1 AS `insumosConAlerta`,
 1 AS `alertasActivas`,
 1 AS `alertasMaximas`,
 1 AS `pendientesEnvio`,
 1 AS `promedioEnvios`,
 1 AS `totalInsumosCriticos`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_alertas_activas`
--

/*!50001 DROP VIEW IF EXISTS `v_alertas_activas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_alertas_activas` AS select `aa`.`id_alerta` AS `id_alerta`,`aa`.`id_insumo` AS `id_insumo`,`i`.`nombreInsumo` AS `nombreInsumo`,`i`.`categoria` AS `categoria`,`i`.`unidadMedida` AS `unidadMedida`,`aa`.`tipoAlerta` AS `tipoAlerta`,`aa`.`contadorEnvios` AS `contadorEnvios`,`aa`.`estado` AS `estado`,`inv`.`cantidadActual` AS `cantidadActual`,`inv`.`nivelMinimoAlerta` AS `nivelMinimoAlerta`,`inv`.`estado` AS `estadoStock`,`aa`.`fechaPrimeraAlerta` AS `fechaPrimeraAlerta`,`aa`.`fechaUltimaAlerta` AS `fechaUltimaAlerta`,timestampdiff(MINUTE,`aa`.`fechaUltimaAlerta`,now()) AS `minutosDesdeUltimaAlerta`,(case when (`aa`.`contadorEnvios` >= 3) then 'completada' when (`aa`.`contadorEnvios` = 2) then 'penultima' when (`aa`.`contadorEnvios` = 1) then 'primera' end) AS `estadoEnvios` from ((`alertasinventario` `aa` join `insumos` `i` on((`aa`.`id_insumo` = `i`.`id_insumo`))) join `inventarios` `inv` on((`aa`.`id_insumo` = `inv`.`id_insumo`))) where (`aa`.`estado` = 'activa') order by `aa`.`fechaUltimaAlerta` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_resumen_alertas`
--

/*!50001 DROP VIEW IF EXISTS `v_resumen_alertas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_resumen_alertas` AS select count(distinct `aa`.`id_insumo`) AS `insumosConAlerta`,sum((case when (`aa`.`estado` = 'activa') then 1 else 0 end)) AS `alertasActivas`,sum((case when (`aa`.`contadorEnvios` >= 3) then 1 else 0 end)) AS `alertasMaximas`,sum((case when ((`aa`.`contadorEnvios` < 3) and (`aa`.`estado` = 'activa')) then 1 else 0 end)) AS `pendientesEnvio`,avg((case when (`aa`.`estado` = 'activa') then `aa`.`contadorEnvios` else NULL end)) AS `promedioEnvios`,count(distinct `aa`.`id_insumo`) AS `totalInsumosCriticos` from `alertasinventario` `aa` where (`aa`.`estado` in ('activa','completada')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Table structure for table `insumossemanales` (Histórico de insumos calculados)
--

DROP TABLE IF EXISTS `insumossemanales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumossemanales` (
  `id_insumo_semanal` int NOT NULL AUTO_INCREMENT,
  `id_planificacion` binary(16) NOT NULL,
  `id_insumo` int NOT NULL,
  `cantidad` decimal(10,3) NOT NULL,
  `unidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_disponible` decimal(10,3) DEFAULT '0.000',
  `stock_final` decimal(10,3) DEFAULT '0.000',
  `estado_generacion` enum('Calculado','Pedido_Generado','Finalizado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Calculado',
  `fecha_calculo` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_finalizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_insumo_semanal`),
  KEY `idx_planificacion` (`id_planificacion`),
  KEY `idx_insumo` (`id_insumo`),
  KEY `idx_fecha_calculo` (`fecha_calculo`),
  CONSTRAINT `fk_insumossemanales_planificacion` FOREIGN KEY (`id_planificacion`) REFERENCES `planificacionmenus` (`id_planificacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_insumossemanales_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-21  4:17:40
