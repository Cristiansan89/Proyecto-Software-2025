/**
 * Función centralizada para construir mensajes de Telegram para notificaciones de pedidos
 * Asegura consistencia en todos los pedidos (manuales, reenviados y automatizados)
 * 
 * @param {Object} params - Parámetros del mensaje
 * @param {string} params.idPedido - ID del pedido (se mostrará truncado a 8 caracteres)
 * @param {string} params.fecha - Fecha del pedido (formato: DD/MM/YYYY)
 * @param {number} params.cantidadInsumos - Cantidad de insumos en el pedido
 * @param {string} params.enlace - URL de confirmación completa
 * @returns {string} Mensaje formateado para Telegram
 */
export function construirMensajePedidoTelegram({ idPedido, fecha, cantidadInsumos, enlace }) {
  const pedidoCorto = idPedido.substring(0, 8).toUpperCase();
  
  const mensaje = 
    `🛒 *NUEVO PEDIDO DE INSUMOS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Ha recibido un nuevo pedido del Sistema de Comedor Escolar.\n\n` +
    `📦 Detalles:\n` +
    `• Fecha: ${fecha}\n` +
    `• Insumos: ${cantidadInsumos} item(s)\n\n` +
    `📋 Pedido: \`${pedidoCorto}\`\n\n` +
    `⏰ Acción Requerida:\n` +
    `Por favor confirme la disponibilidad de los insumos en el siguiente enlace:\n\n` +
    `[✅ Confirmar Pedido](${enlace})\n\n` +
    `_Este enlace expira en 3 horas._\n\n` +
    `📝 Instrucciones:\n` +
    `1. Haga clic en el botón abajo\n` +
    `2. Revise cada insumo\n` +
    `3. Marque como Disponible o No Disponible\n` +
    `4. Envíe su confirmación\n\n` +
    `¡Gracias por su colaboración!`;

  return mensaje;
}

/**
 * Función para construir botones inline para Telegram
 * @param {string} enlace - URL de confirmación
 * @returns {Array} Array de arrays de botones para sendMessageWithButtons
 */
export function construirBotonesPedidoTelegram(enlace) {
  return [
    [
      {
        text: "✅ Confirmar Insumos",
        url: enlace,
      },
    ],
  ];
}
