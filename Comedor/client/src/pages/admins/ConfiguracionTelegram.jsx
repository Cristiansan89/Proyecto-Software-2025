import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import ChatIDProveedorForm from "../../components/admin/ChatIDProveedorForm";
import ChatIDDocenteForm from "../../components/admin/ChatIDDocenteForm";
import TelegramInstructionsModal from "../../components/admin/TelegramInstructionsModal";
import { showError } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import ParametroStyle from "../../styles/Parametros.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const ConfiguracionTelegram = () => {
  const [chatIdCocinera, setChatIdCocinera] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalDocente, setShowModalDocente] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true); // Inicializa en true para evitar parpadeos
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Carga inicial unificada para evitar renderizados inconsistentes
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        setLoading(true);
        await Promise.all([
          obtenerChatIds(),
          cargarProveedores(),
          cargarDocentes(),
        ]);
      } catch (error) {
        showError("Error al sincronizar los datos de Telegram.");
      } finally {
        setLoading(false);
      }
    };

    inicializarDatos();
  }, []);

  const obtenerChatIds = async () => {
    try {
      const responseCocinera = await api.get("/telegram/cocinera-chat-id");
      if (responseCocinera.data.success && responseCocinera.data.chatId) {
        setChatIdCocinera(responseCocinera.data.chatId);
      }
    } catch (error) {
      showError("Error al cargar los Chat IDs de Telegram.");
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
      console.log("📥 Respuesta de docentes:", response.data);
      if (response.data.success) {
        const datos = response.data.docentes || [];
        console.log("✅ Docentes cargados:", datos);
        setDocentes(datos);
      }
    } catch (error) {
      console.error("Error cargando docentes:", error);
      showError("Error al cargar los docentes");
    }
  };

  const guardarChatIdCocinera = async () => {
    if (!chatIdCocinera.toString().trim()) {
      setMessage("El Chat ID de la cocinera no puede estar vacío");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/telegram/cocinera-chat-id", {
        chatId: chatIdCocinera.toString().trim(),
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
      setTimeout(() => setMessage(""), 5000);
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
      setTimeout(() => setMessage(""), 5000);
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
      setMessageType("Success");
      await cargarDocentes();
    } catch (error) {
      setMessage("❌ Error al guardar");
      setMessageType("error");
    } finally {
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const closeModalInstruccion = () => {
    setShowInstructionsModal(false);
  };

  const handleInputChange = (e, tipo) => {
    let valorPermitido = e.target.value;
    valorPermitido = valorPermitido.replace(/[^0-9-]/g, "");

    if (tipo === "cocinera") {
      setChatIdCocinera(valorPermitido);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>
            Configuración de Bots de Telegram
          </h2>
          <p className={ContenidoStyle.pageSubtitle}>
            Configura los Chat IDs para recibir notificaciones automáticas
          </p>
        </div>
      </div>

      {/* Banner de Instrucciones */}
      <div
        className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} border-0 mb-4`}
        style={{
          background: "linear-gradient(135deg, #e3f2fd 0%, #fff3e0 100%)",
          borderLeft: "4px solid #0088cc",
          padding: "16px 20px",
          borderRadius: "8px",
        }}
      >
        <div
          className={ComponenteStyle.formActions}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "none",
            paddingTop: "0",
            marginTop: "0",
          }}
        >
          <div>
            <i
              className="fas fa-lightbulb me-2"
              style={{ color: "#0088cc" }}
            ></i>
            <strong>¿No sabes cómo configurar tu chat ID?</strong>
            <p style={{ margin: "8px 0 0 0", color: "#555", fontSize: "14px" }}>
              Haz clic en el botón de ayuda para ver instrucciones paso a paso
            </p>
          </div>
          <button
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate} border-0`}
            onClick={() => setShowInstructionsModal(true)}
            style={{ whiteSpace: "nowrap", marginLeft: "16px" }}
          >
            <i className="fas fa-book text-white"></i>
            Ver Instrucciones
          </button>
        </div>
      </div>
      {/* Mensaje de estado CORREGIDO */}
      {message && (
        <div
          className={`${ParametroStyle.alert} ${ParametroStyle[`alert${messageType.charAt(0).toUpperCase() + messageType.slice(1)}`]} mb-3`}
        >
          <i
            className={`fas ${messageType.toLowerCase() === "success" ? "fa-check-circle" : "fa-exclamation-circle"} me-2`}
          ></i>
          {message}
        </div>
      )}

      {/* Chat ID Cocinera */}
      <div className={ParametroStyle.card}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-chalkboard-user me-2"></i>
            Chat ID - Cocinera
          </h5>
        </div>
        <div className={ParametroStyle.cardBody}>
          <div className={ParametroStyle.row}>
            <div className={ParametroStyle.formGroup}>
              <label htmlFor="chatIdCocinera" className="text-dark fw-bold">
                Chat ID Cocinera
              </label>
              <input
                type="text" /* Cambiado a text para soportar guiones cómodamente */
                className={ParametroStyle.formControl}
                id="chatIdCocinera"
                value={chatIdCocinera}
                onChange={(e) => handleInputChange(e, "cocinera")}
                placeholder="Ej: 123456789 o -1001234567890"
                required
                disabled={loading}
              />
              <div
                className={`${ComponenteStyle.formActions} border-top-0 padding-top-0`}
              >
                <button
                  onClick={guardarChatIdCocinera}
                  disabled={loading}
                  className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate} border-0`}
                >
                  <i className="fas fa-save"></i> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Docentes */}
      <div className={ParametroStyle.card}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-store me-2"></i>
            Chat ID - Docentes
          </h5>
        </div>
        <div className={ParametroStyle.cardBody}>
          <div>
            <h3 className={`${ContenidoStyle.pageSubtitle} mb-3`}>
              📦 Docentes ({docentes.length})
            </h3>

            {docentes.length === 0 ? (
              <p className="text-muted">No hay docentes disponibles</p>
            ) : (
              <div className={TablaStyle.tableContainer}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
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
                        <td className="fw-bold">
                          {docente.apellido} {docente.nombre}
                        </td>
                        <td>{docente.nombreGrado}</td>
                        <td>{docente.email}</td>
                        <td>{docente.telefono}</td>
                        <td>
                          {docente.chatId ? (
                            <span
                              className={`${ParametroStyle.badge} ${ParametroStyle.bgInfo}`}
                            >
                              {docente.chatId}
                            </span>
                          ) : (
                            <span
                              className={`${ParametroStyle.badge} ${ParametroStyle.bgWarning}`}
                            >
                              Sin configurar
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`${TablaStyle.statusBadge} ${docente.notificacionesActivas ? TablaStyle.activo : TablaStyle.inactivo}`}
                          >
                            <i
                              className={`fas ${docente.notificacionesActivas ? "fa-check-circle" : "fa-times-circle"} me-1`}
                            ></i>
                            {docente.notificacionesActivas
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`${ComponenteStyle.formActions} mt-0 pt-0 border-top-0`}
                          >
                            <button
                              onClick={() => openModalDocente(docente)}
                              className={`${ComponenteStyle.btn} ${ComponenteStyle.btnEdit}`}
                              disabled={loading}
                            >
                              <i className="fas fa-edit"></i> Editar
                            </button>
                          </div>
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

      {/* Configuración de Proveedores */}
      <div className={ParametroStyle.card}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-store me-2"></i>
            Chat ID - Proveedores
          </h5>
        </div>
        <div className={ParametroStyle.cardBody}>
          <div>
            <h3 className={`${ContenidoStyle.pageSubtitle} mb-3`}>
              📦 Proveedores ({proveedores.length})
            </h3>

            {proveedores.length === 0 ? (
              <p className="text-muted">No hay proveedores disponibles</p>
            ) : (
              <div className={TablaStyle.tableContainer}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
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
                            <span
                              className={`${ParametroStyle.badge} ${ParametroStyle.bgInfo}`}
                            >
                              {proveedor.chatId}
                            </span>
                          ) : (
                            <span
                              className={`${ParametroStyle.badge} ${ParametroStyle.bgWarning}`}
                            >
                              Sin configurar
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`${TablaStyle.statusBadge} ${proveedor.notificacionesActivas ? TablaStyle.activo : TablaStyle.inactivo}`}
                          >
                            <i
                              className={`fas ${proveedor.notificacionesActivas ? "fa-check-circle" : "fa-times-circle"} me-1`}
                            ></i>
                            {proveedor.notificacionesActivas
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`${ComponenteStyle.formActions} mt-0 pt-0 border-top-0`}
                          >
                            <button
                              onClick={() => openModal(proveedor)}
                              className={`${ComponenteStyle.btn} ${ComponenteStyle.btnEdit}`}
                              disabled={loading}
                            >
                              <i className="fas fa-edit"></i> Editar
                            </button>
                          </div>
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

      {/* Instrucciones del Bot */}
      <div className={ParametroStyle.card}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-info-circle me-2"></i>
            Instrucciones del Bot
          </h5>
        </div>
        <div className={ParametroStyle.cardBody}>
          <div className={ParametroStyle.instructions}>
            <h4>📱 ¿Cómo obtener Chat ID?</h4>
            <ol>
              <li>Abre Telegram y busca el bot correspondiente.</li>
              <li>
                Envía el comando: <code>/start</code>
              </li>
              <li>
                Luego ejecuta: <code>/chatid</code>
              </li>
              <li>Copia el Chat ID y úsalo en el formulario.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Modal Proveedor */}
      {showModal &&
        proveedorSeleccionado &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    Configurar Chat ID: {proveedorSeleccionado.nombre}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ChatIDProveedorForm
                    proveedor={proveedorSeleccionado}
                    onSave={handleSaveProveedor}
                    onCancel={closeModal}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Docente */}
      {showModalDocente &&
        docenteSeleccionado &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    Configurar Chat ID: {docenteSeleccionado.apellido}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModalDocente}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ChatIDDocenteForm
                    docente={docenteSeleccionado}
                    onSave={handleSaveDocente}
                    onCancel={closeModalDocente}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Instrucciones */}
      {showInstructionsModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div
                className={FormularioStyle.modalContent}
                style={{ maxWidth: "800px" }}
              >
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fab fa-telegram-plane text-white me-2"></i>
                    Configurar Telegram - Instrucciones
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModalInstruccion}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <TelegramInstructionsModal
                    show={showInstructionsModal}
                    onCancel={closeModalInstruccion}
                    onClose={() => setShowInstructionsModal(false)}
                    botName="@DocenteComedor_Bot"
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Backdrop Proveedor */}
      {showModal &&
        proveedorSeleccionado &&
        createPortal(
          <div
            className={FormularioStyle.modalBackdrop}
            style={{ zIndex: 1040, pointerEvents: "all" }}
            onClick={closeModal}
          ></div>,
          document.body,
        )}

      {/* Backdrop Docente */}
      {showModalDocente &&
        docenteSeleccionado &&
        createPortal(
          <div
            className={FormularioStyle.modalBackdrop}
            style={{ zIndex: 1040, pointerEvents: "all" }}
            onClick={closeModalDocente}
          ></div>,
          document.body,
        )}

      {/* Backdrop Instrucciones */}
      {showInstructionsModal &&
        createPortal(
          <div
            className={FormularioStyle.modalBackdrop}
            style={{ zIndex: 1040, pointerEvents: "all" }}
            onClick={closeModalInstruccion}
          ></div>,
          document.body,
        )}
    </div>
  );
};

export default ConfiguracionTelegram;
