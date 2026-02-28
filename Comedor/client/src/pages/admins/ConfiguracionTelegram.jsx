import { useState, useEffect } from "react";
import api from "../../services/api";
import ChatIDProveedorForm from "../../components/admin/ChatIDProveedorForm";
import ChatIDDocenteForm from "../../components/admin/ChatIDDocenteForm";
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
  const [chatIdCocinera, setChatIdCocinera] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalDocente, setShowModalDocente] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    obtenerChatIds();
    cargarProveedores();
    cargarDocentes();
  }, []);

  const obtenerChatIds = async () => {
    try {
      setLoading(true);

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

  const cargarDocentes = async () => {
    try {
      const response = await api.get("/telegram/docentes-list");
      if (response.data.success) {
        setDocentes(response.data.docentes || []);
      }
    } catch (error) {
      console.error("Error cargando docentes:", error);
      showError("Error al cargar los docentes");
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

  const openModal = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setProveedorSeleccionado(null);
  };

  const handleSaveProveedor = async () => {
    try {
      closeModal();
      setMessage("✅ Chat ID guardado correctamente");
      setMessageType("success");
      await cargarProveedores();
    } catch (error) {
      setMessage("❌ Error al guardar");
      setMessageType("error");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const openModalDocente = (docente) => {
    setDocenteSeleccionado(docente);
    setShowModalDocente(true);
  };

  const closeModalDocente = () => {
    setShowModalDocente(false);
    setDocenteSeleccionado(null);
  };

  const handleSaveDocente = async () => {
    try {
      closeModalDocente();
      setMessage("✅ Chat ID guardado correctamente");
      setMessageType("success");
      await cargarDocentes();
    } catch (error) {
      setMessage("❌ Error al guardar");
      setMessageType("error");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleInputChange = (e, tipo) => {
    let valorPermitido = e.target.value;
    // Permitir solo números y el signo negativo al inicio
    valorPermitido = valorPermitido.replace(/[^0-9-]/g, "");

    if (tipo === "cocinera") {
      setChatIdCocinera(valorPermitido);
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
            Chat ID - Cocinera
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
          </div>
        </div>
      </div>

    {/* Configuración de Docentes */}
      <div className="config-card">
        <div className="card-header text-dark">
          <h3 className="page-title">
            <i className="fas fa-store me-2"></i>
            Chat ID - Docentes
          </h3>
        </div>
        <div className="card-body">
          <div className="proveedor-section">
            {/* Listado de Docentes */}
            <div className="proveedor-list">
              <h5 className="mb-3">📦 Docentes ({docentes.length})</h5>

              {docentes.length === 0 ? (
                <p className="text-muted">No hay docentes disponibles</p>
              ) : (
                <div className="table-container">
                  <table className="table table-striped data-table">
                    <thead className="table-header-fixed">
                      <tr>
                        <th>#</th>
                        <th>Docente</th>
                        <th>Grado</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Chat ID Telegram</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docentes.map((docente, index) => (
                        <tr key={docente.id}>
                          <td className="fw-bold">{index + 1}</td>
                          <td className="fw-bold">{docente.apellido} {docente.nombre}</td>
                          <td>{docente.nombreGrado}</td>
                          <td>{docente.email}</td>
                          <td>{docente.telefono}</td>
                          <td>
                            {docente.chatId ? (
                              <span className="badge bg-success">
                                {docente.chatId}
                              </span>
                            ) : (
                              <span className="badge bg-warning">
                                Sin configurar
                              </span>
                            )}
                          </td>
                          <td>
                            {docente.notificacionesActivas ? (
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
                              onClick={() => openModalDocente(docente)}
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
                        <th>#</th>
                        <th>Proveedor</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Chat ID Telegram</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proveedores.map((proveedor, index) => (
                        <tr key={proveedor.id}>
                          <td className="fw-bold">{index + 1}</td>
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
                              onClick={() => openModal(proveedor)}
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

      {/* Modal para editar proveedor */}
      {showModal && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content proveedor-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Configurar Chat ID: <strong>{proveedorSeleccionado.nombre}</strong>
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <ChatIDProveedorForm
                proveedor={proveedorSeleccionado}
                onSave={handleSaveProveedor}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar docente */}
      {showModalDocente && docenteSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content docente-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Configurar Chat ID: <strong>{docenteSeleccionado.apellido}, {docenteSeleccionado.nombre}</strong>
              </h3>
              <button className="modal-close" onClick={closeModalDocente}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <ChatIDDocenteForm
                docente={docenteSeleccionado}
                onSave={handleSaveDocente}
                onCancel={closeModalDocente}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionTelegram;
