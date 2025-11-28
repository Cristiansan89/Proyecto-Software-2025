# Sistema de Alertas Automáticas de Inventario - Implementación Completada

## 📋 Resumen Ejecutivo

Se ha implementado un sistema automatizado de alertas que:

1. **Detecta automáticamente** insumos con stock crítico o agotado
2. **Envía alertas por Telegram** a la cocinera (máximo 3 alertas por insumo)
3. **Se resuelve automáticamente** cuando la cocinera ingresa al sistema
4. **Registra auditoría completa** de todas las alertas
5. **Permite configuración flexible** de tiempos y parámetros

---

## 🏗️ Arquitectura Implementada

### Componentes Creados

#### 1. **Modelo de Datos** (`server/models/alertaInventario.js`)

```javascript
- AlertaInventarioModel
  - create(): Crear nueva alerta
  - getAlertasActivas(): Obtener alertas pendientes
  - marcarComoResuelta(): Resolver cuando cocinera ingresa
  - marcarComoCompletada(): Marcar cuando se alcanzan 3 envíos
  - getEstadisticas(): Estadísticas del sistema
```

#### 2. **Servicio** (`server/services/alertasInventarioService.js`)

```javascript
- AlertasInventarioService
  - inicializar(): Inicia el servicio y Telegram
  - verificarYEnviarAlertas(): Verifica stock cada 5 minutos
  - procesarAlerta(): Maneja cada alerta individualmente
  - enviarAlerta(): Envía por Telegram
  - construirMensajeAlerta(): Formatea mensaje
  - resolverAlertaCocineraIngresa(): Resuelve cuando user ingresa
```

#### 3. **Controlador** (`server/controllers/alertasInventarioController.js`)

```javascript
-AlertasInventarioController -
  inicializar() -
  obtenerAlertasActivas() -
  obtenerEstadisticas() -
  resolverAlerta() -
  cambiarTiempoVerificacion() -
  iniciarVerificacionManual() -
  detener();
```

#### 4. **Rutas** (`server/routes/alertasInventario.js`)

```
POST   /inicializar
GET    /activas
GET    /estadisticas
GET    /:id_insumo
PATCH  /:id_insumo/resolver
POST   /config/tiempo-verificacion
GET    /config/estado
POST   /verificar/manual
POST   /control/detener
```

#### 5. **Base de Datos** (`server/sql/alertas_inventario.sql`)

```sql
- Tabla AlertasInventario (rastreo de alertas)
- Tabla AuditAlertas (registro de envíos)
- Vista v_alertas_activas (alertas con info completa)
- Vista v_resumen_alertas (estadísticas)
```

#### 6. **Middleware Actualizado** (`server/middlewares/updateLastActivity.js`)

```javascript
- Detecta cuando cocinera ingresa
- Automáticamente resuelve sus alertas
```

---

## 🔄 Flujo de Funcionamiento

### Verificación Periódica (cada 5 minutos)

```
1. Sistema obtiene insumos con stock bajo (estados: Agotado, Bajo, Crítico)
2. Filtra solo los que están en estado CRÍTICO
   (Cantidad ≤ Nivel Mínimo × 2%)
3. Para cada insumo CRÍTICO:
   - Busca alertas previas
   - Si existe alerta activa:
     * Si contador >= 3: Marcar completada
     * Si contador < 3: Enviar Telegram + aumentar contador
   - Si NO existe alerta:
     * Crear nueva alerta (tipo: "Critico")
     * Enviar primer Telegram
4. Registrar en tabla AuditAlertas
```

### Resolución (cuando cocinera ingresa)

```
1. Cocinera hace cualquier petición autenticada
2. Middleware updateLastActivity:
   - Detecta rol "cocinera"
   - Obtiene sus alertas activas
   - Marca todas como "resuelta"
3. Sistema deja de enviar alertas para ese usuario
```

---

## 📊 Estados de Alerta

| Estado       | Significado                   | Acción             |
| ------------ | ----------------------------- | ------------------ |
| `activa`     | Alerta nueva, pendiente envío | Continuar enviando |
| `resuelta`   | Cocinera ingresó              | Dejar de enviar    |
| `completada` | Se alcanzaron 3 envíos        | Archivar           |

---

## 🔧 Instalación Paso a Paso

### 1. Crear Tablas

```bash
mysql -u root -p tuBaseDatos < server/sql/alertas_inventario.sql
```

### 2. Variables de Entorno

```env
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_CHAT_ID=tu_chat_id
```

### 3. Integración en app.js

✅ Ya realizada:

```javascript
import alertasService from "./services/alertasInventarioService.js";
app.use("/api/alertas-inventario", alertasInventarioRouter);
alertasService.inicializar();
```

### 4. Middleware en rutas

✅ Ya realizado en `updateLastActivity.js`

---

## 📡 Endpoints de API

### Inicializar

```bash
POST /api/alertas-inventario/inicializar
```

### Obtener Alertas Activas

```bash
GET /api/alertas-inventario/activas
```

**Respuesta:**

```json
{
  "success": true,
  "alertas": [
    {
      "id_insumo": 5,
      "nombreInsumo": "Arroz",
      "cantidadActual": 2,
      "contador_envios": 2,
      "estado": "activa"
    }
  ]
}
```

### Estadísticas

```bash
GET /api/alertas-inventario/estadisticas
```

### Resolver Alerta (manual)

```bash
PATCH /api/alertas-inventario/5/resolver
```

