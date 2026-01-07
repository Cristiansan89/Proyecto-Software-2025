import { useState, useEffect } from "react";
import API from "../../services/api";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import "../../styles/ConfiguracionServiciosAutomaticos.css";

// Funciones de configuración automática y servicios integradas
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
      //console.error("Error al obtener configuraciones:", error);
      showError("Error al obtener las configuraciones automáticas.");
      throw error;
    }
  },

  crear: async (datos) => {
    try {
      const response = await API.post(
        "/configuracion-servicios-automaticos",
        datos
      );
      return response.data;
    } catch (error) {
      //console.error("Error al crear configuración:", error);
      showError("Error al crear la configuración automática.");
      throw error;
    }
  },

  actualizar: async (id, datos) => {
    try {
      const response = await API.patch(
        `/configuracion-servicios-automaticos/${id}`,
        datos
      );
      return response.data;
    } catch (error) {
      //console.error("Error al actualizar configuración:", error);
      showError("Error al actualizar la configuración automática.");
      throw error;
    }
  },

  eliminar: async (id) => {
    try {
      const response = await API.delete(
        `/configuracion-servicios-automaticos/${id}`
      );
      return response.data;
    } catch (error) {
      //console.error("Error al eliminar configuración:", error);
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
  const [success, setSuccess] = useState("");
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

      //console.log("Servicios cargados:", serviciosResponse);
      setConfiguraciones(configResponse.data || []);
      setServicios(
        Array.isArray(serviciosResponse)
          ? serviciosResponse
          : serviciosResponse.data || []
      );
    } catch (err) {
      setError("Error al cargar los datos");
      //console.error(err);
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
        id_servicio: String(config.id_servicio), // Convertir a string para el select
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
    setSuccess("");

    // Validar que el servicio esté seleccionado
    if (!formData.id_servicio || formData.id_servicio === "") {
      showError("Validación", "Debe seleccionar un servicio");
      return;
    }

    try {
      // Convertir id_servicio a número
      const idServicio = parseInt(formData.id_servicio, 10);

      // Validar que la conversión fue exitosa
      if (isNaN(idServicio)) {
        showError("Error", "El servicio seleccionado no es válido");
        //console.error("id_servicio inválido:", formData.id_servicio);
        return;
      }

      const datosConvertidos = {
        ...formData,
        id_servicio: idServicio,
      };

      //console.log("Datos a enviar:", datosConvertidos);

      if (editando) {
        await configuracionAutomaticaAPI.actualizar(editando, datosConvertidos);

        // Cerrar modal inmediatamente
        setModalAbierto(false);

        // Mostrar alert de éxito
        showSuccess("¡Éxito!", "Configuración actualizada exitosamente");
      } else {
        await configuracionAutomaticaAPI.crear(datosConvertidos);

        // Cerrar modal inmediatamente
        setModalAbierto(false);

        // Mostrar alert de éxito
        showSuccess("¡Éxito!", "Configuración creada exitosamente");
      }

      cargarDatos();
    } catch (err) {
      // console.error("Error detallado:", err.response?.data);
      showError("Error", "No se pudo guardar la configuración");
      const errorMessage =
        err.response?.data?.message || "Error al guardar la configuración";

      // Detectar error de duplicación
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
    // 1. Confirmación asíncrona con alertService
    const result = await showConfirm(
      "Eliminar Configuración",
      `¿Está seguro de que desea eliminar la configuración del servicio "${nombreServicio}"?`,
      "Sí, eliminar",
      "Cancelar"
    );

    // 2. Proceder solo si el usuario confirmó
    if (result.isConfirmed) {
      try {
        await configuracionAutomaticaAPI.eliminar(id);

        // 3. Mostrar éxito
        showSuccess("¡Éxito!", "Configuración eliminada exitosamente");

        // 4. Recargar los datos de la tabla
        cargarDatos();
      } catch (err) {
        // 5. Gestión de errores
        // console.error("Error al eliminar:", err);
        showError("Error", "No se pudo eliminar la configuración");
      }
    }
  };
  const getNombreServicio = (idServicio) => {
    const servicio = servicios.find((s) => s.idServicio === idServicio);
    return servicio ? servicio.nombre : "Sin especificar";
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracion-servicios-container mt-1">
      <div className="page-header mb-3">
        <div className="header-left">
          <h2 className="page-title-sub">
            Configuración de Servicios Automáticos
          </h2>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary-new"
            onClick={() => handleAbrirModal()}
          >
            <i className="fas fa-plus"></i>
            Agregar Configuración
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando grados...</p>
          </div>
        ) : (
          <div className="scrollable-table">
            <div className="table-body-scroll">
              <table
                className="table table-striped data-table"
                style={{ width: "100%" }}
              >
                <thead className="table-header-fixed">
                  <tr>
                    <th>Servicio</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                    <th>Automático</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {configuraciones.map((config) => (
                    <tr key={config.id_configuracion}>
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
                            <i className="fas fa-check me-1"></i>
                            Sí
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="fas fa-times me-1"></i>
                            No
                          </span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {config.descripcion}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleAbrirModal(config)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleEliminar(
                              config.id_configuracion,
                              getNombreServicio(config.id_servicio)
                            )
                          }
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="modal fade show d-block">
          <div className="modal-dialog">
            <div>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-clock me-2"></i>
                  {editando ? "Editar Configuración" : "Nueva Configuración"}
                </h5>
                <button
                  className="modal-close text-white"
                  onClick={() => setModalAbierto(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="fas fa-utensils me-2"></i>
                      Servicio
                    </label>
                    <select
                      className="form-select"
                      name="id_servicio"
                      value={formData.id_servicio}
                      onChange={handleInputChange}
                      required
                      disabled={!!editando}
                    >
                      <option key="empty" value="">
                        Seleccionar servicio
                      </option>
                      {servicios.map((servicio) => (
                        <option
                          key={`servicio-${servicio.idServicio}`}
                          value={String(servicio.idServicio)}
                        >
                          {servicio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row mb-3">
                    <div className="form-group">
                      <label className="form-label">
                        <i className="fas fa-clock me-2"></i>
                        Hora Inicio
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        name="horaInicio"
                        value={formData.horaInicio}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <i className="fas fa-clock me-2"></i>
                        Hora Fin
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        name="horaFin"
                        value={formData.horaFin}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
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
                        className="form-check-label"
                        htmlFor="procesarAutomaticamente"
                      >
                        Procesar Automáticamente
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <i className="fas fa-file-alt me-2"></i>
                      Descripción
                    </label>
                    <textarea
                      className="form-control"
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

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setModalAbierto(false)}
                    >
                      <i className="fas fa-times"></i>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-save"></i>
                      {editando ? "Actualizar" : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ConfiguracionServiciosAutomaticos;
