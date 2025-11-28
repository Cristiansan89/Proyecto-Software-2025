#!/bin/bash

# Script para monitorear el progreso de alertas en tiempo real
# Muestra cómo el contador pasa de 1 → 2 → 3 cada 5 minutos

echo "📊 MONITOR DE ALERTAS EN TIEMPO REAL"
echo "===================================="
echo ""
echo "ℹ️  Este script verifica el estado de las alertas cada minuto"
echo "✅ Esperado: contador pasa de 1 → 2 → 3, estado: activa → completada"
echo ""

DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="xenopus"
DB_NAME="Comedor"

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar estado
mostrar_estado() {
    clear
    echo -e "${BLUE}📊 ESTADO DE ALERTAS ACTIVAS${NC}"
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================="
    echo ""
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null <<EOF
SELECT 
    CONCAT(
        CASE 
            WHEN contador_envios = 1 THEN '${YELLOW}[1/3]${NC}'
            WHEN contador_envios = 2 THEN '${YELLOW}[2/3]${NC}'
            WHEN contador_envios = 3 THEN '${GREEN}[3/3]${NC}'
            ELSE CONCAT('[', contador_envios, '/3]')
        END,
        ' ID:', id_insumo,
        ' | ', tipo_alerta,
        ' | Estado: ', estado,
        ' | Contador: ', contador_envios,
        ' | Creada: ', DATE_FORMAT(fecha_primera_alerta, '%H:%M:%S')
    ) as Info
FROM AlertasInventario
WHERE estado IN ('activa', 'completada')
ORDER BY contador_envios ASC;
EOF
    
    echo ""
    echo "================================="
    echo ""
    
    # Contar alertas por estado
    ACTIVAS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM AlertasInventario WHERE estado='activa';" 2>/dev/null)
    COMPLETADAS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM AlertasInventario WHERE estado='completada';" 2>/dev/null)
    
    echo -e "${YELLOW}Activas: $ACTIVAS${NC}  |  ${GREEN}Completadas: $COMPLETADAS${NC}"
    echo ""
    echo "Siguiendo el progreso..."
    echo "Presiona CTRL+C para salir"
}

# Loop principal
CICLO=0
while true; do
    CICLO=$((CICLO + 1))
    mostrar_estado
    
    echo ""
    echo "Ciclo de verificación #$CICLO"
    echo "Próxima actualización en 30 segundos..."
    sleep 30
done
