#!/bin/bash

# Script para verificar que los contadores de alerta funcionan correctamente

echo "🔍 Verificando secuencia de alertas..."
echo "======================================"

DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="xenopus"
DB_NAME="Comedor"

# Limpiar alertas previas
echo "🗑️  Limpiando alertas previas..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DELETE FROM AlertasInventario;
DELETE FROM AuditAlertas;
" 2>/dev/null

# Crear un insumo en estado crítico
echo "🔴 Creando insumo en estado CRÍTICO..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
UPDATE Inventarios 
SET cantidadActual = 0.5
WHERE id_insumo = 1;

UPDATE Inventarios 
SET estado = 'Critico'
WHERE id_insumo = 1;
" 2>/dev/null

echo ""
echo "📊 Estado actual del insumo 1:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SELECT 
  id_insumo,
  nombreInsumo,
  cantidadActual,
  nivelMinimoAlerta,
  ROUND((cantidadActual / nivelMinimoAlerta) * 100, 2) as porcentaje,
  estado
FROM Inventarios i
JOIN Insumos ins ON i.id_insumo = ins.id_insumo
WHERE i.id_insumo = 1;
" 2>/dev/null

echo ""
echo "⏳ Las alertas se generarán en las próximas 3 verificaciones periódicas..."
echo ""
echo "📝 Sigue el progreso con este comando:"
echo "   mysql -u root -p Comedor -e \"SELECT contador_envios, estado FROM AlertasInventario WHERE id_insumo = 1;\""
echo ""
echo "🔔 Esperado:"
echo "   Primer ciclo:  contador = 1, estado = activa"
echo "   Segundo ciclo: contador = 2, estado = activa"
echo "   Tercer ciclo:  contador = 3, estado = completada"
echo ""
