# Configuración de Bot de Telegram

## Pasos para configurar el Bot de Telegram

### 1. Crear un Bot de Telegram

1. Abre Telegram y busca a **@BotFather**
2. Inicia una conversación con `/start`
3. Crea un nuevo bot con `/newbot`
4. Elige un nombre para tu bot (ejemplo: "Comedor Escolar Bot")
5. Elige un username único que termine en "bot" (ejemplo: "comedor_escolar_bot")
6. **BotFather** te dará un token de la forma: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Obtener el Chat ID

Hay varias formas de obtener el Chat ID:

#### Opción A: Usar el bot mismo

1. Envía el comando `/start` a tu bot
2. Haz una petición GET a la API de Telegram:
   ```
   https://api.telegram.org/bot<TU_BOT_TOKEN>/getUpdates
   ```
3. En la respuesta JSON, busca el campo `chat.id`

#### Opción B: Usar el endpoint del servidor

1. Configura el `TELEGRAM_BOT_TOKEN` en el archivo `.env`
2. Inicia el servidor
3. Haz una petición a `GET /api/telegram/status` para verificar que el bot funciona
4. Envía `/chatid` a tu bot en Telegram
5. El bot te responderá con tu Chat ID

### 3. Configurar las Variables de Entorno

Edita el archivo `server/.env` y reemplaza los valores de ejemplo:

```env
# Configuración de Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_BOT_URL=https://t.me/comedor_escolar_bot
```

### 4. Comandos del Bot

El bot incluye los siguientes comandos:

- `/start` - Inicia el bot y muestra mensaje de bienvenida
- `/chatid` - Muestra el ID del chat actual
- `/help` - Muestra la ayuda disponible

### 5. Funciones Disponibles

Una vez configurado, el sistema permitirá:

- ✅ Enviar mensajes de asistencia por Telegram
- ✅ Formatear mensajes con información de grados y servicios
- ✅ Enviar mensajes individuales a docentes
- ✅ Enviar mensajes masivos a todos los docentes
- ✅ Verificar el estado del bot

### 6. Uso en la Aplicación

1. Ve a "Gestión de Asistencias" en el panel de Cocinera
2. Selecciona los grados y servicios
3. Escribe tu mensaje
4. Usa el botón "📤 Enviar por Telegram" para enviar a todos
5. O usa los botones individuales "Telegram" en cada enlace

### 7. Solución de Problemas

#### Bot no responde

- Verifica que el token sea correcto
- Asegúrate de que el bot esté iniciado (`/start`)
- Revisa los logs del servidor

#### Chat ID incorrecto

- Usa el comando `/chatid` en tu bot
- Para grupos, el Chat ID suele ser negativo
- Para chats individuales, el Chat ID es positivo

#### Mensajes no se envían

- Verifica que el servidor esté ejecutándose
- Revisa las variables de entorno
- Verifica la conexión a internet

### 8. Migración desde WhatsApp

La migración incluye:

- ✅ Reemplazo de funciones de WhatsApp por Telegram
- ✅ Actualización de iconos y colores en la interfaz
- ✅ Conservación de la lógica de formateo de teléfonos
- ✅ Mantener la funcionalidad de mensajes individuales y masivos

## Ejemplo de Configuración Completa

```env
# server/.env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_BOT_URL=https://t.me/comedor_escolar_bot
```

Con esta configuración, el sistema estará listo para enviar notificaciones de asistencia por Telegram en lugar de WhatsApp.
