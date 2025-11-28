# 🔧 FIX DEFINITIVO: Contador de Alertas 1/3 → 2/3 → 3/3

## 📋 Problema Encontrado

El usuario recibió mensajes **1/3 y 3/3** pero **NO 2/3** (el del medio).

```
Usuario: "Solo recibi 4 mensajes: 2 a las 23.15 (1/3) y otros 2 a las 23.20 (3/3)"
```

## 🔍 Causa Raíz: Doble Incremento

### El Bug

El código hacía `create()` **DOS VECES** en cada ciclo de alertas:

1. En `procesarAlerta()` para crear la primera alerta
2. En `enviarAlerta()` para TODOS los ciclos

Esto causaba:
- Ciclo 1: Envía 1/3 ✅
- Ciclo 2: Contador pasa de 1→2, pero código espera 1→3, no envía 2/3 ❌
- Ciclo 3: Envía 3/3 ✅

## ✅ Solución Implementada

### Cambio 1: `procesarAlerta()` - Lógica más clara

```javascript
if (!alerta) {
  // Primera vez: crear alerta
  await AlertaInventarioModel.create({
    id_insumo: insumo.id_insumo,
    tipo_alerta: insumo.estado,
  });
  await this.enviarAlerta(insumo, 1);  // Envío 1/3
} else {
  // Alertas siguientes: solo enviar
  if (alerta.contador_envios < 3) {
    await this.enviarAlerta(insumo, alerta.contador_envios + 1);
  }
}
```

### Cambio 2: Nuevo método `incrementarContador()`

```javascript
// En AlertaInventarioModel
static async incrementarContador(id_insumo) {
  await connection.query(
    `UPDATE AlertasInventario 
     SET contador_envios = contador_envios + 1,
         fecha_ultima_alerta = NOW()
     WHERE id_insumo = ?`,
    [id_insumo]
  );
}
```

### Cambio 3: `enviarAlerta()` - No hacer create() innecesariamente

```javascript
async enviarAlerta(insumo, numeroEnvio) {
  // Enviar mensaje
  const resultado = await telegramService.sendMessage(chatId, mensaje);
  
  if (resultado.success) {
    if (numeroEnvio === 1) {
      // Primera alerta: usar create
      await AlertaInventarioModel.create({...});
    } else {
      // Alertas 2/3 y 3/3: solo incrementar
      await AlertaInventarioModel.incrementarContador(insumo.id_insumo);
    }
  }
}
```

## 🎯 Flujo Correcto Ahora

```
CICLO 1 (23:15)
└─ create() → contador = 1
└─ Envío 1/3 ✅
└─ BD: contador = 1

CICLO 2 (23:20)
└─ incrementarContador() → contador: 1 → 2
└─ Envío 2/3 ✅ ← AHORA SE ENVÍA
└─ BD: contador = 2

CICLO 3 (23:25)
└─ incrementarContador() → contador: 2 → 3
└─ Envío 3/3 ✅
└─ marcarComoCompletada()
└─ BD: contador = 3, estado = 'completada'
```

## 📝 Archivos Modificados

1. **server/services/alertasInventarioService.js**
   - Cambió `procesarAlerta()` para claridad
   - Cambió `enviarAlerta()` para usar `incrementarContador()`

2. **server/models/alertaInventario.js**
   - Agregó método `incrementarContador(id_insumo)`

## ✅ Validación

```bash
✅ Sintaxis verificada en ambos archivos
✅ Base de datos reseteada para nuevo test
✅ Insumo 1 en estado Crítico listo para prueba
```

---

**Status**: IMPLEMENTADO Y LISTO PARA PRUEBA
