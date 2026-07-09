import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import API from "../../services/api";
import { showError, showSuccess, showConfirm } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const serviciosAPI = {
  getAll: async () => {
    try {
      const response = await API.get("/servicios");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

const configuracionAutomaticaAPI = {
  obtenerTodas: async () => {
    try {
      const response = await API.get("/configuracion-servicios-automaticos");
      return response.data;
    } catch (error) {
      showError("Error al obtener las configuraciones automáticas.");
      throw error;
    }
  },
  crear: async (datos) => {
    try {
      const response = await API.post(
        "/configuracion-servicios-automaticos",
        datos,
      );
      return response.data;
    } catch (error) {
      showError("Error al crear la configuración automática.");
      throw error;
    }
  },
  actualizar: async (id, datos) => {
    try {
      const response = await API.patch(
        `/configuracion-servicios-automaticos/${id}`,
        datos,
      );
      return response.data;
    } catch (error) {
      showError("Error al actualizar la configuración automática.");
      throw error;
    }
  },
  eliminar: async (id) => {
    try {
      const response = await API.delete(
        `/configuracion-servicios-automaticos/${id}`,
      );
      return response.data;
    } catch (error) {
      showError("Error al eliminar la configuración automática.");
      throw error;
    }
  },
};

const ConfiguracionServiciosAutomaticos = () => {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    id_servicio: "",
    horaInicio: "08:00",
    horaFin: "08:30",
    procesarAutomaticamente: true,
    descripcion: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [configResponse, serviciosResponse] = await Promise.all([
        configuracionAutomaticaAPI.obtenerTodas(),
        serviciosAPI.getAll(),
      ]);

      setConfiguraciones(configResponse.data || []);
      setServicios(
        Array.isArray(serviciosResponse)
          ? serviciosResponse
          : serviciosResponse.data || [],
      );
    } catch (err) {
      setError("Error al cargar los datos");
      showError("Error al cargar los datos de configuración automática.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAbrirModal = (config = null) => {
    if (config) {
      setEditando(config.id_configuracion);
      setFormData({
        id_servicio: String(config.id_servicio),
        horaInicio: config.horaInicio,
        horaFin: config.horaFin,
        procesarAutomaticamente: config.procesarAutomaticamente,
        descripcion: config.descripcion,
      });
    } else {
      setEditando(null);
      setFormData({
        id_servicio: "",
        horaInicio: "08:00",
        horaFin: "08:30",
        procesarAutomaticamente: true,
        descripcion: "",
      });
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.id_servicio || formData.id_servicio === "") {
      showError("Validación", "Debe seleccionar un servicio");
      return;
    }

    try {
      const idServicio = parseInt(formData.id_servicio, 10);

      if (isNaN(idServicio)) {
        showError("Error", "El servicio seleccionado no es válido");
        return;
      }

      const datosConvertidos = {
        ...formData,
        id_servicio: idServicio,
      };

      if (editando) {
        await configuracionAutomaticaAPI.actualizar(editando, datosConvertidos);
        setModalAbierto(false);
        showSuccess("¡Éxito!", "Configuración actualizada exitosamente");
      } else {
        await configuracionAutomaticaAPI.crear(datosConvertidos);
        setModalAbierto(false);
        showSuccess("¡Éxito!", "Configuración creada exitosamente");
      }

      cargarDatos();
    } catch (err) {
      showError("Error", "No se pudo guardar la configuración");
      const errorMessage =
        err.response?.data?.message || "Error al guardar la configuración";

      if (
        err.response?.status === 409 ||
        errorMessage.toLowerCase().includes("ya existe")
      ) {
        setError(errorMessage);
      } else {
        showError("Error", errorMessage);
      }
    }
  };

  const handleEliminar = async (id, nombreServicio) => {
    const result = await showConfirm(
      "Eliminar Configuración",
      `¿Está seguro de que desea eliminar la configuración del servicio "${nombreServicio}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (result) {
      try {
        const idNum = typeof id === "number" ? id : parseInt(id, 10);

        if (!idNum || isNaN(idNum)) {
          showError("Error", "ID de configuración inválido");
          return;
        }

        await configuracionAutomaticaAPI.eliminar(idNum);
        showSuccess("¡Éxito!", "Configuración eliminada exitosamente");
        await cargarDatos();
      } catch (err) {
        showError("Error", "No se pudo eliminar la configuración");
      }
    }
  };

  const getNombreServicio = (idServicio) => {
    // NOTA: Verifica si en tu BD es s.idServicio o s.id_servicio
    const servicio = servicios.find(
      (s) => s.idServicio === idServicio || s.id_servicio === idServicio,
    );
    return servicio ? servicio.nombre : "Sin especificar";
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Configuración de Servicios...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>
            Configuración de Servicios Automáticos
          </h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={() => handleAbrirModal()}
          >
            <i className="fas fa-plus"></i> Agregar Configuración
          </button>
        </div>
      </div>

      <div className={ContenidoStyle.tableContainer}>
        {configuraciones.length === 0 ? (
          /* CORRECCIÓN: Contenedor div limpio sin atributos de tabla obsoletos */
          <div className={TablaStyle.emptyState}>
            <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
            <h5>No se encontraron configuraciones de servicios</h5>
            <p>No hay configuraciones que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className={TablaStyle.scrollableTable}>
            <div className={TablaStyle.tableBodyScroll}>
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th>#</th>
                    <th>Servicio</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                    <th>Automático</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {configuraciones.map((config, index) => (
                    <tr key={config.id_configuracion}>
                      <td className="fw-bold">{index + 1}</td>
                      <td>
                        <strong>{getNombreServicio(config.id_servicio)}</strong>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {config.horaInicio}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {config.horaFin}
                        </span>
                      </td>
                      <td>
                        {config.procesarAutomaticamente ? (
                          <span className="badge bg-success">
                            <i className="fas fa-check me-1"></i> Sí
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="fas fa-times me-1"></i> No
                          </span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {config.descripcion}
                        </small>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleAbrirModal(config)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() =>
                              handleEliminar(
                                config.id_configuracion,
                                getNombreServicio(config.id_servicio),
                              )
                            }
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Principal */}
      {modalAbierto &&
        createPortal(
          <div className={`modal fade show d-block ${FormularioStyle.modal}`}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-clock me-2"></i>
                    {editando ? "Editar Configuración" : "Nueva Configuración"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={() => setModalAbierto(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleGuardar}>
                  <div className={FormularioStyle.modalBody}>
                    <div className={ComponenteStyle.formGroup}>
                      <label className={ComponenteStyle.formLabel}>
                        <i className="fas fa-utensils me-2"></i> Servicio
                      </label>
                      <select
                        className={ComponenteStyle.formSelect}
                        name="id_servicio"
                        value={formData.id_servicio}
                        onChange={handleInputChange}
                        required
                        disabled={!!editando}
                      >
                        <option value="">Seleccionar servicio</option>
                        {servicios.map((servicio) => (
                          <option
                            key={`servicio-${servicio.idServicio || servicio.id_servicio}`}
                            value={String(
                              servicio.idServicio || servicio.id_servicio,
                            )}
                          >
                            {servicio.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={ComponenteStyle.formRow}>
                      <div className={ComponenteStyle.formGroup}>
                        <label className={ComponenteStyle.formLabel}>
                          <i className="fas fa-clock me-2"></i> Hora Inicio
                        </label>
                        <input
                          type="time"
                          className={ComponenteStyle.formControl}
                          name="horaInicio"
                          value={formData.horaInicio}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className={ComponenteStyle.formGroup}>
                        <label className={ComponenteStyle.formLabel}>
                          <i className="fas fa-clock me-2"></i> Hora Fin
                        </label>
                        <input
                          type="time"
                          className={ComponenteStyle.formControl}
                          name="horaFin"
                          value={formData.horaFin}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="procesarAutomaticamente"
                          name="procesarAutomaticamente"
                          checked={formData.procesarAutomaticamente}
                          onChange={handleInputChange}
                        />
                        <label
                          className={ComponenteStyle.formCheckLabel}
                          htmlFor="procesarAutomaticamente"
                        >
                          Procesar Automáticamente
                        </label>
                      </div>
                    </div>

                    <div className={ComponenteStyle.formGroup}>
                      <label className={ComponenteStyle.formLabel}>
                        <i className="fas fa-file-alt me-2"></i> Descripción
                      </label>
                      <textarea
                        className={ComponenteStyle.formControl}
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Descripción opcional"
                      ></textarea>
                    </div>

                    {error && (
                      <div
                        className="alert alert-danger alert-dismissible fade show"
                        role="alert"
                      >
                        <div>
                          <i className="fas fa-exclamation-circle me-2"></i>
                          <strong className="me-1">Error:</strong> {error}
                        </div>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setError("")}
                          aria-label="Close"
                        ></button>
                      </div>
                    )}

                    <div className={ComponenteStyle.formActions}>
                      <button
                        type="button"
                        className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
                        onClick={() => setModalAbierto(false)}
                      >
                        <i className="fas fa-times"></i> Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
                      >
                        <i className="fas fa-save"></i>{" "}
                        {editando ? "Actualizar" : "Guardar"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Backdrop del Modal */}
      {/* CORRECCIÓN: Cierre sintáctico correcto del createPortal */}
      {modalAbierto &&
        createPortal(
          <div
            className={`${FormularioStyle.modalBackdrop}`}
            style={{ zIndex: 1040, pointerEvents: "all" }}
          ></div>,
          document.body,
        )}
    </div>
  );
};

export default ConfiguracionServiciosAutomaticos;
