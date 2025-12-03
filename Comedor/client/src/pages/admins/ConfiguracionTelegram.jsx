import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/ConfiguracionTelegram.css";

const ConfiguracionTelegram = () => {
  const [chatIdDocentes, setChatIdDocentes] = useState("");
  const [chatIdCocinera, setChatIdCocinera] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    obtenerChatIds();
  }, []);

  const obtenerChatIds = async () => {
    try {
      setLoading(true);
      const response = await api.get("/telegram/docentes-chat-id");
      if (response.data.success && response.data.chatId) {
        setChatIdDocentes(response.data.chatId);
      }
    } catch (error) {
      console.error("Error obteniendo Chat IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarChatIdDocentes = async () => {
    if (!chatIdDocentes.trim()) {
      setMessage("El Chat ID no puede estar vacío");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/telegram/docentes-chat-id", {
        chatId: chatIdDocentes.trim(),
      });

      if (response.data.success) {
        setMessage("✅ Chat ID de docentes guardado correctamente");
        setMessageType("success");
      } else {
        setMessage("❌ Error al guardar el Chat ID");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="configuracion-telegram">
      <div className="config-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-robot me-2"></i>
            Configuración de Bots de Telegram
          </h2>
          <p>Configura los Chat IDs para recibir notificaciones automáticas</p>
        </div>

        {/* Chat ID de Docentes */}
        <div className="config-card">
          <div className="card-header">
            <h3>
              <i className="fas fa-chalkboard-user me-2"></i>
              Chat ID para Docentes (DocenteComedor_Bot)
            </h3>
            <p className="card-description">
              ID del chat o grupo donde se enviarán los enlaces de asistencia
            </p>
          </div>

          <div className="card-body">
            <div className="form-group">
              <label htmlFor="chatIdDocentes">Chat ID:</label>
              <div className="input-group">
                <input
                  id="chatIdDocentes"
                  type="text"
                  value={chatIdDocentes}
                  onChange={(e) => setChatIdDocentes(e.target.value)}
                  placeholder="Ej: 123456789 o -1001234567890"
                  disabled={loading}
                  className="form-control"
                />
                <button
                  onClick={guardarChatIdDocentes}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Guardar
                    </>
                  )}
                </button>
              </div>

              <div className="instructions">
                <h4>📱 ¿Cómo obtener tu Chat ID?</h4>
                <ol>
                  <li>
                    Abre Telegram y busca el bot:{" "}
                    <code>@DocenteComedor_Bot</code>
                  </li>
                  <li>
                    Envía el comando: <code>/start</code>
                  </li>
                  <li>
                    Para obtener tu Chat ID personal, puedes usar una
                    herramienta como{" "}
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noreferrer"
                    >
                      @userinfobot
                    </a>
                  </li>
                  <li>
                    O crea un grupo, agrega el bot, y usa{" "}
                    <a
                      href="https://t.me/getidsbot"
                      target="_blank"
                      rel="noreferrer"
                    >
                      @getidsbot
                    </a>{" "}
                    para obtener el ID del grupo
                  </li>
                  <li>
                    Una vez tengas el Chat ID, cópialo y pégalo en el campo
                    anterior
                  </li>
                </ol>
                <div className="tips">
                  <strong>💡 Tips:</strong>
                  <ul>
                    <li>
                      Chat ID personal: es un número (ej: <code>123456789</code>
                      )
                    </li>
                    <li>
                      Chat ID de grupo: es un número negativo (ej:{" "}
                      <code>-1001234567890</code>)
                    </li>
                    <li>
                      Asegúrate de agregar el bot (@DocenteComedor_Bot) al grupo
                      antes de usar su ID
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Bot */}
        <div className="config-card">
          <div className="card-header">
            <h3>
              <i className="fas fa-info-circle me-2"></i>
              Información del Bot
            </h3>
          </div>

          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <strong>🤖 Bot de Docentes:</strong>
                <p>
                  <code>@DocenteComedor_Bot</code>
                </p>
              </div>
              <div className="info-item">
                <strong>📧 Función:</strong>
                <p>Envía los enlaces de registro de asistencias</p>
              </div>
              <div className="info-item">
                <strong>🔔 Bot del Sistema:</strong>
                <p>
                  <code>@SistemaComedor_Bot</code>
                </p>
              </div>
              <div className="info-item">
                <strong>📊 Función:</strong>
                <p>Notificaciones de asistencias a la cocinera</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`alert alert-${messageType}`}>
            <i
              className={`fas ${
                messageType === "success"
                  ? "fa-check-circle"
                  : "fa-exclamation-circle"
              } me-2`}
            ></i>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionTelegram;
