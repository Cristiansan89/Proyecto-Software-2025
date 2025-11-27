# Sistema de Alertas Automáticas de Inventario

## Descripción General

Sistema automatizado que detecta insumos con stock crítico o agotado y envía alertas por Telegram a la cocinera hasta **3 veces** o hasta que la cocinera ingrese al sistema.

## Características

✅ **Detección automática** de insumos con stock bajo  
✅ **Envío por Telegram** de alertas  
✅ **Máximo 3 alertas** por insumo  
✅ **Resolución automática** cuando la cocinera ingresa  
✅ **Auditoría completa** de alertas enviadas  
✅ **Configuración ajustable** del tiempo de verificación  
✅ **Estadísticas** en tiempo real

## Instalación

### 1. Crear las tablas en la base de datos

Ejecuta el archivo SQL:

```bash
mysql -u usuario -p nombreBD < server/sql/alertas_inventario.sql
```

Esto crea:

- Tabla `AlertasInventario`
- Tabla `AuditAlertas`
- Vistas `v_alertas_activas` y `v_resumen_alertas`

### 2. Configurar variables de entorno

Asegúrate de que en tu `.env` estén configuradas:

```env
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=id_del_chat_o_usuario
```

## Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────┐
│  Sistema de Alertas de Inventario               │
└─────────────────────────────────────────────────┘
           ↓
      ┌─────────────────────────┐
      │ Verificación Periódica  │ (cada 5 minutos)
      │ getInsumosConStockBajo()│
      └─────────────────────────┘
           ↓
    ¿Hay insumos críticos?
           ├─ NO → Esperar próxima verificación
           │
           └─ SÍ
              ↓
         ┌──────────────────────────────┐
         │ Para cada insumo crítico:    │
         │ 1. Revisar alertas previas   │
         │ 2. Crear/Actualizar alerta   │
         │ 3. Aumentar contador_envios  │
         └──────────────────────────────┘
              ↓
       ¿contador_envios >= 3?
         ├─ SÍ → Marcar como completada
         │      No enviar más alertas
         │
         └─ NO
            ↓
        Enviar por Telegram:
        - Nombre del insumo
        - Stock actual
        - Nivel mínimo
        - Número de alerta (1-3)
            ↓
    Registrar en AuditAlertas
            ↓
       Esperar próxima verificación
            ↓
    ¿Cocinera ingresó al sistema?
         ├─ SÍ → Marcar alerta como "resuelta"
         │      Detener envíos para ese insumo
         │
         └─ NO → Seguir enviando (máximo 3 veces)
```

## Endpoints API

### 1. Inicializar servicio

```
POST /api/alertas-inventario/inicializar
```

Inicia el servicio automático de alertas.

**Respuesta:**

```json
{
  "success": true,
  "message": "Servicio de alertas inicializado"
}
```

### 2. Obtener alertas activas

```
GET /api/alertas-inventario/activas
```

Retorna todas las alertas activas pendientes.

**Respuesta:**

```json
{
  "success": true,
  "alertas": [
    {
      "id_alerta": 1,
      "id_insumo": 5,
      "nombreInsumo": "Arroz",
      "categoria": "Granos",
      "cantidadActual": 2.5,
      "nivelMinimoAlerta": 10,
      "contador_envios": 2,
      "estado": "activa",
      "tipo_alerta": "Critico",
      "fecha_primera_alerta": "2025-11-26T10:30:00",
      "fecha_ultima_alerta": "2025-11-26T11:15:00"
    }
  ]
}
```

### 3. Obtener estadísticas

```
GET /api/alertas-inventario/estadisticas
```

Retorna estadísticas del sistema de alertas.

**Respuesta:**

```json
{
  "success": true,
  "stats": {
    "total_alertas": 5,
    "alertas_activas": 2,
    "alertas_resueltas": 2,
    "alertas_completadas": 1,
    "promedio_envios": 1.8
  }
}
```

### 4. Resolver alerta

```
PATCH /api/alertas-inventario/:id_insumo/resolver
```

Marca una alerta como resuelta (cuando la cocinera ingresa).

**Respuesta:**

```json
{
  "success": true,
  "message": "Alerta resuelta"
}
```

### 5. Obtener alertas de un insumo

```
GET /api/alertas-inventario/:id_insumo
```

Retorna el historial de alertas de un insumo específico.

### 6. Cambiar tiempo de verificación

```
POST /api/alertas-inventario/config/tiempo-verificacion
Content-Type: application/json

