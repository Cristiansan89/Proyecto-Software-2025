#!/bin/bash

# Script para iniciar el proyecto con ngrok
# Uso: bash ngrok-setup.sh

# ============================================================
# CONFIGURACIÓN CENTRALIZADA DE PUERTO NGROK
# Cambiar este valor para apuntar ngrok a un puerto diferente.
#
# Puerto 5175 (RECOMENDADO): expone el cliente Vite.
#   - Los enlaces de asistencia usan window.location.origin → funciona.
#   - Las llamadas a /api/* son proxiadas por Vite al puerto 3000 → funciona.
#   - Las alertas de insumos que llaman a /api también pasan por el proxy.
#
# Puerto 3000: expone el backend directamente (solo si el cliente
#   no necesita ser accedido desde afuera via ngrok).
# ============================================================
NGROK_PORT=5175

echo "🚀 Iniciando Comedor App con ngrok..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Paso 1: Iniciando servidor backend...${NC}"
cd server
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo -e "${GREEN}✓ Servidor iniciado (PID: $SERVER_PID)${NC}"
echo "  Logs disponibles en: /tmp/server.log"
sleep 2

cd ..

echo ""
echo -e "${YELLOW}Paso 2: Iniciando ngrok en puerto $NGROK_PORT...${NC}"
ngrok http $NGROK_PORT > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo -e "${GREEN}✓ ngrok iniciado (PID: $NGROK_PID)${NC}"
echo "  Logs disponibles en: /tmp/ngrok.log"
sleep 3

# Obtener la URL de ngrok
NGROK_URL=$(grep -oP 'https://[a-zA-Z0-9-]+\.ngrok-free\.dev' /tmp/ngrok.log | head -1)

if [ -z "$NGROK_URL" ]; then
  echo -e "${YELLOW}⚠ No se encontró URL de ngrok, espera unos segundos...${NC}"
  sleep 2
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -oP '"public_url":"https://[^"]*"' | sed 's/"public_url":"\(.*\)"/\1/')
fi

echo ""
echo -e "${YELLOW}Paso 3: Iniciando cliente...${NC}"
cd client
npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
echo -e "${GREEN}✓ Cliente iniciado (PID: $CLIENT_PID)${NC}"
echo "  Logs disponibles en: /tmp/client.log"

echo ""
echo "=================================="
echo -e "${GREEN}✓ Todo iniciado correctamente!${NC}"
echo "=================================="
echo ""
echo "URLs disponibles:"
echo -e "${GREEN}  • Desarrollo local:${NC} http://localhost:5175"
echo -e "${GREEN}  • ngrok:${NC} $NGROK_URL"
echo ""
echo "Desde smartphone:"
echo -e "${GREEN}  • Accede a:${NC} $NGROK_URL"
echo ""
echo "PIDs de procesos:"
echo "  • Server: $SERVER_PID"
echo "  • ngrok: $NGROK_PID"
echo "  • Client: $CLIENT_PID"
echo ""
echo "Para detener todos los procesos:"
echo "  kill $SERVER_PID $NGROK_PID $CLIENT_PID"
echo ""
echo "Logs en tiempo real:"
echo "  tail -f /tmp/server.log"
echo "  tail -f /tmp/ngrok.log"
echo "  tail -f /tmp/client.log"
