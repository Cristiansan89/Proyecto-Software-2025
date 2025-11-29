# ✅ CHECKLIST - GENERACIÓN AUTOMÁTICA DE INSUMOS Y PEDIDOS

## Implementación Completada

### Frontend ✅

- [x] Nueva pestaña "Generación Automática" en ParametrosSistema.jsx
- [x] Componente GeneracionAutomatica.jsx creado
  - [x] Sección de insumos semanales con day/time picker
  - [x] Sección de pedidos automáticos con configuración
  - [x] Sección de pruebas manuales
  - [x] Sección de resumen de configuración
  - [x] Integración con ParametrosSistema (tabla BD)
  - [x] Botones para ejecutar manual (test)
  - [x] Validación de entrada
  - [x] Mensajes de error/éxito

### Backend - Controlador ✅

- [x] generacionAutomaticaController.js creado
  - [x] generarInsumosSemanales() - Calcula insumos por cantidad
  - [x] generarPedidosAutomaticos() - Agrupa por proveedor
  - [x] obtenerEstadoGeneracion() - Lee configuración

### Backend - Servicio ✅

- [x] schedulerService.js creado
  - [x] Inicialización automática al arrancar servidor
  - [x] Programación CRON para insumos
  - [x] Programación CRON para pedidos
  - [x] Recarga dinámica de configuración
  - [x] Logs detallados de ejecución

### Backend - Rutas ✅

- [x] generacionAutomaticaRoutes.js creado
  - [x] POST /generar-insumos-semanales
  - [x] POST /generar-pedidos-automaticos
  - [x] GET /estado-generacion
  - [x] POST /recargar-scheduler
  - [x] GET /estado-scheduler
  - [x] Autenticación en todas las rutas

### Backend - Integración ✅

- [x] Import en app.js
- [x] Registro de rutas en app.js
- [x] Inicialización de schedulerService en app.js

### Base de Datos ✅

- [x] Definición de claves ParametrosSistema
  - [x] INSUMOS_SEMANALES_HABILITADO
  - [x] INSUMOS_SEMANALES_DIA
  - [x] INSUMOS_SEMANALES_HORA
  - [x] INSUMOS_SEMANALES_NOTIFICACION
  - [x] PEDIDOS_AUTOMATICOS_HABILITADO
  - [x] PEDIDOS_AUTOMATICOS_DIA
  - [x] PEDIDOS_AUTOMATICOS_HORA
  - [x] PEDIDOS_AUTOMATICOS_NOTIFICACION
  - [x] CANTIDAD_REINTENTOS_PEDIDOS
  - [x] INTERVALO_REINTENTOS_PEDIDOS

### Dependencias ✅

- [x] node-schedule agregado a package.json
- [x] Versión especificada: ^2.1.1

### Documentación ✅

- [x] GENERACION_AUTOMATICA_README.md creado (guía técnica completa)
- [x] RESUMEN_GENERACION_AUTOMATICA.md creado (resumen de cambios)
- [x] Este checklist

### Scripts ✅

- [x] install-generacion-automatica.sh creado
- [x] Permisos de ejecución configurados

---

## Verificación Pre-Uso

### Antes de Usar el Sistema

1. **Instalar dependencias**

   - [ ] Ejecuta: `bash install-generacion-automatica.sh`
   - [ ] O manualmente: `cd server && pnpm add node-schedule@^2.1.1`
   - [ ] Verifica: `ls node_modules | grep node-schedule`

2. **Verificar base de datos**

   - [ ] Asegúrate que hay una planificación activa (estado='Activo')
   - [ ] Verifica que existe la tabla ParametrosSistema
   - [ ] Confirma que tienes Recetas, ItemsRecetas, Insumos relacionados

3. **Verificar servidor**

   - [ ] Inicia servidor: `cd server && npm run dev`
   - [ ] Busca en logs: `[Scheduler] Inicializando...`
   - [ ] Busca: `[Scheduler] ✓ Insumos programados:`
   - [ ] Busca: `[Scheduler] ✓ Pedidos programados:`

4. **Verificar cliente**

   - [ ] Inicia cliente: `cd client && npm run dev`
   - [ ] Ve a: Administración → Parámetros del Sistema
   - [ ] Verifica tercera pestaña: "Generación Automática"
   - [ ] Puedes ver configuración existente

