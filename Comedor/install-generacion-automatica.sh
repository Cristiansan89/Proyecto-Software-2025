#!/bin/bash

# Script de instalación - Generación Automática de Insumos y Pedidos
# Uso: bash install-generacion-automatica.sh

echo "🚀 Instalando dependencias para Generación Automática..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "server/package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró server/package.json${NC}"
    echo "Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Instalar node-schedule en el servidor
echo -e "${YELLOW}⏳ Instalando node-schedule en el servidor...${NC}"
cd server

if command -v pnpm &> /dev/null; then
    echo "📦 Usando pnpm..."
    pnpm add node-schedule@^2.1.1
elif command -v npm &> /dev/null; then
    echo "📦 Usando npm..."
    npm install node-schedule@^2.1.1
else
    echo -e "${RED}❌ Ni pnpm ni npm están instalados${NC}"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}✅ Instalación completada exitosamente${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Inicia el servidor: cd server && npm run dev"
echo "2. Accede a: http://localhost:5176"
echo "3. Ve a Administración → Parámetros del Sistema → Generación Automática"
echo "4. Configura día y hora para la generación automática"
echo "5. Haz clic en 'Guardar Configuración'"
echo ""
echo "📚 Documentación: Ver GENERACION_AUTOMATICA_README.md"
echo ""
