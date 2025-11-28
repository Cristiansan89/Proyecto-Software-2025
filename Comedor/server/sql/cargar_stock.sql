-- Script para cargar stock en todos los insumos
-- Establecer cantidades a valores normales/altos

UPDATE Inventarios 
SET 
  cantidadActual = stockMaximo * 0.8,
  fechaUltimaActualizacion = NOW(),
  estado = CASE 
    WHEN stockMaximo * 0.8 <= 0 THEN 'Agotado'
    WHEN stockMaximo * 0.8 <= (nivelMinimoAlerta * 0.02) THEN 'Critico'
    WHEN stockMaximo * 0.8 <= nivelMinimoAlerta THEN 'Bajo'
    ELSE 'Normal'
  END;

-- Verificar que se actualizaron correctamente
SELECT 
  i.id_insumo,
  ins.nombreInsumo,
  i.cantidadActual,
  i.nivelMinimoAlerta,
  i.stockMaximo,
  i.estado,
  ROUND((i.cantidadActual / i.nivelMinimoAlerta) * 100, 2) as porcentaje_del_minimo
FROM Inventarios i
JOIN Insumos ins ON i.id_insumo = ins.id_insumo
ORDER BY i.estado, ins.nombreInsumo;
