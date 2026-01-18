import { useState, useEffect } from "react";
import UsuarioForm from "../../components/admin/UsuarioForm.jsx";
import usuarioService from "../../services/usuarioService.js";
import { rolService } from "../../services/rolService.js";
import "../../styles/table-insumos.css";
import { formatLastActivity } from "../../utils/dateUtils.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view', 'edit', 'create'
  const [itemsPerPage] = useState(10);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados para filtros dinámicos
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await rolService.getActivos();
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      showError("Error", "No se pudieron cargar los roles.");
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getAll();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (error) {
      showError("Error", "Error al cargar usuarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = usuarios;

    // Filtrar por búsqueda
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((usuario) => {
        try {
          return (
            (usuario.nombreUsuario &&
              usuario.nombreUsuario.toLowerCase().includes(searchLower)) ||
            (usuario.mail &&
              usuario.mail.toLowerCase().includes(searchLower)) ||
            (usuario.nombre &&
              usuario.nombre.toLowerCase().includes(searchLower)) ||
            (usuario.apellido &&
              usuario.apellido.toLowerCase().includes(searchLower))
          );
        } catch (error) {
          showError("Error", "Error al filtrar usuarios.");
          return false;
        }
      });
    }

    // Filtrar por estado
    if (filterEstado && filterEstado !== "") {
      filtered = filtered.filter((usuario) => usuario.estado === filterEstado);
    }

    // Filtrar por rol
    if (filterRol && filterRol !== "") {
      filtered = filtered.filter((usuario) => usuario.nombreRol === filterRol);
    }

    setFilteredUsuarios(filtered);
    setCurrentPage(1); // Resetear a la primera página al filtrar
  }, [searchQuery, filterEstado, filterRol, usuarios]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
  };

  const handleFilterRol = (e) => {
    setFilterRol(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterEstado("");
    setFilterRol("");
  };

  const openModal = (mode, usuario = null) => {
    setModalMode(mode);
    setSelectedUsuario(usuario);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUsuario(null);
  };

  const handleToggleUsuarioEstado = async (usuario) => {
    const isActive = usuario.estado === "Activo";
    const action = isActive ? "deshabilitar" : "activar";
    const newState = isActive ? "Inactivo" : "Activo";

    // 1. Confirmación asíncrona con textos dinámicos
    const confirmed = await showConfirm(
      isActive ? "Deshabilitar Usuario" : "Activar Usuario",
      `¿Está seguro de que desea ${action} al usuario "${usuario.nombre}"?`,
      isActive ? "Sí, deshabilitar" : "Sí, activar",
      "Cancelar"
    );

    if (confirmed) {
      try {
        const updatedData = { estado: newState };
        await usuarioService.update(usuario.idUsuario, updatedData);

        // 2. Feedback visual diferenciado
        if (newState === "Activo") {
          showSuccess(
            "Usuario Activado",
            `El usuario "${usuario.nombre}" ahora tiene acceso al sistema.`
          );
        } else {
          showInfo(
            "Usuario Deshabilitado",
            `El usuario "${usuario.nombre}" ha sido inactivado correctamente.`
          );
        }

        // 3. Refrescar la tabla
        loadUsuarios();
      } catch (error) {
        showError("Error", `Error al ${action} usuario: ${error.message}`);
      }
    }
  };

  return (
    <div>
      <div className="page-header mb-3">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-users me-2"></i>
            Gestión de Usuarios
          </h1>
          <p className="page-subtitle">
            Administra los usuarios y sus roles disponibles
          </p>
        </div>
      </div>
      {/* Lista de Usuarios */}
      <div className="tab-content">
        {/* Filtros de búsqueda y estado */}
        <div className="page-header mb-3">
          <div className="header-left">
            <div className="search-filters">
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por usuario, nombre, apellido o email..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className="filter-actions">
                <select
                  className="filter-select"
                  value={filterEstado}
                  onChange={handleFilterEstado}
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>

                {(searchQuery || filterEstado || filterRol) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearFilters}
                    title="Limpiar filtros"
                  >
                    <i className="fas fa-times"></i>
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div
          className="table-container"
          style={{ minHeight: "400px", overflow: "auto" }}
        >
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Cargando usuarios...</p>
            </div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table
                className="table table-striped data-table table-responsive-insumos"
                style={{ minWidth: 900 }}
              >
                <colgroup>
                  <col style={{ width: "1%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead className="table-header-fixed">
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Fecha Alta</th>
                    <th>Última Actividad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <p>No se encontraron usuarios.</p>
                      </td>
                    </tr>
                  ) : (
                    currentUsuarios.map((usuario, index) => (
                      <tr key={usuario.idUsuario || `usuario-${index}`}>
                        <td>
                          <strong>{index + 1}</strong>
                        </td>
                        <td className="truncate-cell">
                          <strong>
                            {usuario.nombreUsuario || "Sin usuario"}
                          </strong>
                          <div className="text-muted small">
                            {(usuario.nombre || "") +
                              " " +
                              (usuario.apellido || "")}
                          </div>
                          {usuario.mail || "N/A"}
                        </td>
                        <td className="truncate-cell">
                          {usuario.telefono || "N/A"}
                        </td>
                        <td>
                          {usuario.nombreRol ? (
                            <span className="badge bg-info">
                              {usuario.nombreRol}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>
                          {usuario.fechaAlta
                            ? new Date(usuario.fechaAlta).toLocaleDateString(
                                "es-ES"
                              )
                            : "N/A"}
                        </td>
                        <td>
                          {(() => {
                            const activity = formatLastActivity(
                              usuario.fechaUltimaActividad
                            );
                            if (activity.isNever) {
                              return (
                                <span
                                  style={{ color: "#999", fontStyle: "italic" }}
                                >
                                  Nunca
                                </span>
                              );
                            }
                            return (
                              <div>
                                <div
                                  style={{
                                    fontWeight: activity.isRecent
                                      ? "bold"
                                      : "normal",
                                    color: activity.isRecent
                                      ? "#2563eb"
                                      : "inherit",
                                  }}
                                >
                                  {activity.relativeTime}
                                </div>
                                <div>
                                  <small style={{ color: "#666" }}>
                                    {activity.fecha}
                                  </small>
                                </div>
                                <div>
                                  <small style={{ color: "#666" }}>
                                    {activity.hora}
                                  </small>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span>{usuario.estado || "Desconocido"}</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => openModal("view", usuario)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => openModal("edit", usuario)}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              className={`btn-action ${
                                usuario.estado === "Activo"
                                  ? "btn-disable"
                                  : "btn-enable"
                              }`}
                              onClick={() => handleToggleUsuarioEstado(usuario)}
                              title={
                                usuario.estado === "Activo"
                                  ? "Deshabilitar usuario"
                                  : "Activar usuario"
                              }
                            >
                              <i
                                className={`fas ${
                                  usuario.estado === "Activo"
                                    ? "fa-user-slash"
                                    : "fa-user-check"
                                }`}
                              ></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="pagination-info">
              Página {currentPage} de {totalPages} ({filteredUsuarios.length}{" "}
              usuario{filteredUsuarios.length !== 1 ? "s" : ""})
            </div>
            <button
              className="pagination-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {/* Modal para Usuario */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content usuario-modal">
              <div className="modal-header">
                <h3>
                  {modalMode === "view" && (
                    <h3 className="text-white">
                      <i className="fas fa-eye"></i> Detalle del Usuario
                    </h3>
                  )}
                  {modalMode === "edit" && (
                    <h3 className="text-white">
                      <i className="fas fa-pencil-alt"></i> Editar Usuario
                    </h3>
                  )}
                </h3>
                <button className="modal-close text-white" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <UsuarioForm
                  usuario={selectedUsuario}
                  mode={modalMode}
                  onCancel={() => {
                    closeModal();
                    loadUsuarios(); // Recargar la lista después de cerrar el modal
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
