#!/bin/bash

# EJEMPLOS DE PRUEBA - Sistema de Alertas de Inventario
# Estos ejemplos muestran cómo usar los endpoints del sistema de alertas

# Variables
BASE_URL="http://localhost:3000/api"
TOKEN="tu_token_aqui"  # Reemplaza con tu token JWT

echo "================================"
echo "EJEMPLOS DE PRUEBA - ALERTAS"
echo "================================"
echo ""

# 1. INICIALIZAR SERVICIO
echo "1️⃣ INICIALIZAR SERVICIO"
echo "POST /api/alertas-inventario/inicializar"
echo ""
curl -X POST \
  "$BASE_URL/alertas-inventario/inicializar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 2. OBTENER ALERTAS ACTIVAS
echo "2️⃣ OBTENER ALERTAS ACTIVAS"
echo "GET /api/alertas-inventario/activas"
echo ""
curl -X GET \
  "$BASE_URL/alertas-inventario/activas" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 3. OBTENER ESTADÍSTICAS
echo "3️⃣ OBTENER ESTADÍSTICAS"
echo "GET /api/alertas-inventario/estadisticas"
echo ""
curl -X GET \
  "$BASE_URL/alertas-inventario/estadisticas" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 4. OBTENER ALERTAS DE UN INSUMO
echo "4️⃣ OBTENER ALERTAS DE INSUMO (id=5)"
echo "GET /api/alertas-inventario/5"
echo ""
curl -X GET \
  "$BASE_URL/alertas-inventario/5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 5. RESOLVER ALERTA (cuando cocinera ingresa)
echo "5️⃣ RESOLVER ALERTA (id_insumo=5)"
echo "PATCH /api/alertas-inventario/5/resolver"
echo ""
curl -X PATCH \
  "$BASE_URL/alertas-inventario/5/resolver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 6. OBTENER ESTADO DEL SERVICIO
echo "6️⃣ OBTENER ESTADO DEL SERVICIO"
echo "GET /api/alertas-inventario/config/estado"
echo ""
curl -X GET \
  "$BASE_URL/alertas-inventario/config/estado" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 7. CAMBIAR TIEMPO DE VERIFICACIÓN
echo "7️⃣ CAMBIAR TIEMPO A 10 MINUTOS"
echo "POST /api/alertas-inventario/config/tiempo-verificacion"
echo ""
curl -X POST \
  "$BASE_URL/alertas-inventario/config/tiempo-verificacion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tiempoMinutos": 10
  }'
echo ""
echo ""

# 8. VERIFICACIÓN MANUAL
echo "8️⃣ EJECUTAR VERIFICACIÓN MANUAL"
echo "POST /api/alertas-inventario/verificar/manual"
echo ""
curl -X POST \
  "$BASE_URL/alertas-inventario/verificar/manual" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 9. DETENER SERVICIO
echo "9️⃣ DETENER SERVICIO"
echo "POST /api/alertas-inventario/control/detener"
echo ""
curl -X POST \
  "$BASE_URL/alertas-inventario/control/detener" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "================================"
echo "PRUEBAS COMPLETADAS"
echo "================================"
