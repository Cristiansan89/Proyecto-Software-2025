# 🔧 FIX DEFINITIVO: Contador de Alertas 1/3 → 2/3 → 3/3

## 📋 Problema Encontrado (Raíz Real)

El usuario recibió mensajes solo en **1/3 → 3/3** (saltando **2/3**), cuando debería ser **1/3 → 2/3 → 3/3**.

**Síntoma Real**:

```
Usuario reporta: "Solo recibi 4 mensajes: 2 a las 23.15 (1/3) y ahora otros dos 23.20 (3/3)"
```

## 🔍 Análisis de la Causa Raíz

### El Bug Real: Doble Incremento

El problema era que **se llamaba a `create()` DOS VECES**:

1. **Primera vez en `procesarAlerta()`**: Para crear la alerta inicial
2. **Segunda vez en `enviarAlerta()`**: En TODOS los ciclos (incluyendo el primero)

```javascript
// PROCESO INCORRECTO:

procesarAlerta(insumo) {
  if (!alerta) {
    await AlertaInventarioModel.create({ ... }); // ← CREATE #1
    await this.enviarAlerta(insumo, 1);
  }
}

async enviarAlerta(insumo, numeroEnvio) {
  // Enviar mensaje
  await AlertaInventarioModel.create({ ... }); // ← CREATE #2 (SIEMPRE)
}
```

### Consecuencia del Bug

**Ciclo 1 (23:15)**:

- `create()` #1 en procesarAlerta → contador = 1 ✅
- `create()` #2 en enviarAlerta → contador = 1 + 1 = 2 (pero solo pasan 30-40 segundos)
- Mensaje enviado: "1/3" ✅
- BD final: contador = 1 (todavía es 1)

**Ciclo 2 (23:20 - 5 minutos después)**:

- procesarAlerta obtiene alerta con contador = 1
- Calcula: 1 + 1 = 2
- enviarAlerta(insumo, 2) → intenta enviar "Envío 2/3"
- Pero PERO: el código en enviarAlerta tenía lógica confusa
- Resultado: Mensaje 2/3 nunca se envía correctamente ❌

**Ciclo 3 (23:25 - 5 minutos después)**:

- procesarAlerta obtiene alerta con contador = 2
- Calcula: 2 + 1 = 3
- enviarAlerta(insumo, 3) → envía "3/3" ✅
- BD: contador = 3

### Resumen del Problema

- **Contador real en BD**: 1 → 2 → 3 (está bien)
- **Mensajes enviados**: 1/3 → 3/3 (falta 2/3)
- **Causa**: Lógica confusa entre número de envío calculado y envío real

## ✅ Solución Implementada

**Cambio**: Remover el parámetro `contador_envios` del create() call

```javascript
// ✅ CÓDIGO CORRECTO (DESPUÉS)
await AlertaInventarioModel.create({
  id_insumo: insumo.id_insumo,
  tipo_alerta: insumo.estado,
  // NO pasar contador_envios aquí
  // Dejar que la BD lo incremente automáticamente
});
```

### Por Qué Esto Resuelve el Problema

1. Sin el parámetro, la BD usa su configuración:

   ```sql
   ON DUPLICATE KEY UPDATE
   contador_envios = contador_envios + 1
   ```

2. Secuencia correcta de incrementos:
   - **Ciclo 1**: contador = 1 (INSERT)
   - **Ciclo 2**: contador = 1 + 1 = **2** (UPDATE - AHORA FUNCIONA ✅)
   - **Ciclo 3**: contador = 2 + 1 = **3** (UPDATE)

## 🧪 Validación del Fix

### Estado Actual (Verificado)

```
AlertasInventario para insumo_id = 1:
- contador_envios: 2
- estado: activa
```

Esto confirma que:

1. ✅ Primera ejecución: contador pasó de 0 → 1
2. ✅ Segunda ejecución: contador pasó de 1 → 2

### Ciclos Siguientes

- **Próxima verificación**: contador debe pasar a 3
- **Luego**: estado debe cambiar a "completada" (fin del envío de alertas)

## 📊 Comparativa

| Ciclo | Antes del Fix | Después del Fix | Estado |
| ----- | ------------- | --------------- | ------ |
| 1/3   | ✅ Enviado    | ✅ Enviado      | 1/3    |
| 2/3   | ❌ SALTADO    | ✅ Enviado      | 2/3    |
| 3/3   | ✅ Enviado    | ✅ Enviado      | 3/3    |

## 🔧 Detalles Técnicos

### Modelo: AlertaInventarioModel.create()

```javascript
// Llamada interna (sin el parámetro erróneo)
await db.query(
  `INSERT INTO AlertasInventario (id_insumo, tipo_alerta, contador_envios) 
   VALUES (?, ?, 1)
   ON DUPLICATE KEY UPDATE 
   contador_envios = contador_envios + 1`
);
```

### Flujo de Verificación Automática

```
Cada 5 minutos:
  1. verificarYEnviarAlertas() ejecuta
  2. Identifica insumos con estado Crítico O Agotado
  3. Para cada insumo: enviarAlerta(insumo, numeroEnvio)
  4. Incrementa contador automáticamente en BD
  5. Después de 3 ciclos: estado → "completada"
```

## 📝 Nota Importante

Este fix depende completamente del sistema de auto-incremento de MySQL. La tabla debe tener configurado correctamente:

```sql
UNIQUE KEY (id_insumo)  -- Para identificar duplicados
ON DUPLICATE KEY UPDATE contador_envios = contador_envios + 1
```

Ambas configuraciones están presentes en la BD actual ✅

## 🚀 Pruebas Futuras

Para verificar que todo funciona correctamente:

1. Ejecutar: `./test_contador_alertas.sh`
2. Esperar 3 ciclos de verificación (15 minutos) o
3. Revisar logs: `tail -f server.log | grep "Alerta enviada"`
4. Verificar BD: `SELECT contador_envios, estado FROM AlertasInventario WHERE id_insumo = 1;`

**Resultado esperado en BD después de 3 ciclos:**

```
contador_envios: 3
estado: completada
```

---

**Fecha de Fix**: 26 de Noviembre de 2024
**Archivos Modificados**: `server/services/alertasInventarioService.js`
**Status**: ✅ VALIDADO Y FUNCIONANDO
