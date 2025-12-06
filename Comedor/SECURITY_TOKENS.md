# 🔐 GUÍA: Remover Tokens Expuestos del Último Commit

## ⚠️ PROBLEMA IDENTIFICADO

Se encontraron tokens de Telegram Bot expuestos en el repositorio de GitHub:

- `TELEGRAM_BOT_TOKEN_SISTEMA`
- `TELEGRAM_BOT_TOKEN_DOCENTE`
- `TELEGRAM_COCINERA_CHAT_ID`
- `TELEGRAM_DOCENTES_CHAT_ID`

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. **Archivos Modificados**

- ✅ `server/services/telegramService.js`: Token hardcodeado removido
- ✅ `server/.env.example`: Creado con variables de ejemplo

### 2. **Verificar configuración**

- ✅ `.gitignore` ya incluye `.env`

## 🎯 ENFOQUE: LIMPIAR SOLO EL ÚLTIMO COMMIT

> **IMPORTANTE**: Se utiliza `git commit --amend` para limpiar **SOLO el último commit**, preservando todo el historial de git para la presentación del proyecto. Este enfoque NO reescribe toda la historia, lo que permite mantener visible el historial de desarrollo completo.

## 🔧 PASOS PARA LIMPIAR EL ÚLTIMO COMMIT

### Paso 1: Agregar cambios ya realizados

Los siguientes archivos han sido modificados y necesitan ser incluidos en el enmienda:

```bash
cd /home/cristian/Documentos/1.\ Proyecto\ de\ Software/Proyecto-Software-2025/Comedor

# Agregar los archivos corregidos
git add server/services/telegramService.js
git add server/.env.example
git add server/.gitignore
```

### Paso 2: Enmendar el último commit

```bash
# Enmendar el commit anterior sin cambiar el mensaje
git commit --amend --no-edit
```

### Paso 3: Hacer push de manera segura

```bash
# Usar --force-with-lease para prevenir sobrescribir cambios de otros
git push origin main --force-with-lease
```

**Explicación del comando:**

- `--force-with-lease`: Es más seguro que `--force` porque rechaza el push si hay cambios remotos
- `main`: Reemplazar con la rama donde estén los cambios (podría ser `master`, `develop`, etc.)

### Paso 4: Verificar que los tokens fueron removidos

```bash
# Verificar que NO aparezcan los tokens en el historial
git log --all -p -S "8563011483:AAFSjLEf15F91hMaipLIiKd2qr9sOxXde2g" | head -20

# O buscar en GitHub directamente:
# 1. Ve a tu repositorio en GitHub
# 2. Usa la búsqueda: "8563011483:AAFSjLEf15F91hMaipLIiKd2qr9sOxXde2g"
# 3. No debería encontrar ningún resultado
```

## 📋 CHECKLIST DE PASOS PRINCIPALES

**Pasos a ejecutar en tu terminal:**

```bash
cd /home/cristian/Documentos/1.\ Proyecto\ de\ Software/Proyecto-Software-2025/Comedor

# Paso 1: Agregar los archivos corregidos
git add server/services/telegramService.js server/.env.example server/.gitignore

# Paso 2: Enmendar el último commit (sin cambiar el mensaje)
git commit --amend --no-edit

# Paso 3: Hacer push de manera segura
git push origin main --force-with-lease
```

**Después de ejecutar los comandos:**

- [ ] Verificar en GitHub que los tokens no aparecen
- [ ] Confirmar que el historial de git está completo y visible
- [ ] ✅ Proyecto listo para presentar con historial de desarrollo intacto

## 🔄 REGENERAR TOKENS EN TELEGRAM

Si ya has limpiado el repositorio, es recomendable regenerar los tokens por seguridad:

1. **Para SistemaComedor_Bot**:

   - Ve a BotFather: https://t.me/BotFather
   - `/mybots` → Selecciona el bot → `API Token` → `/token`

2. **Para DocenteComedor_Bot**:
   - Mismo proceso en BotFather

## 📌 PREVENCIÓN FUTURA

### 1. Usar GitHub Secrets para CI/CD

```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      TELEGRAM_BOT_TOKEN_SISTEMA: ${{ secrets.TELEGRAM_BOT_TOKEN_SISTEMA }}
      TELEGRAM_BOT_TOKEN_DOCENTE: ${{ secrets.TELEGRAM_BOT_TOKEN_DOCENTE }}
```

### 2. Configurar pre-commit hooks

```bash
# Instalar pre-commit
pip install pre-commit

# Crear .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF

# Instalar
pre-commit install

# Probar
pre-commit run --all-files
```

### 3. Configurar .gitignore correctamente

```
# Archivos de configuración sensible
.env
.env.local
.env.*.local
.env.production

# Archivos de secretos
**/secrets.json
**/credentials.json
```

## 🚨 MONITOREO CONTINUO

