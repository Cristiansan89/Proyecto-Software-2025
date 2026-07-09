import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ServicioForm from "../../components/admin/ServicioForm";
import servicioService from "../../services/servicioService";
import servicioTurnoService from "../../services/servicioTurnoService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showInfoError,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const ListaServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [servicioTurnos, setServicioTurnos] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Cargar servicios al montar el componente
  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    //console.log("ListaServicios: Iniciando loadServicios");
    try {
      setLoading(true);
      const data = await servicioService.getAll();
      //console.log("ListaServicios: Datos recibidos:", data);
      setServicios(data);

      // Cargar turnos para cada servicio
      const turnosData = {};
      for (const servicio of data) {
        try {
          const turnos = await servicioTurnoService.getTurnosByServicio(
            servicio.idServicio,
          );
          turnosData[servicio.idServicio] = turnos;
        } catch (error) {
          /*console.error(
            `Error al cargar turnos para servicio ${servicio.idServicio}:`,
            error
          );*/
          showError(
            "Error",
            `Error al cargar los turnos para el servicio ${servicio.nombre}`,
          );
          turnosData[servicio.idServicio] = [];
        }
      }
      setServicioTurnos(turnosData);
    } catch (error) {
      //console.error("Error al cargar servicios:", error);
      showError("Error", "Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios
  const filteredServicios = servicios.filter((servicio) => {
    const matchesSearch =
      servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "" || servicio.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Ordenar por id (soporta ids numéricos o strings/UUID)
  const sortedServicios = filteredServicios.slice().sort((a, b) => {
    const ia = String(a.idServicio ?? "");
    const ib = String(b.idServicio ?? "");
    const onlyDigits = /^\d+$/;
    if (onlyDigits.test(ia) && onlyDigits.test(ib)) {
      return Number(ia) - Number(ib);
    }
    return ia.localeCompare(ib);
  });

  // Manejar selección de servicios
  // Selección de servicios no utilizada actualmente; se ha eliminado para evitar variables sin uso.
  // Operaciones CRUD
  const handleCreate = () => {
    setSelectedServicio(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (servicio) => {
    setSelectedServicio(servicio);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (servicio) => {
    setSelectedServicio(servicio);
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = async (servicio) => {
    // 1. Solicitamos confirmación con el componente personalizado
    const confirmed = await showConfirm(
      "Eliminar Servicio",
      `¿Está seguro de eliminar el servicio "${servicio.nombre}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Si el usuario confirma, procedemos con la lógica de borrado
    if (confirmed) {
      try {
        await servicioService.delete(servicio.idServicio);

        // Notificación de éxito y actualización de la lista
        showSuccess(
          "Servicio Eliminado",
          `El servicio "${servicio.nombre}" ha sido eliminado correctamente.`,
        );
        loadServicios();
      } catch (error) {
        // Manejo de errores simplificado
        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${error.response.data.message}`);
        } else {
          showError("Error", "Error al eliminar el servicio");
        }
      }
    }
  };

  const handleChangeStatus = async (servicio, nuevoEstado) => {
    try {
      await servicioService.cambiarEstado(servicio.idServicio, nuevoEstado);

      // Comprobamos si el nuevo estado es "activo"
      const esActivo = nuevoEstado.toLowerCase() === "activo";

      if (esActivo) {
        // Icono de Success (Verde) para activaciones
        showSuccess(
          "Servicio Activado",
          `El servicio "${servicio.nombre}" ahora está activo.`,
        );
      } else {
        // Icono de Info (Azul) para desactivaciones
        showInfo(
          "Servicio Desactivado",
          `El servicio "${servicio.nombre}" ha sido desactivado.`,
        );
      }

      loadServicios(); // Recargar la lista
    } catch (error) {
      //console.error("Error al cambiar estado:", error);
      showError("Error", "No se pudo cambiar el estado del servicio");
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setSelectedServicio(null);
    loadServicios();
    showSuccess(
      "Éxito",
      `Servicio ${
        modalMode === "create" ? "creado" : "actualizado"
      } correctamente`,
    );
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedServicio(null);
  };

  const handleSearchTerm = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Servicios...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>Gestionar Servicios</h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              className={ContenidoStyle.searchInput}
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={handleSearchTerm}
            />
          </div>
          <div className={ContenidoStyle.filterActions}>
            <select
              className={ContenidoStyle.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
            {(searchTerm || statusFilter) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                <i className="fas fa-times"></i> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de servicios */}
      <div className={TablaStyle.tableContainer}>
        {filteredServicios.length === 0 ? (
          <div colSpan={12}>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron servicios</h5>
              <p>No hay servicios que coincidan con tu búsqueda.</p>
            </div>
          </div>
        ) : (
          <table className={`${TablaStyle.tableData} table table-striped`}>
            <thead className={TablaStyle.tableHeaderFixed}>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Turno</th>
                <th>Estado</th>
                <th>Fecha Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedServicios.map((servicio) => (
                <tr key={servicio.idServicio}>
                  <td>
                    <strong>{servicio.idServicio}</strong>
                  </td>
                  <td>
                    <div className={TablaStyle.titleTable}>
                      <i className="fas fa-utensils"></i>
                      <strong>{servicio.nombre}</strong>
                    </div>
                  </td>
                  <td>
                    <div className={TablaStyle.titleDescripcion}>
                      {servicio.descripcion}
                    </div>
                  </td>
                  <td>
                    <div className={TablaStyle.turnoBadge}>
                      {servicioTurnos[servicio.idServicio] &&
                      servicioTurnos[servicio.idServicio].length > 0 ? (
                        <div>
                          {servicioTurnos[servicio.idServicio].map((turno) => (
                            <span
                              key={turno.idTurno}
                              title={`${turno.nombreTurno}: ${turno.horaInicio} - ${turno.horaFin}`}
                            >
                              {turno.nombreTurno}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={TablaStyle.noTurnos}>
                          Sin turnos asignados
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${TablaStyle.statusBadge} ${servicio.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                    >
                      {servicio.estado}
                    </span>
                  </td>
                  <td>
                    {servicio.fechaAlta
                      ? new Date(servicio.fechaAlta).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <div className={TablaStyle.actionButtons}>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                        onClick={() => handleView(servicio)}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                        onClick={() => handleEdit(servicio)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                        onClick={() => handleDelete(servicio)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${
                          servicio.estado === "Activo"
                            ? TablaStyle.btnDisable
                            : TablaStyle.btnEnable
                        }`}
                        onClick={() =>
                          handleChangeStatus(
                            servicio,
                            servicio.estado === "Activo"
                              ? "Inactivo"
                              : "Activo",
                          )
                        }
                        title={
                          servicio.estado === "Activo"
                            ? "Desactivar"
                            : "Activar"
                        }
                      >
                        <i
                          className={`fas ${
                            servicio.estado === "Activo"
                              ? "fa-times"
                              : "fa-check"
                          }`}
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-utensils me-2"></i>
                    {modalMode === "create" && "Crear Nuevo Servicio"}
                    {modalMode === "edit" && "Editar Servicio"}
                    {modalMode === "view" && "Ver Servicio"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ServicioForm
                    servicio={selectedServicio}
                    mode={modalMode}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showModal &&
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

export default ListaServicios;
