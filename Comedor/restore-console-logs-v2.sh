#!/bin/bash

echo "🔄 Iniciando restauración de console.log desde git HEAD..."

# Lista de archivos a restaurar (cliente)
CLIENT_FILES=(
  "Comedor/client/src/components/cocinera/RecetaForm.jsx"
  "Comedor/client/src/layouts/AdminLayout.jsx"
  "Comedor/client/src/pages/admins/Alertas.jsx"
  "Comedor/client/src/pages/admins/ListaAlumnoGrado.jsx"
  "Comedor/client/src/pages/admins/ListaDocenteGrado.jsx"
  "Comedor/client/src/pages/admins/ListaInsumos.jsx"
  "Comedor/client/src/pages/admins/ListaPersonas.jsx"
  "Comedor/client/src/pages/admins/ListaProveedores.jsx"
  "Comedor/client/src/pages/admins/ListaReemplazoDocente.jsx"
  "Comedor/client/src/pages/admins/ListaUsuarios.jsx"
  "Comedor/client/src/pages/admins/Parametros.jsx"
  "Comedor/client/src/pages/cocinera/CocineraInventario.jsx"
  "Comedor/client/src/pages/cocinera/CocineraMenu.jsx"
  "Comedor/client/src/pages/cocinera/CocineraRecetas.jsx"
  "Comedor/client/src/pages/cocinera/PedidoInsumo.jsx"
  "Comedor/client/src/pages/cocinera/PlanificacionCalendario.jsx"
  "Comedor/client/src/services/pedidoService.js"
)

# Lista de archivos a restaurar (servidor)
SERVER_FILES=(
  "Comedor/server/controllers/insumos.js"
)

# Función para extraer console.log de git HEAD y aplicarlos
restore_console_logs() {
  local git_path="$1"
  local local_path="${git_path#Comedor/}"
  echo "📁 Procesando: $local_path"
  
  if [ ! -f "$local_path" ]; then
    echo "❌ Archivo no encontrado: $local_path"
    return 1
  fi
  
  # Crear archivo temporal con console.log desde HEAD
  git show HEAD:"$git_path" > "/tmp/$(basename "$local_path").head" 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "⚠️  No se pudo obtener versión HEAD de $git_path"
    return 1
  fi
  
  # Extraer líneas con console.log de HEAD
  grep -n "console\.log" "/tmp/$(basename "$local_path").head" > "/tmp/console_logs.txt" 2>/dev/null
  
  if [ ! -s "/tmp/console_logs.txt" ]; then
    echo "ℹ️  No hay console.log en HEAD para $local_path"
    rm -f "/tmp/$(basename "$local_path").head"
    return 0
  fi
  
  # Mostrar estadísticas
  local count=$(wc -l < "/tmp/console_logs.txt")
  echo "   📊 Encontrados $count console.log en HEAD"
  
  # Aplicar los console.log usando el archivo HEAD completo
  cp "/tmp/$(basename "$local_path").head" "$local_path"
  
  echo "   ✅ Console.log restaurados en $local_path"
  
  # Limpiar archivos temporales
  rm -f "/tmp/$(basename "$local_path").head" "/tmp/console_logs.txt"
}

# Restaurar archivos del cliente
echo ""
echo "🎯 Restaurando archivos del CLIENTE..."
for file in "${CLIENT_FILES[@]}"; do
  restore_console_logs "$file"
done

# Restaurar archivos del servidor
echo ""
echo "🎯 Restaurando archivos del SERVIDOR..."
for file in "${SERVER_FILES[@]}"; do
  restore_console_logs "$file"
done

echo ""
echo "🎉 ¡Restauración de console.log completada!"
echo "📋 Archivos procesados: $((${#CLIENT_FILES[@]} + ${#SERVER_FILES[@]}))"