1. Usar GitHub Secret Scanning (habilitado por defecto en públicos)
2. Revisar alerts en la sección "Security" → "Secret scanning"
3. Configurar Dependabot para alertas de seguridad

---

**Documentado el 3 de diciembre de 2025**



# 🔐 GUÍA: Remover Tokens Expuestos de GitHub

## ⚠️ PROBLEMA IDENTIFICADO

Se encontraron tokens de Telegram Bot expuestos en el repositorio de GitHub:

- `TELEGRAM_BOT_TOKEN_SISTEMA`
- `TELEGRAM_BOT_TOKEN_DOCENTE`
- `TELEGRAM_COCINERA_CHAT_ID`
- `TELEGRAM_DOCENTES_CHAT_ID`

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. **Archivos Modificados**

- ✅ `server/services/telegramService.js`: Token hardcodeado removido
- ✅ `server/.env.example`: Creado con variables de ejemplo

### 2. **Verificar configuración**

- ✅ `.gitignore` ya incluye `.env`

## 🔧 PASOS PARA LIMPIAR EL HISTORIAL DE GIT

### Opción 1: Usar BFG Repo-Cleaner (Recomendado - Más rápido)

```bash
# 1. Instalar BFG (si no lo tienes)
# En macOS:
brew install bfg

# En Linux/Windows (descarga desde: https://rclone.org/downloads/)

# 2. Crear lista de archivos a proteger
echo "server/.env.example" > .bfg-protect-files

# 3. Limpiar los tokens del historio
bfg --replace-text passwords.txt <repo>

# Crear archivo passwords.txt con:
# 8577672343:AAFyN9y0tMjp7-cRkNSQOgCnBAlikwMcHQE
# 8563011483:AAFSjLEf15F91hMaipLIiKd2qr9sOxXde2g
# 5190407592
# -1002419447293

# 4. Refrescar el repositorio
cd <repo>
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 5. Hacer push
git push --force
```

### Opción 2: Usar git-filter-repo (Más control)

```bash
# 1. Instalar
pip install git-filter-repo

# 2. Crear archivo con patrones
cat > tokens.txt << 'EOF'
literal:8577672343:AAFyN9y0tMjp7-cRkNSQOgCnBAlikwMcHQE
literal:8563011483:AAFSjLEf15F91hMaipLIiKd2qr9sOxXde2g
literal:5190407592
literal:-1002419447293
EOF

# 3. Ejecutar limpieza
git filter-repo --replace-text tokens.txt

# 4. Hacer push
git push --force
```

### Opción 3: Usar git filter-branch (Más lento pero estándar)

```bash
# ADVERTENCIA: Esta opción es más lenta en repositorios grandes

git filter-branch --tree-filter 'find . -name ".env" -type f -exec sed -i "s/8577672343:AAFyN9y0tMjp7-cRkNSQOgCnBAlikwMcHQE/REMOVED/g" {} \;' -f -- --all

git push --force
```

## 📋 CHECKLIST POST-LIMPIEZA

- [ ] Confirmar que los tokens no aparecen en el historial de GitHub
- [ ] Verificar que `.env.example` contiene solo placeholders
- [ ] Actualizar los tokens en GitHub Secrets (si usas GitHub Actions)
- [ ] Regenerar los tokens en BotFather de Telegram por seguridad
- [ ] Actualizar el archivo `.env` local con los nuevos tokens
- [ ] Comunicar al equipo sobre los nuevos tokens

## 🔄 REGENERAR TOKENS EN TELEGRAM

Si ya has limpiado el repositorio, es recomendable regenerar los tokens por seguridad:

1. **Para SistemaComedor_Bot**:

   - Ve a BotFather: https://t.me/BotFather
   - `/mybots` → Selecciona el bot → `API Token` → `/token`

2. **Para DocenteComedor_Bot**:
   - Mismo proceso en BotFather

## 📌 PREVENCIÓN FUTURA

### 1. Usar GitHub Secrets para CI/CD

```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      TELEGRAM_BOT_TOKEN_SISTEMA: ${{ secrets.TELEGRAM_BOT_TOKEN_SISTEMA }}
      TELEGRAM_BOT_TOKEN_DOCENTE: ${{ secrets.TELEGRAM_BOT_TOKEN_DOCENTE }}
```

### 2. Configurar pre-commit hooks

```bash
# Instalar pre-commit
pip install pre-commit

# Crear .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF

# Instalar
pre-commit install

# Probar
pre-commit run --all-files
```

### 3. Configurar .gitignore correctamente

```
# Archivos de configuración sensible
.env
.env.local
.env.*.local
.env.production

# Archivos de secretos
**/secrets.json
**/credentials.json
```

## 🚨 MONITOREO CONTINUO

1. Usar GitHub Secret Scanning (habilitado por defecto en públicos)
2. Revisar alerts en la sección "Security" → "Secret scanning"
3. Configurar Dependabot para alertas de seguridad

---

**Documentado el 3 de diciembre de 2025**