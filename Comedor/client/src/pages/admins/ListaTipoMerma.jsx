import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import tipoMermaService from "../../services/tipoMermaService.js";
import TipoMermaForm from "../../components/admin/TipoMermaForm.jsx";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const ListaTipoMerma = () => {
  const [tiposMerma, setTiposMerma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("crear");
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Cargar tipos de merma
  const cargarTiposMerma = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tipoMermaService.getAll();
      const dataOrdenada = (data || []).sort((a, b) => {
        return Number(a.id_tipo_merma) - Number(b.id_tipo_merma);
      });
      setTiposMerma(data);
    } catch (error) {
      showError(
        "Error",
        "Error al cargar los tipos de merma: " +
          (error.response?.data?.message || error.message),
      );
      setError("Error al cargar los tipos de merma");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTiposMerma();
  }, []);

  // Abrir modal para crear nuevo tipo
  const handleNuevo = () => {
    setSelectedTipo(null);
    setModalMode("crear");
    setShowModal(true);
  };

  // Abrir modal para editar tipo
  const handleEditar = (tipo) => {
    setSelectedTipo(tipo);
    setModalMode("editar");
    setShowModal(true);
  };

  const filteredTiposMermas = tiposMerma.filter((tipo) => {
    const matchesSearch = (tipo.nombre || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || tipo.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // Eliminar tipo
  const handleEliminar = async (id, nombre) => {
    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Tipo de Merma",
      `¿Está seguro de que desea eliminar el tipo de merma "${nombre}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Si el usuario confirma, ejecutamos la acción
    if (confirmed) {
      try {
        await tipoMermaService.delete(id);

        // Recargar lista y mostrar éxito
        await cargarTiposMerma();
        showSuccess(
          "Éxito",
          `Tipo de merma "${nombre}" eliminado exitosamente`,
        );
      } catch (error) {
        // Manejo de errores sin console.log innecesarios
        showError(
          "Error",
          "Error al eliminar el tipo de merma: " +
            (error.response?.data?.message || error.message),
        );
      }
    }
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setShowModal(false);
    setSelectedTipo(null);
  };

  // Manejar guardado exitoso
  const handleGuardadoExitoso = async () => {
    setShowModal(false);
    setSelectedTipo(null);
    await cargarTiposMerma();
    showSuccess("Éxito", "Tipo de merma guardado exitosamente");
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Tipos de Mermas...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>
            Gestionar Tipos de Mermas
          </h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleNuevo}
          >
            <i className="fas fa-plus me-1"></i>Nuevo Tipo de Merma
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger}`}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              className={ContenidoStyle.searchInput}
              placeholder="Buscar por nombre..."
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

      {/* Tabla de tipos de merma */}
      <div className={TablaStyle.tableContainer}>
        {filteredTiposMermas.length === 0 ? (
          <div colSpan={12}>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron tipos de merma</h5>
              <p>No hay tipos de merma que coincidan con tu búsqueda.</p>
            </div>
          </div>
        ) : (
          <table className={`${TablaStyle.tableData} table table-striped`}>
            <thead className={TablaStyle.tableHeaderFixed}>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTiposMermas.map((tipo) => (
                <tr key={tipo.id_tipo_merma}>
                  <td>
                    <strong>{tipo.id_tipo_merma}</strong>
                  </td>
                  <td>
                    <div className={TablaStyle.titleTable}>
                      <i className="fas fa-tag me-2"></i>
                      <strong>{tipo.nombre}</strong>
                    </div>
                  </td>
                  <td>
                    {" "}
                    <div className={TablaStyle.titleDescripcion}>
                      {tipo.descripcion || "-"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${TablaStyle.statusBadge} ${tipo.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                    >
                      {tipo.estado}
                    </span>
                  </td>
                  <td>
                    <div className={TablaStyle.actionButtons}>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                        onClick={() => handleEditar(tipo)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                        onClick={() =>
                          handleEliminar(tipo.id_tipo_merma, tipo.nombre)
                        }
                        title="Eliminar"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para agregar/editar tipo */}
      {showModal &&
        createPortal(
          <div className={`${FormularioStyle.modal} fade show d-block`}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-tags me-2"></i>
                    {modalMode === "crear"
                      ? "Nuevo Tipo de Merma"
                      : "Editar Tipo de Merma"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCerrarModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className={FormularioStyle.modalBody}>
                  <TipoMermaForm
                    tipoMerma={selectedTipo}
                    mode={modalMode}
                    onSave={handleGuardadoExitoso}
                    onCancel={handleCerrarModal}
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

export default ListaTipoMerma;
