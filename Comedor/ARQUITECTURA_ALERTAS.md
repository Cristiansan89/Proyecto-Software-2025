# Arquitectura del Sistema de Alertas de Inventario

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                           │
│                   CocineraInventario.jsx                        │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Tabla Inventario│  │ Alertas Section  │  │ Últimos Mov. │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┘  │
└───────────┼───────────────────┼──────────────────────────────────┘
            │                   │
            └───────────┬───────┘
                        │
                 GET /api/inventarios
                 GET /api/alertas-inventario/activas
                        │
┌───────────────────────┴────────────────────────────────────────┐
│                      EXPRESS BACKEND                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE                         │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ updateLastActivity (resuelve alertas)       │   │    │
│  │  │ authMiddleware (autenticación)               │   │    │
│  │  │ corsMiddleware (CORS)                         │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│                        │                                       │
│                        ▼                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              ROUTER                                   │    │
│  │  app.use('/api/alertas-inventario',                 │    │
│  │           alertasInventarioRouter)                  │    │
│  └────┬────────────────────────────────────────────┬───┘    │
│       │                                             │        │
│       ▼                                             ▼        │
│  ┌──────────────────┐                  ┌──────────────────┐ │
│  │   CONTROLLER     │                  │   CONTROLLER     │ │
│  │ AlertasInventario│                  │ InventariosCtrl  │ │
│  │                  │                  │                  │ │
│  │ - inicializar()  │                  │ - getAll()       │ │
│  │ - obtenerActivas │                  │ - getById()      │ │
│  │ - resolverAlerta │                  │                  │ │
│  │ - estadisticas() │                  │                  │ │
│  └────────┬─────────┘                  └────────┬─────────┘ │
│           │                                     │            │
│           ▼                                     ▼            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SERVICE                                │   │
│  │  AlertasInventarioService (singleton)              │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ inicializar()                                │ │   │
│  │  │ ├─ await telegramService.initialize()       │ │   │
│  │  │ └─ iniciarVerificacionPeriodica()           │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ setInterval: verificarYEnviarAlertas()      │ │   │
│  │  │ (cada 5 minutos)                            │ │   │
│  │  │                                             │ │   │
│  │  │ Para cada insumo con stock bajo:            │ │   │
│  │  │ ├─ procesarAlerta()                         │ │   │
│  │  │ ├─ enviarAlerta()                           │ │   │
│  │  │ └─ actualizar contador_envios               │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ resolverAlertaCocineraIngresa()              │ │   │
│  │  │ (cuando user con rol 'cocinera' ingresa)    │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────┬─────────────────────┬────────┬───────────┘   │
│           │                     │        │                │
│           ▼                     ▼        ▼                │
│  ┌──────────────────┐ ┌────────────────────┐ ┌───────┐  │
│  │  MODEL           │ │ TELEGRAM SERVICE   │ │LOGGER │  │
│  │ AlertaInventario │ │                    │ └───────┘  │
│  │                  │ │ - initialize()     │            │
│  │ - create()       │ │ - sendMessage()    │            │
│  │ - getActivas()   │ │ - sendToMainChat() │            │
│  │ - marcarResuelta │ │ - getStatus()      │            │
│  │ - estadisticas() │ └────────────────────┘            │
│  └────────┬─────────┘            │                      │
└───────────┼────────────────────────┼──────────────────────┘
            │                        │
            │                        │  HTTP API
            │                   ┌────▼────────────┐
            │                   │  TELEGRAM BOT   │
            │                   │  (en la nube)   │
            │                   └─────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MYSQL DATABASE                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ TABLAS:                                              │ │