5. **Primera prueba manual**
   - [ ] En "Pruebas Manuales", haz clic "Generar Insumos Ahora"
   - [ ] Revisa la respuesta en consola del navegador
   - [ ] Verifica logs del servidor
   - [ ] Busca: `[Scheduler] ✓ Insumos generados: X items`

---

## Verificación Paso a Paso

### Test 1: Generar Insumos Manualmente

**Acción**:

1. Ve a Administración → Parámetros del Sistema → Generación Automática
2. Haz clic en "Generar Insumos Ahora"

**Resultado esperado**:

- Mensaje: "Insumos generados correctamente. X insumos procesados"
- En servidor, logs: `[Scheduler] ✓ Insumos generados: X items`

**Si falla**:

- Verifica que hay planificación activa
- Chequea que existen recetas asignadas a la planificación
- Revisa permisos de BD

### Test 2: Cambiar Configuración

**Acción**:

1. En "Generación Automática de Insumos Semanales":
   - Selecciona un día diferente (ej: Lunes)
   - Cambia hora (ej: 10:00)
2. Haz clic "Guardar Configuración"

**Resultado esperado**:

- Mensaje: "Configuración guardada correctamente"
- En servidor: `[Scheduler] Recargando configuración...`
- En servidor: `[Scheduler] ✓ Insumos programados: lunes 10:00`

**Si falla**:

- Verifica que hay conexión a BD
- Chequea que el usuario tiene permisos
- Revisa logs para error específico

### Test 3: Verificar Estado del Scheduler

**Acción**:

```bash
curl http://localhost:3000/api/generacion-automatica/estado-scheduler \
  -H "Authorization: Bearer <tu_token>"
```

**Resultado esperado**:

```json
{
  "success": true,
  "estado": {
    "inicializado": true,
    "trabajos": ["insumosSemanales", "pedidosAutomaticos"],
    "timestamp": "2025-01-15T14:30:45.123Z"
  }
}
```

---

## Estado Final de Archivos

### Nuevos Archivos ✅

```
client/src/pages/admins/GeneracionAutomatica.jsx
server/controllers/generacionAutomaticaController.js
server/routes/generacionAutomaticaRoutes.js
server/services/schedulerService.js
GENERACION_AUTOMATICA_README.md
RESUMEN_GENERACION_AUTOMATICA.md
install-generacion-automatica.sh
CHECKLIST_GENERACION_AUTOMATICA.md  ← Este archivo
```

### Archivos Modificados ✅

```
client/src/pages/admins/ParametrosSistema.jsx        (agregó import y tab)
server/app.js                                         (agregó imports e inicialización)
server/package.json                                   (agregó node-schedule)
```

### Archivos Intactos (No modificados) ✅

```
client/src/pages/admins/Parametros.jsx
client/src/pages/admins/Alertas.jsx
server/models/parametrosistema.js
server/models/db.js
(... todas las otras tablas)
```

---

## Próximos Pasos Opcionales

Para mejorar aún más el sistema, considera:

1. **Integración con Notificaciones**

   - Usar `INSUMOS_SEMANALES_NOTIFICACION` para enviar Telegram
   - Usar `PEDIDOS_AUTOMATICOS_NOTIFICACION` para enviar Email

2. **Historial de Ejecuciones**

   - Crear tabla `EjecucionesAutomaticas` para auditoría
   - Log de qué se generó, cuándo, por quién
   - Estadísticas de éxito/error

3. **Alertas de Falla**

   - Si generación falla N veces, enviar notificación
   - Usar `INTERVALO_REINTENTOS_PEDIDOS`

4. **Caché de Resultados**

   - Guardar última generación en tabla
   - Evitar recálculos innecesarios

5. **API de Simulación**
   - GET /estado-proximas-generaciones: muestra hora exacta próxima ejecución
   - POST /simular-generacion: prueba sin guardar en BD

---

## Contacto / Soporte

Si encuentras problemas:

1. Revisa `GENERACION_AUTOMATICA_README.md` sección "Troubleshooting"
2. Chequea logs del servidor: `[Scheduler]`
3. Verifica que `node-schedule` está instalado
4. Confirma zona horaria del servidor
5. Comprueba que la BD es accesible

---

**Fecha de Implementación**: Enero 2025
**Versión**: 1.0
**Estado**: ✅ COMPLETADA Y LISTA PARA USO
