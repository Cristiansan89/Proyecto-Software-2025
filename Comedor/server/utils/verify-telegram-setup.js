/**
 * Script de Verificación del Sistema Telegram
 * Ejecutar: node -r dotenv/config utils/verify-telegram-setup.js
 * 
 * Verifica que todos los componentes necesarios para los callbacks de Telegram
 * estén correctamente configurados e importables.
 */

import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [];
const errors = [];

// Utilidad para añadir tests
function addTest(name, test) {
  tests.push({ name, test });
}

// Ejecutar un test con manejo de errores
async function runTest(name, test) {
  try {
    console.log(`\n⏳ Verificando: ${name}`);
    const result = await test();
    if (result.success) {
      console.log(`✅ ${name}: ${result.message}`);
      return true;
    } else {
      console.log(`❌ ${name}: ${result.message}`);
      errors.push({ test: name, error: result.message });
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    errors.push({ test: name, error: error.message });
    return false;
  }
}

// TEST 1: Verificar variables de entorno
addTest('Variables de Entorno', async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN_SISTEMA;
  if (!token) {
    return {
      success: false,
      message: 'TELEGRAM_BOT_TOKEN_SISTEMA no está definido en .env'
    };
  }
  if (token.length < 10) {
    return {
      success: false,
      message: `Token muy corto (${token.length} caracteres). Verifica .env`
    };
  }
  return {
    success: true,
    message: `Token encontrado (${token.substring(0, 5)}...${token.substring(-5)})`
  };
});

// TEST 2: Verificar archivo telegramService.js
addTest('Archivo telegramService.js', async () => {
  const filepath = path.join(__dirname, '..', 'services', 'telegramService.js');
  const exists = await fs.stat(filepath).then(() => true).catch(() => false);
  if (!exists) {
    return { success: false, message: `No encontrado en ${filepath}` };
  }
  return { success: true, message: `Archivo encontrado` };
});

// TEST 3: Importar telegramService
addTest('Importar telegramService', async () => {
  try {
    const { default: telegramService } = await import('../services/telegramService.js');
    if (!telegramService) {
      return { success: false, message: 'Importación returned null' };
    }
    if (typeof telegramService.initialize !== 'function') {
      return { success: false, message: 'No tiene método initialize()' };
    }
    return { success: true, message: 'Importado correctamente con método initialize()' };
  } catch (error) {
    return { success: false, message: `Error al importar: ${error.message}` };
  }
});

// TEST 4: Verificar archivo alertasInventarioService.js
addTest('Archivo alertasInventarioService.js', async () => {
  const filepath = path.join(__dirname, '..', 'services', 'alertasInventarioService.js');
  const exists = await fs.stat(filepath).then(() => true).catch(() => false);
  if (!exists) {
    return { success: false, message: `No encontrado en ${filepath}` };
  }
  return { success: true, message: `Archivo encontrado` };
});

// TEST 5: Importar alertasInventarioService
addTest('Importar alertasInventarioService', async () => {
  try {
    const { default: alertasService } = await import('../services/alertasInventarioService.js');
    if (!alertasService) {
      return { success: false, message: 'Importación returned null' };
    }
    if (typeof alertasService.darVisto !== 'function') {
      return { success: false, message: 'No tiene método darVisto()' };
    }
    if (typeof alertasService.realizarPedidoAutomatico !== 'function') {
      return { success: false, message: 'No tiene método realizarPedidoAutomatico()' };
    }
    return { success: true, message: 'Métodos darVisto() y realizarPedidoAutomatico() encontrados' };
  } catch (error) {
    return { success: false, message: `Error al importar: ${error.message}` };
  }
});

// TEST 6: Verificar AlertaInventarioModel
addTest('Importar AlertaInventarioModel', async () => {
  try {
    const { AlertaInventarioModel } = await import('../models/alertaInventario.js');
    if (!AlertaInventarioModel) {
      return { success: false, message: 'Importación returned null' };
    }
    if (typeof AlertaInventarioModel.actualizarEstado !== 'function') {
      return { success: false, message: 'No tiene método actualizarEstado()' };
    }
    return { success: true, message: 'Método actualizarEstado() encontrado' };
  } catch (error) {
    return { success: false, message: `Error al importar: ${error.message}` };
  }
});

