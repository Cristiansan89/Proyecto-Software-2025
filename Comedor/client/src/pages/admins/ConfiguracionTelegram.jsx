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

      // Obtener Chat ID de docentes
      const responseDocentes = await api.get("/telegram/docentes-chat-id");
      if (responseDocentes.data.success && responseDocentes.data.chatId) {
        setChatIdDocentes(responseDocentes.data.chatId);
      }

      // Obtener Chat ID de cocinera
      const responseCocinera = await api.get("/telegram/cocinera-chat-id");
      if (responseCocinera.data.success && responseCocinera.data.chatId) {
        setChatIdCocinera(responseCocinera.data.chatId);
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

  const guardarChatIdCocinera = async () => {
    if (!chatIdCocinera.trim()) {
      setMessage("El Chat ID de la cocinera no puede estar vacío");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/telegram/cocinera-chat-id", {
        chatId: chatIdCocinera.trim(),
      });

      if (response.data.success) {
        setMessage("✅ Chat ID de la cocinera guardado correctamente");
        setMessageType("success");
      } else {
        setMessage("❌ Error al guardar el Chat ID de la cocinera");
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

  const handleInputChange = (e, tipo) => {
    let valorPermitido = e.target.value;
    // Permitir solo números y el signo negativo al inicio
    valorPermitido = valorPermitido.replace(/[^0-9-]/g, "");

    if (tipo === "cocinera") {
      setChatIdCocinera(valorPermitido);
    } else if (tipo === "docentes") {
      setChatIdDocentes(valorPermitido);
    }
  };

  return (
    <div>
      <div className="page-header mb-3">
        <div className="header-left">
          <h2 className="page-title-sub">Configuración de Bots de Telegram</h2>
          <p className="pt-1">
            Configura los Chat IDs para recibir notificaciones automáticas
          </p>
        </div>
      </div>

      {/* Chat ID */}
      <div className="config-card">
        <div className="card-header text-dark">
          <h3 className="page-title">
            <i className="fas fa-chalkboard-user me-2"></i>
            Chat ID
          </h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            {/* Chat ID de Cocinera */}
            <div className="form-group">
              <label
                htmlFor="chatIdCocinera"
                className="text-dark fw-bold"
                style={{ fontSize: "1.1rem" }}
              >
                Chat ID Cocinera
              </label>
              <input
                type="number"
                className="form-control mt-3 mb-3"
                id="chatIdCocinera"
                value={chatIdCocinera}
                onChange={(e) => handleInputChange(e, "cocinera")}
                placeholder="Ej: 123456789 o -1001234567890"
                required
                disabled={loading}
              />
              <div className="form-actions">
                <button
                  onClick={guardarChatIdCocinera}
                  disabled={loading}
                  className="btn btn-info"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chat ID de Docentes */}
            <div className="form-group">
              <label
                htmlFor="chatIdDocentes"
                className="text-dark fw-bold"
                style={{ fontSize: "1.1rem" }}
              >
                Chat ID Docente
              </label>
              <input
                type="number"
                className="form-control mt-3 mb-3"
                id="chatIdDocentes"
                value={chatIdDocentes}
                onChange={(e) => handleInputChange(e, "docentes")}
                placeholder="Ej: 123456789 o -1001234567890"
                required
                disabled={loading}
              />
              <div className="form-actions">
                <button
                  onClick={guardarChatIdDocentes}
                  disabled={loading}
                  className="btn btn-success"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones del Bot */}
      <div className="config-card">
        <div className="card-header text-dark">
          <h3 className="page-title">
            <i className="fas fa-info-circle me-2"></i>
            Instrucciones del Bot
          </h3>
        </div>
        <div className="card-body">
          <div className="instructions">
            <h4>📱 ¿Cómo obtener tu Chat ID?</h4>
            <ol>
              <li>
                Abre Telegram y busca el bot: <code>@DocenteComedor_Bot</code>
              </li>
              <li>
                Envía el comando: <code>/start</code>
              </li>
              <li>
                Para obtener tu Chat ID personal, puedes usar una herramienta
                como{" "}
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
                Una vez tengas el Chat ID, cópialo y pégalo en el campo anterior
              </li>
            </ol>
            <div className="tips">
              <strong>💡 Tips:</strong>
              <ul>
                <li>
                  Chat ID personal: es un número (ej: <code>123456789</code>)
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

      {/* Información del Bot */}
      <div className="config-card">
        <div className="card-header text-dark">
          <h3 className="page-title">
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
  );
};

export default ConfiguracionTelegram;