│  │ ├─ AlertasInventario (UNIQUE: id_insumo)           │ │
│  │ │  ├─ id_alerta (PK)                               │ │
│  │ │  ├─ id_insumo (FK)                               │ │
│  │ │  ├─ tipo_alerta (Critico/Agotado)               │ │
│  │ │  ├─ contador_envios (1-3)                        │ │
│  │ │  ├─ estado (activa/resuelta/completada)         │ │
│  │ │  ├─ fecha_primera_alerta                         │ │
│  │ │  ├─ fecha_ultima_alerta                          │ │
│  │ │  └─ fecha_resolucion                             │ │
│  │ │                                                   │ │
│  │ ├─ AuditAlertas (registro de envíos)              │ │
│  │ │  ├─ id_auditoria (PK)                            │ │
│  │ │  ├─ id_alerta (FK)                               │ │
│  │ │  ├─ numero_envio (1-3)                           │ │
│  │ │  ├─ canal_envio (Telegram)                       │ │
│  │ │  ├─ mensaje_enviado                              │ │
│  │ │  ├─ estado_envio                                 │ │
│  │ │  └─ fecha_envio                                  │ │
│  │ │                                                   │ │
│  │ └─ Inventarios (existente)                         │ │
│  │    └─ estado (Normal/Critico/Agotado)             │ │
│  │                                                    │ │
│  │ ├─ Insumos (existente)                            │ │
│  │ └─ Usuarios (existente)                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ VISTAS SQL:                                          │ │
│  │                                                      │ │
│  │ v_alertas_activas                                  │ │
│  │ ├─ Muestra alertas estado='activa'                 │ │
│  │ ├─ Con información del insumo                      │ │
│  │ ├─ Stock actual vs mínimo                          │ │
│  │ └─ Tiempo desde última alerta                      │ │
│  │                                                      │ │
│  │ v_resumen_alertas                                  │ │
│  │ ├─ Total de alertas                                │ │
│  │ ├─ Alertas activas/resueltas/completadas          │ │
│  │ ├─ Promedio de envíos                              │ │
│  │ └─ Insumos críticos activos                        │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### 1. Detección de Stock Bajo

```
InventarioModel.getInsumosConStockBajo()
    │
    ├─ SELECT * FROM Inventarios
    │  WHERE estado IN ('Agotado', 'Critico')
    │
    └─ Retorna array de insumos
```

### 2. Procesamiento de Alerta

```
Para cada insumo:

1. AlertaInventarioModel.getAlertas(id_insumo)
   └─ Obtiene historial de alertas

2. Si existe alerta activa:
   ├─ Si contador >= 3
   │  └─ marcarComoCompletada()
   │
   └─ Si contador < 3
      ├─ enviarAlerta()
      ├─ telegramService.sendMessage()
      └─ CREATE en AuditAlertas

3. Si NO existe alerta:
   ├─ AlertaInventarioModel.create()
   ├─ enviarAlerta()
   └─ Registrar en AuditAlertas
```

### 3. Resolución al Ingresar

```
Cocinera hace request autenticado
    │
    ▼
updateLastActivity middleware
    │
    ├─ Verificar if rol.includes('cocinera')
    │
    └─ alertasService.obtenerAlertasActivas()
       └─ Para cada alerta
          └─ marcarComoResuelta()
             └─ UPDATE AlertasInventario
                SET estado = 'resuelta'
```

---

## Estados y Transiciones

```
┌──────────┐
│  CREATE  │
│ Nueva    │
│ Alerta   │
└────┬─────┘
     │
     ▼
┌──────────┐
│  ACTIVA  │◄─────────────────┐
│          │                  │
│contador=1│  contador++      │
└────┬─────┘      o enviar    │
     │                        │
     │   ¿Cocinera ingresa?  │
     ├─────► SÍ ────┐        │
     │             │        │
     │             ▼        │
     │          ┌──────────┐│
     │          │ RESUELTA ││
     │          │          ││
     │          │Fin de    ││
     │          │alertas   ││
     │          └──────────┘│
     │                      │
     │   ¿contador >= 3?    │
     ├─────► SÍ ────┐       │
     │             │       │
     │             ▼       │
     │          ┌──────────┐
     │          │COMPLETADA│
     │          │          │
     │          │Máximo    │
     │          │alcanzado │
     │          └──────────┘
     │
     └──► Esperar a siguiente
          verificación
          (5 minutos)
```

---

## Secuencia Temporal Típica