// TEST 7: Verificar PedidoModel
addTest('Importar PedidoModel', async () => {
  try {
    const { PedidoModel } = await import('../models/pedido.js');
    if (!PedidoModel) {
      return { success: false, message: 'Importación returned null' };
    }
    if (typeof PedidoModel.create !== 'function') {
      return { success: false, message: 'No tiene método create()' };
    }
    return { success: true, message: 'Método create() encontrado' };
  } catch (error) {
    return { success: false, message: `Error al importar: ${error.message}` };
  }
});

// TEST 8: Verificar LineaPedidoModel
addTest('Importar LineaPedidoModel', async () => {
  try {
    const { LineaPedidoModel } = await import('../models/lineapedido.js');
    if (!LineaPedidoModel) {
      return { success: false, message: 'Importación returned null' };
    }
    if (typeof LineaPedidoModel.create !== 'function') {
      return { success: false, message: 'No tiene método create()' };
    }
    return { success: true, message: 'Método create() encontrado' };
  } catch (error) {
    return { success: false, message: `Error al importar: ${error.message}` };
  }
});

// TEST 9: Verificar conexión a BD
addTest('Conexión a Base de Datos', async () => {
  try {
    const { connection } = await import('../models/db.js');
    const [result] = await connection.query('SELECT 1+1 as test');
    if (!result || result.length === 0) {
      return { success: false, message: 'Query devolvió resultado vacío' };
    }
    return { success: true, message: 'Conexión a MySQL funciona' };
  } catch (error) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
});

// TEST 10: Verificar tabla AlertasInventario
addTest('Tabla AlertasInventario', async () => {
  try {
    const { connection } = await import('../models/db.js');
    const [result] = await connection.query(
      `SELECT * FROM AlertasInventario LIMIT 1`
    );
    return { success: true, message: `Tabla encontrada (${result.length} registros)` };
  } catch (error) {
    return { success: false, message: `Error accediendo tabla: ${error.message}` };
  }
});

// TEST 11: Probar método darVisto() con ID ficticio
addTest('Probar darVisto() con ID ficticio', async () => {
  try {
    const { default: alertasService } = await import('../services/alertasInventarioService.js');
    
    // Intentar dar visto a IDs que probablemente no existan
    const resultado = await alertasService.darVisto("999999,999998");
    
    if (typeof resultado !== 'object') {
      return { success: false, message: 'darVisto() no retornó un objeto' };
    }
    
    if (!('success' in resultado)) {
      return { success: false, message: 'Respuesta no tiene propiedad "success"' };
    }
    
    // Aunque falle en BD, si retorna con éxito la estructura, el método funciona
    return {
      success: true,
      message: `Método ejecutable. Respuesta: success=${resultado.success}, message="${resultado.message}"`
    };
  } catch (error) {
    return { success: false, message: `Error ejecutando darVisto(): ${error.message}` };
  }
});

// TEST 12: Verificar setupCallbackHandlers
addTest('Método setupCallbackHandlers', async () => {
  try {
    const { default: telegramService } = await import('../services/telegramService.js');
    if (typeof telegramService.setupCallbackHandlers !== 'function') {
      return { success: false, message: 'No existe setupCallbackHandlers()' };
    }
    return { success: true, message: 'Método existe y es callable' };
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

// Función principal
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔧 VERIFICADOR DE INSTALACIÓN - TELEGRAM CALLBACKS');
  console.log(`${'='.repeat(60)}`);
  
  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    const result = await runTest(name, test);
    if (result) passed++; else failed++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESULTADOS: ${passed} ✅ | ${failed} ❌`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('✅ ¡Todos los tests pasaron! El sistema está listo para usar callbacks de Telegram.');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Asegúrate de que el servidor está corriendo: npm run dev');
    console.log('2. Abre Telegram y busca el bot: SistemaComedor_Bot');
    console.log('3. Presiona un botón (Dar visto / Realizar Pedido)');
    console.log('4. Revisa los logs en la consola del servidor');
    console.log('\nPara debugging detallado, consulta: server/DEBUG_TELEGRAM.md');
    process.exit(0);
  } else {
    console.log('❌ Hay problemas que deben solucionarse:');
    errors.forEach(({ test, error }) => {
      console.log(`\n❌ ${test}:`);
      console.log(`   ${error}`);
    });
    console.log('\n📝 Para más información, revisa: server/DEBUG_TELEGRAM.md');
    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
