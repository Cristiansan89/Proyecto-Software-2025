#!/bin/bash

# Script para probar alertas de insumos agotados
# Uso: ./test_alerta_agotado.sh

echo "🔄 Prueba de Alerta para Insumos Agotados"
echo "=========================================="
echo ""

DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="xenopus"
DB_NAME="Comedor"

# Seleccionar un insumo aleatorio y ponerlo en estado Agotado
echo "1️⃣ Estableciendo un insumo en estado Agotado..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF

-- Seleccionar el primer insumo y ponerlo en agotado
UPDATE Inventarios 
SET 
  cantidadActual = 0,
  estado = 'Agotado',
  fechaUltimaActualizacion = NOW()
WHERE id_insumo = 1
LIMIT 1;

-- Mostrar el insumo actualizado
SELECT 
  id_insumo,
  nombreInsumo,
  cantidadActual,
  estado
FROM Inventarios
WHERE id_insumo = 1;

EOF

echo ""
echo "2️⃣ Limpiando alertas anteriores para este insumo..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF

DELETE FROM AlertasInventario WHERE id_insumo = 1;
DELETE FROM AuditAlertas WHERE id_insumo = 1;

SELECT 'Alertas limpias para id_insumo = 1' as resultado;

EOF

echo ""
echo "✅ Test completado!"
echo ""
echo "Instrucciones:"
echo "1. Inicia el servidor: npm run dev (en /server)"
echo "2. El sistema debería detectar el insumo agotado en 5 minutos"
echo "3. O ejecuta manualmente una verificación accediendo a:"
echo "   POST /api/alertas-inventario/verificar/manual"
echo ""
echo "Deberías recibir una alerta en Telegram con emoji 🚨 (AGOTADO)"
