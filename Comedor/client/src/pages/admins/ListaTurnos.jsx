import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import TurnoForm from "../../components/admin/TurnoForm";
import turnoService from "../../services/turnoService";
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

const ListaTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Cargar turnos al montar el componente
  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    // console.log("ListaTurnos: Iniciando loadTurnos");
    try {
      setLoading(true);
      const data = await turnoService.getAll();
      //console.log("ListaTurnos: Datos recibidos:", data);
      setTurnos(data);
    } catch (error) {
      //console.error("Error al cargar turnos:", error);
      showError("Error", "Error al cargar los turnos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar turnos
  const filteredTurnos = turnos.filter((turno) => {
    const matchesSearch = (turno.nombre || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || turno.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Operaciones CRUD
  const handleCreate = () => {
    setSelectedTurno(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (turno) => {
    setSelectedTurno(turno);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (turno) => {
    setSelectedTurno(turno);
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = async (turno) => {
    // 1. Solicitamos confirmación personalizada
    const confirmed = await showConfirm(
      "Eliminar Turno",
      `¿Está seguro de eliminar el turno "${turno.nombre}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Si el usuario confirma, ejecutamos la eliminación
    if (confirmed) {
      try {
        await turnoService.delete(turno.idTurno);

        // Feedback de éxito y recarga de datos
        showSuccess(
          "Éxito",
          `El Turno "${turno.nombre}" ha sido eliminado correctamente`,
        );
        loadTurnos();
      } catch (error) {
        // Manejo de errores sin logs de consola
        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${error.response.data.message}`);
        } else {
          showError("Error", "Error al eliminar el turno");
        }
      }
    }
  };

  const handleChangeStatus = async (turno, nuevoEstado) => {
    try {
      await turnoService.cambiarEstado(turno.idTurno, nuevoEstado);

      // Normalizamos el estado a minúsculas para comparar fácilmente
      const estadoNormalizado = nuevoEstado.toLowerCase();

      if (estadoNormalizado === "activo") {
        // Icono de Success (verde/check) para activados
        showSuccess(
          "Turno Activado",
          `El Turno "${turno.nombre}" activado correctamente`,
        );
      } else {
        // Icono de Info (azul/información) para desactivados
        showInfo(
          "Turno Desactivado",
          `El Turno "${turno.nombre}" desactivado correctamente`,
        );
      }

      loadTurnos();
    } catch (error) {
      // console.error("Error al cambiar estado:", error);
      showError("Error", "Error al cambiar el estado del turno");
    }
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

  const handleSave = () => {
    setShowModal(false);
    setSelectedTurno(null);
    loadTurnos();
    showSuccess(
      "Éxito",
      `Turno ${modalMode === "create" ? "creado" : "actualizado"} correctamente`,
    );
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedTurno(null);
  };

  const formatTime = (time) => {
    if (!time) return "";
    return time.substring(0, 5); // Remover segundos (HH:MM:SS -> HH:MM)
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Turnos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>Gestionar Turnos</h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Nuevo Turno
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
              placeholder="Buscar turnos..."
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
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            {(searchTerm || statusFilter) && (
              <button
                className={ContenidoStyle.btnOutlineSecondary}
                onClick={clearFilters}
              >
                <i className="fas fa-times"></i> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de turnos */}
      <div className={TablaStyle.tableContainer}>
        {filteredTurnos.length === 0 ? (
          <div colSpan={12}>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron turnos</h5>
              <p>No hay turnos que coincidan con tu búsqueda.</p>
            </div>
          </div>
        ) : (
          <table className={`${TablaStyle.tableData} table table-striped`}>
            <thead className={TablaStyle.tableHeaderFixed}>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Horario</th>
                <th>Estado</th>
                <th>Fecha Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTurnos.map((turno) => (
                <tr key={turno.idTurno}>
                  <td>
                    <strong>{turno.idTurno}</strong>
                  </td>
                  <td>
                    <div className={TablaStyle.titleTable}>
                      <i className="fas fa-clock"></i>
                      <strong>{turno.nombre}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={TablaStyle.horarioBadge}>
                      {formatTime(turno.horaInicio)} -{" "}
                      {formatTime(turno.horaFin)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${TablaStyle.statusBadge} ${turno.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                    >
                      {turno.estado}
                    </span>
                  </td>
                  <td>
                    {turno.fechaAlta
                      ? new Date(turno.fechaAlta).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <div className={TablaStyle.actionButtons}>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                        onClick={() => handleView(turno)}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                        onClick={() => handleEdit(turno)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                        onClick={() => handleDelete(turno)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${
                          turno.estado === "Activo"
                            ? TablaStyle.btnDisable
                            : TablaStyle.btnEnable
                        }`}
                        onClick={() =>
                          handleChangeStatus(
                            turno,
                            turno.estado === "Activo" ? "Inactivo" : "Activo",
                          )
                        }
                        title={
                          turno.estado === "Activo" ? "Desactivar" : "Activar"
                        }
                      >
                        <i
                          className={`fas ${
                            turno.estado === "Activo" ? "fa-times" : "fa-check"
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
                    <i className="fas fa-clock me-2"></i>
                    {modalMode === "create" && "Crear Nuevo Turno"}
                    {modalMode === "edit" && "Editar Turno"}
                    {modalMode === "view" && "Ver Turno"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <TurnoForm
                    turno={selectedTurno}
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

export default ListaTurnos;