{
  "tiempoMinutos": 10
}
```

Cambia el intervalo de verificación (en minutos).

### 7. Obtener estado del servicio

```
GET /api/alertas-inventario/config/estado
```

Retorna el estado actual del servicio de alertas.

**Respuesta:**

```json
{
  "success": true,
  "estado": {
    "activo": true,
    "tiempoVerificacion": 300000,
    "proximaVerificacion": "2025-11-26T11:25:00"
  }
}
```

### 8. Verificación manual

```
POST /api/alertas-inventario/verificar/manual
```

Ejecuta una verificación inmediata sin esperar el intervalo.

### 9. Detener servicio

```
POST /api/alertas-inventario/control/detener
```

Detiene el servicio automático de alertas.

## Configuración

### Variables de Entorno

```env
# Bot de Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=987654321

# Tiempo de verificación (en minutos) - opcional
ALERTAS_VERIFICACION_MINUTOS=5
```

### Parámetros Configurables

En `services/alertasInventarioService.js`:

```javascript
// Cambiar tiempo de verificación (en milisegundos)
this.tiempoVerificacion = 5 * 60 * 1000; // 5 minutos

// Cambiar máximo de envíos por alerta
// Ver en modelo AlertaInventarioModel.getAlertasActivas()
// WHERE aa.contador_envios < 3
```

## Estados de Alerta

| Estado       | Descripción                          |
| ------------ | ------------------------------------ |
| `activa`     | Alerta nueva, pendiente de envíos    |
| `resuelta`   | Cocinera ingresó, alerta resuelta    |
| `completada` | Se alcanzaron 3 envíos sin respuesta |

## Ejemplo de Mensaje Telegram

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

## Auditoría

Todas las alertas enviadas se registran en `AuditAlertas` con:

- ID de la alerta
- ID del insumo
- Número de envío
- Canal (Telegram)
- Mensaje enviado
- Estado del envío
- Fecha y hora
- Respuesta del sistema

### Consultar auditoría

```sql
SELECT * FROM AuditAlertas
WHERE id_insumo = 5
ORDER BY fecha_envio DESC;
```

## Vistas SQL

### v_alertas_activas

Retorna todas las alertas activas con información completa del insumo.

```sql
SELECT * FROM v_alertas_activas;
```

### v_resumen_alertas

Retorna estadísticas agregadas.

```sql
SELECT * FROM v_resumen_alertas;
```

## Resolución de Problemas

### Las alertas no se envían

1. Verifica que Telegram esté inicializado:

   ```
   GET /api/telegram/status
   ```

2. Verifica que `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` estén configurados

3. Verifica los logs del servidor:
   ```
   tail -f server.log
   ```

### Las alertas se siguen enviando después de que la cocinera ingresa

El middleware `updateLastActivity` detecta si el rol contiene "cocinera" y resuelve automáticamente. Verifica:

1. Que el usuario tenga el rol correcto
2. Que el middleware esté aplicado a las rutas que necesitan autenticación

### No se crean las tablas

Asegúrate de ejecutar:

```sql
source server/sql/alertas_inventario.sql;
```

O copiar y ejecutar manualmente el contenido de `alertas_inventario.sql`.

## Desarrollo Futuro

- [ ] Alertas por email adicional a Telegram
- [ ] Alertas por SMS
- [ ] Dashboard de alertas en tiempo real
- [ ] Configuración de intervalos por insumo
- [ ] Escalación automática de alertas
- [ ] Integración con WhatsApp
- [ ] Historial completo de alertas

## Licencia

Parte del sistema de Comedor Escolar 2025
