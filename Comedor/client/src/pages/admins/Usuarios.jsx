import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import UsuarioForm from "../../components/admin/UsuarioForm.jsx";
import usuarioService from "../../services/usuarioService.js";
import { rolService } from "../../services/rolService.js";
import { formatLastActivity } from "../../utils/dateUtils.js";
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

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view', 'edit', 'create'
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

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
      `¿Está seguro de que desea ${action} al usuario "<b>${usuario.nombreUsuario}</b>"?`,
      isActive ? "Sí, deshabilitar" : "Sí, activar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        const updatedData = { estado: newState };
        await usuarioService.update(usuario.idUsuario, updatedData);

        // 2. Feedback visual diferenciado
        if (newState === "Activo") {
          showSuccess(
            "Usuario Activado",
            `El usuario "<b>${usuario.nombreUsuario}</b>" ahora tiene acceso al sistema.`,
          );
        } else {
          showInfo(
            "Usuario Deshabilitado",
            `El usuario "<b>${usuario.nombreUsuario}</b>" ha sido inactivado correctamente.`,
          );
        }

        // 3. Refrescar la tabla
        loadUsuarios();
      } catch (error) {
        showError("Error", `Error al ${action} usuario: ${error.message}`);
      }
    }
  };

  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
  };

  const getPaginationNumbers = () => {
    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Si hay más de 10 páginas, mostrar 10 números
    let start = currentPage - 5;
    let end = currentPage + 5;

    // Ajustar si está cerca del inicio
    if (start < 1) {
      start = 1;
      end = 10;
    }

    // Ajustar si está cerca del final
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - 9);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Usuarios...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-users"></i>
            Gestión de Usuarios
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los usuarios y sus roles disponibles
          </p>
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.searchBar}>
              <input
                type="text"
                className={ContenidoStyle.searchInput}
                placeholder="Buscar por usuario, nombre, apellido o email..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className={ContenidoStyle.filterActions}>
              <select
                className={ContenidoStyle.filterSelect}
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

        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, filteredUsuarios.length)} de{" "}
            {filteredUsuarios.length} usuarios
          </div>
          <div className={TablaStyle.itemsPerPage}>
            <label>
              <strong>Registros por página:</strong>
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className={TablaStyle.tableContainer}>
          {currentUsuarios.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron usuarios</h5>
              <p>No hay usuarios que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <table className={`${TablaStyle.tableData} table table-striped`}>
              <colgroup>
                <col style={{ width: "1%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "17%" }} />
              </colgroup>
              <thead className={TablaStyle.tableHeaderFixed}>
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
                {currentUsuarios.map((usuario, index) => (
                  <tr key={usuario.idUsuario || `usuario-${index}`}>
                    <td>
                      <strong>{startIndex + index + 1}</strong>
                    </td>
                    <td>
                      <strong>{usuario.nombreUsuario || "Sin usuario"}</strong>
                      <div className="text-muted small">
                        {(usuario.nombre || "") +
                          " " +
                          (usuario.apellido || "")}
                      </div>
                      {usuario.mail || "N/A"}
                    </td>
                    <td>{usuario.telefono || "N/A"}</td>
                    <td>
                      {usuario.nombreRol ? (
                        <span
                          className={`${TablaStyle.typeBadge} ${
                            usuario.nombreRol === "Alumno"
                              ? TablaStyle.studentBadge
                              : TablaStyle.teacherBadge
                          }`}
                        >
                          {usuario.nombreRol}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {usuario.fechaAlta
                        ? new Date(usuario.fechaAlta).toLocaleDateString(
                            "es-ES",
                          )
                        : "N/A"}
                    </td>
                    <td>
                      {(() => {
                        const activity = formatLastActivity(
                          usuario.fechaUltimaActividad,
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
                      <span
                        className={`${TablaStyle.statusBadge} ${usuario.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                      >
                        {usuario.estado}
                      </span>
                    </td>
                    <td>
                      <div className={TablaStyle.actionButtons}>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                          onClick={() => openModal("view", usuario)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                          onClick={() => openModal("edit", usuario)}
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button
                          className={`${TablaStyle.btnAction} ${
                            usuario.estado === "Activo"
                              ? TablaStyle.btnDisable
                              : TablaStyle.btnEnable
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={TablaStyle.pagination}>
            <button
              className={TablaStyle.paginationButton}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {getPaginationNumbers().map((page) => (
              <button
                key={page}
                className={`${TablaStyle.paginationButton} ${currentPage === page ? TablaStyle.active : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className={TablaStyle.paginationButton}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Modal para Usuario */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    {modalMode === "view" && (
                      <>
                        <i className="fas fa-eye"></i> Detalle del Usuario
                      </>
                    )}
                    {modalMode === "edit" && (
                      <>
                        <i className="fas fa-pencil-alt"></i> Editar Usuario
                      </>
                    )}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
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

export default Usuarios;