```
Minuto 00:00 ├─ Verificación periódica
            ├─ getInsumosConStockBajo()
            ├─ Detecta Arroz con stock crítico
            ├─ Crea AlertasInventario (contador=1)
            ├─ Envía Telegram "Notificación 1/3"
            ├─ Registra en AuditAlertas
            └─ Log: "✅ Alerta enviada"

Minuto 05:00 ├─ Siguiente verificación
            ├─ Arroz sigue con stock bajo
            ├─ Obtiene alerta existente (contador=1)
            ├─ contador < 3, así que envía
            ├─ UPDATE contador = 2
            ├─ Envía Telegram "Notificación 2/3"
            └─ Registra en AuditAlertas

Minuto 10:00 ├─ Tercera verificación
            ├─ Arroz sigue bajo
            ├─ contador = 2
            ├─ Envía Telegram "Notificación 3/3"
            ├─ UPDATE contador = 3
            └─ Registra en AuditAlertas

Minuto 11:30 ├─ Cocinera inicia sesión
            ├─ updateLastActivity middleware
            ├─ Detecta rol = 'Cocinera'
            ├─ obtenerAlertasActivas()
            ├─ Encuentra alerta de Arroz
            ├─ marcarComoResuelta()
            ├─ UPDATE estado = 'resuelta'
            └─ Sistema DETIENE alertas de Arroz

Minuto 15:00 ├─ Siguiente verificación
            ├─ getAlertasActivas()
            ├─ NO incluye Arroz (estado='resuelta')
            └─ Sin nuevos envíos para Arroz
```

---

## Manejo de Errores

```
┌─────────────────────────────────┐
│   Operación (verificar/enviar)  │
└────────────┬────────────────────┘
             │
             ▼
      ¿Éxito?
      ├─ SÍ ───► Registrar en AuditAlertas
      │         └─ estado_envio = 'enviado'
      │
      └─ NO ───► console.error()
                ├─ Log error
                ├─ Registrar en AuditAlertas
                │  └─ estado_envio = 'error'
                └─ Continuar con siguiente
                   (no bloquear)
```

---

## Endpoints API Mapeados

```
POST   /api/alertas-inventario/inicializar
       └─ Inicia servicio automático

GET    /api/alertas-inventario/activas
       └─ Obtiene AlertasInventarioModel.getAlertasActivas()

GET    /api/alertas-inventario/estadisticas
       └─ Obtiene AlertaInventarioModel.getEstadisticas()

GET    /api/alertas-inventario/:id_insumo
       └─ Obtiene AlertaInventarioModel.getAlertas({id_insumo})

PATCH  /api/alertas-inventario/:id_insumo/resolver
       └─ alertasService.resolverAlertaCocineraIngresa()

POST   /api/alertas-inventario/config/tiempo-verificacion
       └─ alertasService.cambiarTiempoVerificacion()

GET    /api/alertas-inventario/config/estado
       └─ alertasService.obtenerEstado()

POST   /api/alertas-inventario/verificar/manual
       └─ alertasService.verificarYEnviarAlertas()

POST   /api/alertas-inventario/control/detener
       └─ alertasService.detenerVerificacion()
```

---

## Dependencias Externas

```
┌──────────────────────────────────┐
│      node-telegram-bot-api       │
│                                  │
│ - Comunicación con Telegram      │
│ - Envío de mensajes              │
│ - Recepción de comandos          │
└────────────────┬─────────────────┘
                 │
                 └─ telegramService.js
                    └─ Abstracción de Telegram

┌──────────────────────────────────┐
│           MySQL Driver           │
│     (mysql2 o similar)           │
│                                  │
│ - Conexión a BD                  │
│ - Queries preparados             │
│ - Pool de conexiones             │
└────────────────┬─────────────────┘
                 │
                 └─ db.js
                    └─ Connection object
```

---

## Almacenamiento de Estado

```
En Memoria:
├─ alertasService.isRunning (boolean)
├─ alertasService.intervalo (timer ID)
├─ alertasService.tiempoVerificacion (milisegundos)
└─ telegramService.bot (Telegram Bot instance)

En Base de Datos:
├─ AlertasInventario
│  ├─ Estado actual de alertas
│  ├─ Contador de envíos
│  └─ Timestamps
├─ AuditAlertas
│  ├─ Registro de cada envío
│  └─ Mensajes enviados
└─ Inventarios (existente)
   └─ Stock y estado
```

---

## Escalabilidad Futura

```
Posibles mejoras:

1. Múltiples canales:
   ├─ Email adicional
   ├─ SMS
   ├─ WhatsApp
   └─ Discord

2. Configuración avanzada:
   ├─ Alertas por usuario
   ├─ Alertas por insumo
   ├─ Diferentes umbrales
   └─ Horarios de silencio

3. Machine Learning:
   ├─ Predicción de stock
   ├─ Patrones de consumo
   └─ Alertas inteligentes

4. Real-time:
   ├─ WebSocket
   ├─ Server-Sent Events
   └─ Notificaciones en vivo
```

---

**Diagrama actualizado:** 26 de Noviembre de 2025
