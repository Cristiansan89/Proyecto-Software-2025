import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import "../../styles/ConfiguracionTelegram.css";

const ConfiguracionTelegram = () => {
  const [chatIdDocentes, setChatIdDocentes] = useState("");
  const [chatIdCocinera, setChatIdCocinera] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [chatIdProveedorActual, setChatIdProveedorActual] = useState("");
  const [telegramUsuarioActual, setTelegramUsuarioActual] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    obtenerChatIds();
    cargarProveedores();
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
      //console.error("Error obteniendo Chat IDs:", error);
      showError("Error al cargar los Chat IDs de Telegram.");
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      const response = await api.get("/telegram/proveedores-list");
      if (response.data.success) {
        setProveedores(response.data.proveedores || []);
      }
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      showError("Error al cargar los proveedores");
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

  const guardarChatIdProveedor = async () => {
    if (!proveedorSeleccionado) {
      setMessage("Debe seleccionar un proveedor");
      setMessageType("error");
      return;
    }

    if (!chatIdProveedorActual.trim()) {
      setMessage("El Chat ID del proveedor no puede estar vacío");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/telegram/proveedor-chat-id", {
        proveedorId: proveedorSeleccionado.id,
        chatId: chatIdProveedorActual.trim(),
        telegramUsuario: telegramUsuarioActual.trim(),
      });

      if (response.data.success) {
        setMessage(
          `✅ Chat ID del proveedor ${proveedorSeleccionado.nombre} guardado correctamente`
        );
        setMessageType("success");
        await cargarProveedores();
        limpiarFormularioProveedor();
      } else {
        setMessage("❌ Error al guardar el Chat ID del proveedor");
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

  const seleccionarProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setChatIdProveedorActual(proveedor.chatId || "");
    setTelegramUsuarioActual(proveedor.telegramUsuario || "");
  };

  const limpiarFormularioProveedor = () => {
    setProveedorSeleccionado(null);
    setChatIdProveedorActual("");
    setTelegramUsuarioActual("");
  };

  const handleInputChange = (e, tipo) => {
    let valorPermitido = e.target.value;
    // Permitir solo números y el signo negativo al inicio
    valorPermitido = valorPermitido.replace(/[^0-9-]/g, "");

    if (tipo === "cocinera") {
      setChatIdCocinera(valorPermitido);
    } else if (tipo === "docentes") {
      setChatIdDocentes(valorPermitido);
    } else if (tipo === "proveedor") {
      setChatIdProveedorActual(valorPermitido);
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
            Chat ID - Docentes y Cocinera
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

      {/* Configuración de Proveedores */}
      <div className="config-card">
        <div className="card-header text-dark">
          <h3 className="page-title">
            <i className="fas fa-store me-2"></i>
            Chat ID - Proveedores
          </h3>
        </div>
        <div className="card-body">
          <div className="proveedor-section">
            {/* Listado de Proveedores */}
            <div className="proveedor-list">
              <h5 className="mb-3">📦 Proveedores ({proveedores.length})</h5>

              {proveedores.length === 0 ? (
                <p className="text-muted">No hay proveedores disponibles</p>
              ) : (
                <div className="table-container">
                  <table className="table table-striped data-table">
                    <thead className="table-header-fixed">
                      <tr>
                        <th>Proveedor</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Chat ID Telegram</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proveedores.map((proveedor) => (
                        <tr key={proveedor.id}>
                          <td className="fw-bold">{proveedor.nombre}</td>
                          <td>{proveedor.email}</td>
                          <td>{proveedor.telefono}</td>
                          <td>
                            {proveedor.chatId ? (
                              <span className="badge bg-success">
                                {proveedor.chatId}
                              </span>
                            ) : (
                              <span className="badge bg-warning">
                                Sin configurar
                              </span>
                            )}
                          </td>
                          <td>
                            {proveedor.notificacionesActivas ? (
                              <span className="badge bg-success">
                                <i className="fas fa-check-circle me-1"></i>
                                Activo
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                <i className="fas fa-times-circle me-1"></i>
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => seleccionarProveedor(proveedor)}
                              className="btn btn-sm btn-primary"
                              disabled={loading}
                            >
                              <i className="fas fa-edit me-1"></i>
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formulario de edición de proveedor seleccionado */}
            {proveedorSeleccionado && (
              <div className="proveedor-form mt-4 p-4 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>
                    ✏️ Configurar Chat ID:{" "}
                    <strong>{proveedorSeleccionado.nombre}</strong>
                  </h5>
                  <button
                    onClick={limpiarFormularioProveedor}
                    className="btn btn-sm btn-outline-danger"
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="form-group mb-3">
                  <label className="text-dark fw-bold">
                    Chat ID de Telegram
                  </label>
                  <input
                    type="number"
                    className="form-control mt-2"
                    value={chatIdProveedorActual}
                    onChange={(e) => handleInputChange(e, "proveedor")}
                    placeholder="Ej: 123456789 o -1001234567890"
                    disabled={loading}
                  />
                  <small className="text-muted d-block mt-2">
                    El Chat ID que recibió el proveedor al ejecutar /chatid en
                    el bot
                  </small>
                </div>

                <div className="form-group mb-3">
                  <label className="text-dark fw-bold">
                    Usuario de Telegram (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control mt-2"
                    value={telegramUsuarioActual}
                    onChange={(e) => setTelegramUsuarioActual(e.target.value)}
                    placeholder="Ej: @nombreUsuario"
                    disabled={loading}
                  />
                  <small className="text-muted d-block mt-2">
                    Usuario de Telegram del proveedor (sin el @)
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    onClick={guardarChatIdProveedor}
                    disabled={loading || !chatIdProveedorActual}
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
                        Guardar Chat ID
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
            <h4>📱 ¿Cómo obtener Chat ID?</h4>
            <ol>
              <li>
                Abre Telegram y busca el bot: <code>@DocenteComedor_Bot</code>{" "}
                (para docentes) o <code>@Sistema_Proveedorbot</code> (para
                proveedores)
              </li>
              <li>
                Envía el comando: <code>/start</code>
              </li>
              <li>
                Luego ejecuta: <code>/chatid</code> para obtener tu Chat ID
              </li>
              <li>
                El bot te devolverá tu Chat ID personal (ej:{" "}
                <code>123456789</code>) o de grupo (ej:{" "}
                <code>-1001234567890</code>)
              </li>
              <li>Copia el Chat ID y úsalo en el formulario anterior</li>
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
                  Asegúrate de agregar el bot al grupo antes de usar su ID
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
            <i className="fas fa-robot me-2"></i>
            Bots Disponibles
          </h3>
        </div>

        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <strong>🤖 Bot de Docentes:</strong>
              <p>
                <code>@DocenteComedor_Bot</code>
              </p>
              <p className="text-muted">
                Envía enlaces de registro de asistencias
              </p>
            </div>
            <div className="info-item">
              <strong>📦 Bot de Proveedores:</strong>
              <p>
                <code>@Sistema_Proveedorbot</code>
              </p>
              <p className="text-muted">
                Notificaciones de pedidos para confirmar
              </p>
            </div>
            <div className="info-item">
              <strong>🔔 Bot del Sistema:</strong>
              <p>
                <code>@SistemaComedor_Bot</code>
              </p>
              <p className="text-muted">
                Notificaciones de asistencias a la cocinera
              </p>
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
