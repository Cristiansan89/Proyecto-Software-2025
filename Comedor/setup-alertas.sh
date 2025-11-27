#!/bin/bash

# Script para configurar e inicializar el Sistema de Alertas de Inventario

echo "🚀 Configurando Sistema de Alertas de Inventario..."
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paso 1: Verificar conexión a Base de Datos
echo -e "${YELLOW}[1/5]${NC} Verificando acceso a Base de Datos..."
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅${NC} MySQL está instalado"
else
    echo -e "${RED}❌${NC} MySQL no está instalado"
    exit 1
fi

# Paso 2: Crear tablas
echo ""
echo -e "${YELLOW}[2/5]${NC} Creando tablas de alertas..."

if [ -f ".env" ]; then
    # Extraer credenciales del .env
    DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2)
    DB_USER=$(grep "^DB_USER=" .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
    DB_NAME=$(grep "^DB_NAME=" .env | cut -d '=' -f2)
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        echo -e "${YELLOW}⚠️${NC} Variables de BD incompletas en .env"
        echo "   Por favor, configura DB_HOST, DB_USER, DB_PASSWORD y DB_NAME"
        exit 1
    fi
    
    # Crear tablas
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < server/sql/alertas_inventario.sql 2>/dev/null
    else
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < server/sql/alertas_inventario.sql 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC} Tablas creadas/actualizadas correctamente"
    else
        echo -e "${YELLOW}⚠️${NC} No se pudieron crear las tablas automáticamente"
        echo "   Ejecuta manualmente:"
        echo "   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < server/sql/alertas_inventario.sql"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Archivo .env no encontrado, omitiendo creación de tablas"
    echo "   Ejecuta manualmente después de configurar .env:"
    echo "   mysql -u usuario -p basedatos < server/sql/alertas_inventario.sql"
fi

# Paso 3: Verificar variables de entorno
echo ""
echo -e "${YELLOW}[3/5]${NC} Verificando variables de entorno..."
if [ -f ".env" ]; then
    MISSING_VARS=0
    if ! grep -q "TELEGRAM_BOT_TOKEN" .env; then
        echo -e "${YELLOW}⚠️${NC} TELEGRAM_BOT_TOKEN no configurado"
        MISSING_VARS=1
    fi
    if ! grep -q "TELEGRAM_CHAT_ID" .env; then
        echo -e "${YELLOW}⚠️${NC} TELEGRAM_CHAT_ID no configurado"
        MISSING_VARS=1
    fi
    
    if [ $MISSING_VARS -eq 0 ]; then
        echo -e "${GREEN}✅${NC} Variables de Telegram configuradas"
    else
        echo ""
        echo "Para usar alertas por Telegram, agrega:"
        echo "TELEGRAM_BOT_TOKEN=tu_token_aqui"
        echo "TELEGRAM_CHAT_ID=tu_chat_id_aqui"
        echo ""
        echo "Para obtener el token: https://t.me/BotFather"
        echo ""
    fi
else
    echo -e "${RED}❌${NC} Archivo .env no encontrado"
    echo "   Crea un archivo .env en el directorio raíz del servidor"
fi

# Paso 4: Instalar dependencias (si es necesario)
echo ""
echo -e "${YELLOW}[4/5]${NC} Verificando dependencias Node..."
cd server
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} Dependencias ya están instaladas"
else
    echo -e "${YELLOW}⚠️${NC} Instalando dependencias..."
    npm install
fi
cd ..

# Paso 5: Verificar sintaxis
echo ""
echo -e "${YELLOW}[5/5]${NC} Verificando sintaxis del servidor..."
if node -c server/app.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Sintaxis correcta"
else
    echo -e "${RED}❌${NC} Error de sintaxis en app.js"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Configuración completada${NC}"
echo "=================================================="
echo ""
echo "Próximos pasos:"
echo "1. Inicia el servidor: npm run dev"
echo "2. El sistema de alertas se inicializará automáticamente"
echo "3. Verifica el estado: GET /api/alertas-inventario/config/estado"
echo ""
echo "Documentación disponible en:"
echo "- ALERTAS_INVENTARIO_README.md"
echo "- IMPLEMENTACION_ALERTAS.md"
echo ""