### Verificación Manual

```bash
POST /api/alertas-inventario/verificar/manual
```

### Cambiar Intervalo

```bash
POST /api/alertas-inventario/config/tiempo-verificacion
Body: { "tiempoMinutos": 10 }
```

---

## 💬 Ejemplo de Mensaje Telegram

```
⚠️ ALERTA DE INVENTARIO

Estado: CRÍTICO
Insumo: Arroz
Categoría: Granos
Stock Actual: 2 kg
Nivel Mínimo: 10 kg
Notificación: 2/3

🔔 Por favor:
• Revisa el inventario del sistema
• Ingresa al sistema para confirmar lectura
• Coordina la solicitud del insumo

⏰ Se enviarán hasta 3 notificaciones hasta que ingreses al sistema.
```

---

## 🗄️ Estructura Base de Datos

### AlertasInventario

```sql
id_alerta (PK)
id_insumo (FK, UNIQUE)
tipo_alerta (Critico/Agotado)
contador_envios (1-3)
estado (activa/resuelta/completada)
fecha_primera_alerta
fecha_ultima_alerta
fecha_resolucion
```

### AuditAlertas

```sql
id_auditoria (PK)
id_alerta (FK)
id_insumo (FK)
numero_envio (1-3)
canal_envio (Telegram)
mensaje_enviado
estado_envio
fecha_envio
```

---

## 🎯 Casos de Uso

### Caso 1: Stock Crítico Detectado

```
Hora 10:00 - Stock de Arroz cae a 2kg (mínimo 10kg)
         ↓
Sistema crea alerta
         ↓
Envía Telegram: "Notificación 1/3"
         ↓
Registra en AuditAlertas
```

### Caso 2: Cocinera Ingresa

```
Hora 10:05 - Cocinera inicia sesión
         ↓
Middleware detecta rol cocinera
         ↓
Sistema obtiene alertas activas
         ↓
Marca todas como "resuelta"
         ↓
Deja de enviar Telegrams
```

### Caso 3: Stock Sigue Bajo Después de 3 Alertas

```
Hora 10:00 - Alerta 1/3 enviada
Hora 10:05 - Alerta 2/3 enviada
Hora 10:10 - Alerta 3/3 enviada
         ↓
Hora 10:15 - Sistema marca como "completada"
         ↓
Detiene envío (máximo alcanzado)
         ↓
Admin puede revisar historial en AuditAlertas
```

---

## ⚙️ Configuración Avanzada

### Cambiar Tiempo de Verificación

```javascript
// Verificar cada 10 minutos
POST /api/alertas-inventario/config/tiempo-verificacion
{
  "tiempoMinutos": 10
}
```

### Cambiar Máximo de Envíos

```javascript
// En alertasInventarioService.js línea ~78:
WHERE aa.contador_envios < 3  // Cambiar 3 por otro número
```

### Cambiar Criterios de Alerta

```javascript
// En InventarioModel.getInsumosConStockBajo():
WHERE i.estado IN ('Agotado', 'Critico')  // Agregar estados
```

---

## 🚨 Resolución de Problemas

### Telegram no envía mensajes

```bash
# Verificar status
GET /api/telegram/status

# Verificar variables de entorno
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_CHAT_ID
```

### Alertas no se crean

```bash
# Verificar tablas
SHOW TABLES LIKE 'Alertas%';

# Verificar datos en inventario
SELECT * FROM Inventarios WHERE estado IN ('Critico', 'Agotado');
```

### Alertas no se resuelven al ingresar

```bash
# Verificar rol en base de datos
SELECT id_usuario, rol FROM Usuarios WHERE id_usuario = ?;

# Verificar middleware se aplica
grep -n "updateLastActivity" app.js
```

---

## 📈 Monitoreo

### Ver Alertas Activas

```sql
SELECT * FROM v_alertas_activas;
```

### Ver Estadísticas

```sql
SELECT * FROM v_resumen_alertas;
```

### Ver Auditoría de Envíos

```sql
SELECT * FROM AuditAlertas
ORDER BY fecha_envio DESC
LIMIT 20;
```

### Ver Alertas por Insumo

```sql
SELECT a.*, i.nombreInsumo
FROM AlertasInventario a
JOIN Insumos i ON a.id_insumo = i.id_insumo
WHERE a.id_insumo = 5;
```

---

## 🔐 Seguridad

✅ Autenticación requerida en todos los endpoints  
✅ Middleware de CORS habilitado  
✅ Datos sensibles no expuestos en logs  
✅ Auditoría completa de acciones  
✅ Límite automático de 3 alertas por insumo

---

## 📝 Próximas Mejoras Sugeridas

- [ ] Notificaciones por email adicional
- [ ] Alertas por SMS
- [ ] Dashboard visual de alertas
- [ ] Configuración por insumo individual
- [ ] Escalación automática de prioridad
- [ ] Integración con WhatsApp
- [ ] Reportes PDF de alertas
- [ ] Análisis de tendencias de stock

---

## 📞 Soporte

Para ayuda con el sistema de alertas:

1. Revisa `ALERTAS_INVENTARIO_README.md`
2. Verifica logs: `tail -f server.log`
3. Prueba endpoints manualmente con Postman/Insomnia
4. Revisa estado: `GET /api/alertas-inventario/config/estado`

---

**Implementación completada:** 26 de Noviembre de 2025  
**Estado:** ✅ Listo para producción
