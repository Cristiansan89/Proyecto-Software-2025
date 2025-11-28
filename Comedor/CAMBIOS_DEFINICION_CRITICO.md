# Actualización: Definición de Estado Crítico

## Cambio Realizado

Se ha actualizado la definición del estado **"Crítico"** de inventario de acuerdo a la especificación: **"El estado crítico es por debajo del 2%"**.

## Niveles de Stock Actuales

| Estado      | Condición                                     | Alerta    |
| ----------- | --------------------------------------------- | --------- |
| **Agotado** | Cantidad ≤ 0                                  | ❌ No     |
| **Crítico** | Cantidad ≤ (Nivel Mínimo × 0.02)              | ✅ **SÍ** |
| **Bajo**    | Nivel Mínimo × 0.02 < Cantidad ≤ Nivel Mínimo | ⚠️ No     |
| **Normal**  | Cantidad > Nivel Mínimo                       | ✅ OK     |

## Archivos Modificados

### 1. Backend - Lógica de Cálculo

#### `server/models/inventario.js`

**Método:** `updateEstadoByNiveles()`

**Cambio:**

```sql
-- Antes:
WHEN cantidadActual <= nivelMinimoAlerta THEN 'Critico'

-- Ahora:
WHEN cantidadActual <= (nivelMinimoAlerta * 0.02) THEN 'Critico'
WHEN cantidadActual <= nivelMinimoAlerta THEN 'Bajo'
```

**Método:** `getInsumosConStockBajo()`

**Cambio:**

```sql
-- Antes:
WHERE i.estado IN ('Agotado', 'Critico')

-- Ahora:
WHERE i.estado IN ('Agotado', 'Critico', 'Bajo')
```

#### `server/models/movimientoinventario.js`

**Método:** Actualización de estado en transacciones

Mismo cambio que en `inventario.js` para mantener consistencia.

### 2. Servicio de Alertas

#### `server/services/alertasInventarioService.js`

**Método:** `verificarYEnviarAlertas()`

**Cambio:**

```javascript
// Antes:
const insumosConStockBajo = await InventarioModel.getInsumosConStockBajo();

// Ahora:
const insumosConStockBajo = await InventarioModel.getInsumosConStockBajo();

// Filtrar solo los que están en estado Crítico
const insumosCriticos = insumosConStockBajo.filter(
  (i) => i.estado === "Critico"
);
```

**Impacto:** Ahora solo genera alertas de Telegram para insumos en estado Crítico, no para estado Bajo.

### 3. Documentación

#### `ALERTAS_INVENTARIO_README.md`

- Agregada nueva sección "Niveles de Stock" con tabla explicativa
- Ejemplo práctico de cálculo (Arroz con nivel mínimo 100 kg → Crítico a 2 kg)

#### `IMPLEMENTACION_ALERTAS.md`

- Actualizado "Flujo de Funcionamiento" para especificar filtrado a estado Crítico
- Clarificado que solo se detectan insumos Críticos

#### `ARQUITECTURA_ALERTAS.md`

- Actualizada sección "Detección de Stock Bajo" con filtrado a 2%
- Modificado diagrama de tabla Inventarios con los 4 estados
- Especificado que tipo_alerta es solo "Critico"

## Ejemplo Práctico

### Insumo: Arroz

- **Nivel Mínimo:** 100 kg
- **Umbral Crítico:** 100 × 0.02 = **2 kg**

#### Escenarios:

| Stock Actual | Estado  | ¿Alerta? | Detalles                              |
| ------------ | ------- | -------- | ------------------------------------- |
| 150 kg       | Normal  | ❌       | Abastecimiento completo               |
| 80 kg        | Bajo    | ❌       | Por debajo del mínimo pero no crítico |
| 2 kg         | Crítico | ✅       | **Genera alerta Telegram**            |
| 0 kg         | Agotado | ❌       | Completamente sin stock               |

## Impacto en el Sistema

### Antes de cambio

- 65 insumos generaban alertas (todos los que estaban ≤ nivel mínimo)
- Demasiadas alertas, posible saturación de notificaciones

### Después de cambio

- Solo insumos en estado **Crítico** generan alertas
- Alertas más precisas y relevantes
- Reduce notificaciones a solo situaciones verdaderamente críticas
- Insumos en "Bajo" se monitorean pero no generan alertas automáticas

## Base de Datos

**No requiere cambios en tablas existentes:**

- Las columnas ya existen
- Solo cambia la lógica de cálculo de `estado`
- La tabla `Inventarios` ya tiene la columna `nivelMinimoAlerta`

## Requisitos Posteriores

1. **Actualizar datos existentes:** Ejecutar

   ```sql
   UPDATE Inventarios SET estado = 'Normal'
   WHERE estado IN ('Bajo', 'Critico', 'Agotado');

   UPDATE Inventarios
   SET estado = CASE
       WHEN cantidadActual <= 0 THEN 'Agotado'
       WHEN cantidadActual <= (nivelMinimoAlerta * 0.02) THEN 'Critico'
       WHEN cantidadActual <= nivelMinimoAlerta THEN 'Bajo'
       ELSE 'Normal'
   END;
   ```

2. **Reiniciar servidor** para aplicar cambios:

   ```bash
   npm run dev
   ```

3. **Verificar alertas nuevas** accediendo a:
   ```
   GET /api/alertas-inventario/activas
   ```

## Verificación

### Ver insumos por estado

```sql
SELECT nombreInsumo, estado, cantidadActual, nivelMinimoAlerta
FROM Inventarios i
JOIN Insumos ins ON i.id_insumo = ins.id_insumo
WHERE i.estado != 'Normal'
ORDER BY i.estado DESC, nombreInsumo;
```

### Ver alertas generadas

```sql
SELECT * FROM AlertasInventario
WHERE estado = 'activa'
ORDER BY fecha_ultima_alerta DESC;
```

## Historial de Versiones

| Versión | Fecha      | Cambio                                                  |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0.0   | 26/11/2025 | Alertas para estado ≤ nivelMinimoAlerta                 |
| 1.1.0   | 26/11/2025 | **Alertas solo para estado ≤ nivelMinimoAlerta × 0.02** |

---

**Actualización realizada:** 26 de Noviembre de 2025  
**Aprobado por:** Especificación de requisitos  
**Status:** ✅ Implementado y Documentado
