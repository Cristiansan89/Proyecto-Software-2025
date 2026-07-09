import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { permisoService } from "../../services/permisoService";
import { rolService } from "../../services/rolService";
import { rolPermisoService } from "../../services/rolPermisoService";
import API from "../../services/api.js";
import PermisoForm from "../../components/admin/PermisoForm";
import AsignarPermisosForm from "../../components/admin/AsignarPermisosForm";
import RolForm from "../../components/admin/RolForm";
import ErrorBoundary from "../../components/ErrorBoundary";
import {
  showSuccess,
  showError,
  showConfirm,
  showInfo,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const GestionRolesPermisos = () => {
  const [vistaActiva, setVistaActiva] = useState("permisos");
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asignacionesIndividuales, setAsignacionesIndividuales] = useState([]);
  const [error, setError] = useState(null);
  const [rolSeleccionadoParaEditar, setRolSeleccionadoParaEditar] =
    useState(null);

  // Cargar datos básicos al inicializar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(true);
      try {
        const resultados = await Promise.allSettled([
          loadPermisos(),
          loadRoles(),
          loadAsignacionesIndividuales(),
        ]);

        const errores = resultados
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason);

        if (errores.length > 0) {
          setError(
            `Error al cargar algunos datos: ${errores
              .map((e) => e.message)
              .join(", ")}`,
          );
        } else {
          setError(null);
        }
      } catch (error) {
        setError(`Error crítico: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (vistaActiva === "asignaciones") {
      loadAsignacionesIndividuales();
    }
  }, [vistaActiva]);

  const tabs = [
    { id: "permisos", label: "Gestión de Permisos", icon: "fas fa-key me-2" },
    { id: "roles", label: "Gestión de Roles", icon: "fas fa-users me-2" },
    { id: "asignaciones", label: "Asignar Permisos", icon: "fas fa-link me-2" },
  ];

  const loadPermisos = async () => {
    try {
      setLoading(true);
      const data = await Promise.race([
        permisoService.getAll(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout al cargar permisos")),
            10000,
          ),
        ),
      ]);
      setPermisos(data || []);
    } catch (error) {
      setPermisos([]);
      showError(
        "Error",
        "Error al cargar permisos. Por favor, verifique la conexión.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await Promise.race([
        rolService.getAll(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout al cargar roles")), 10000),
        ),
      ]);
      setRoles(data || []);
    } catch (error) {
      setRoles([]);
      showError(
        "Error",
        "Error al cargar roles. Por favor, verifique la conexión.",
      );
    } finally {
      setLoading(false);
    }
  };

  const [mostrarFormularioRol, setMostrarFormularioRol] = useState(false);
  const [editandoRol, setEditandoRol] = useState(null);
  const [showAsignarPermisosForm, setShowAsignarPermisosForm] = useState(false);
  const [permisoServerError, setPermisoServerError] = useState(null);
  const [rolServerError, setRolServerError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterModulo, setFilterModulo] = useState("");
  const [filterAccion, setFilterAccion] = useState("");
  const [filterCuentaHabilitada, setFilterCuentaHabilitada] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageAsignaciones, setCurrentPageAsignaciones] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedPermiso, setSelectedPermiso] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [itemsPerPageAsignaciones, setItemsPerPageAsignaciones] = useState(10);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterModulo = (e) => {
    setFilterModulo(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterAccion = (e) => {
    setFilterAccion(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterCuentaHabilitada = (e) => {
    setFilterCuentaHabilitada(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterModulo("");
    setFilterAccion("");
    setFilterEstado("");
    setFilterCuentaHabilitada("");
    setCurrentPage(1);
    setCurrentPageAsignaciones(1);
  };

  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
  };

  const handleNuevoRol = () => {
    setEditandoRol(null);
    setRolServerError(null);
    setMostrarFormularioRol(true);
  };

  const handleEditarRol = (rol) => {
    setEditandoRol(rol);
    setMostrarFormularioRol(true);
  };

  const handleGuardarRol = async (dataFromForm) => {
    try {
      const rolData = {
        nombreRol: dataFromForm.nombreRol,
        descripcionRol: dataFromForm.descripcionRol || dataFromForm.descripcion,
        habilitaCuentaUsuario: dataFromForm.habilitaCuentaUsuario || "No",
        estado: dataFromForm.estado || "Activo",
      };

      const isEditing = editandoRol && editandoRol.idRol;

      if (isEditing) {
        await rolService.update(editandoRol.idRol, {
          ...rolData,
          idRol: editandoRol.idRol,
        });
      } else {
        await rolService.create(rolData);
      }

      await loadRoles();
      setMostrarFormularioRol(false);
      setEditandoRol(null);
      showSuccess(
        isEditing
          ? `Rol "${rolData.nombreRol}" actualizado`
          : `Rol "${rolData.nombreRol}" creado`,
      );
      setRolServerError(null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error al guardar el rol";
      if (
        error.response?.status === 409 ||
        errorMessage.toLowerCase().includes("ya existe")
      ) {
        setRolServerError(errorMessage);
      } else {
        showError("Error", errorMessage);
      }
    }
  };

  const handleEliminarRol = async (rol) => {
    if (!rol || !rol.idRol) {
      showError("Error", `Rol inválido no puede ser eliminado.`);
      return;
    }

    const confirmed = await showConfirm(
      "Eliminar Rol",
      `¿Está seguro de eliminar el rol "${rol.nombreRol || ""}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        const numericId = Number(rol.idRol);
        await rolService.delete(numericId);
        await loadRoles();
        showSuccess(`Rol "${rol.nombreRol || ""}" eliminado correctamente`);
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Error al eliminar el rol";
        showError("Error", msg);
      }
    }
  };

  const loadAsignacionesIndividuales = async () => {
    try {
      setLoading(true);
      const response = await API.get("/rol-permisos");
      setAsignacionesIndividuales(response.data || []);
      setCurrentPageAsignaciones(1);
    } catch (error) {
      showError("Error", `Error al cargar asignaciones: ${error.message}`);
      setAsignacionesIndividuales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarRolPermiso = (asignacion) => {
    setRolSeleccionadoParaEditar(asignacion.id_rol);
    setShowAsignarPermisosForm(true);
  };

  const handleEliminarAsignacionIndividual = async (
    idRol,
    idPermiso,
    nombrePermiso,
    nombreRol,
  ) => {
    if (!idRol || !idPermiso) {
      showError("Error", "Error: Datos de asignación inválidos");
      return;
    }

    const confirmed = await showConfirm(
      "Eliminar Permiso",
      `¿Está seguro de eliminar <b>"${nombrePermiso}"</b> de <b>"${nombreRol}"</b>?`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        await rolPermisoService.removerPermiso(idRol, idPermiso);
        showSuccess("Permiso removido correctamente");
        await loadAsignacionesIndividuales();
      } catch (error) {
        const msg =
          error.response?.data?.message || "Error al eliminar la asignación";
        showError("Error", msg);
      }
    }
  };

  // Renderizar vista de permisos
  const renderVistaPermisos = () => {
    const modulosUnicos = [...new Set(permisos.map((p) => p.modulo))].sort();
    const accionesUnicas = [...new Set(permisos.map((p) => p.accion))].sort();

    const sortedPermisos = [...permisos].sort((a, b) => {
      const aId = a.idPermiso || a.id_permiso || "";
      const bId = b.idPermiso || b.id_permiso || "";
      return Number(aId) - Number(bId);
    });

    const filteredPermisos = sortedPermisos.filter((permiso) => {
      const matchSearch =
        (permiso.nombrePermiso || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (permiso.descripcionPermiso || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchModulo =
        filterModulo === "" || permiso.modulo === filterModulo;
      const matchAccion =
        filterAccion === "" || permiso.accion === filterAccion;
      const matchEstado =
        filterEstado === "" || permiso.estado === filterEstado;
      return matchSearch && matchModulo && matchAccion && matchEstado;
    });

    const totalPages = Math.ceil(filteredPermisos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPermisos = filteredPermisos.slice(startIndex, endIndex);

    const openModal = (mode, permiso = null) => {
      setModalMode(mode);
      setSelectedPermiso(permiso);
      setPermisoServerError(null);
      setShowModal(true);
    };

    const closeModal = () => {
      setShowModal(false);
      setSelectedPermiso(null);
      setModalMode("create");
    };

    const handleSavePermiso = async (permisoData) => {
      try {
        const isEditing = modalMode === "edit";
        if (isEditing) {
          const permisoId =
            selectedPermiso.idPermiso || selectedPermiso.id_permiso;
          await permisoService.update(permisoId, permisoData);
        } else {
          await permisoService.create(permisoData);
        }
        await loadPermisos();
        closeModal();
        showSuccess(isEditing ? "Actualización Exitosa" : "Permiso Creado");
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || "Error al guardar";
        if (
          error.response?.status === 409 ||
          errorMessage.toLowerCase().includes("ya existe")
        ) {
          setPermisoServerError(errorMessage);
        } else {
          showError("Error", errorMessage);
        }
      }
    };

    const handleDelete = async (permiso) => {
      try {
        const permisoId = permiso.idPermiso || permiso.id_permiso;
        const nombrePermiso = permiso.nombrePermiso || "Sin nombre";

        const confirmed = await showConfirm(
          "Eliminar Permiso",
          `¿Está seguro de que desea eliminar el permiso "${nombrePermiso}"?`,
          "Sí, eliminar",
          "Cancelar",
        );

        if (confirmed) {
          await permisoService.delete(permisoId);
          await loadPermisos();
          showSuccess(`Permiso "${nombrePermiso}" eliminado correctamente`);
        }
      } catch (error) {
        showError(
          "Error",
          error?.response?.data?.message || "Error al eliminar",
        );
      }
    };

    if (loading) {
      return (
        <div className={ContenidoStyle.loadingContainer}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando Gestión de Roles y Permisos...</p>
        </div>
      );
    }

    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.tabContent}>
          <div className={ContenidoStyle.pageHeader}>
            <div className={ContenidoStyle.headerLeft}>
              <h2 className={ContenidoStyle.pageTitle}>Gestionar Permisos</h2>
            </div>
            <div className={ContenidoStyle.headerActions}>
              <button
                className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
                onClick={() => openModal("create")}
              >
                <i className="fas fa-plus"></i> Nuevo Permiso
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
                  placeholder="Buscar por descripción o módulo..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className={ContenidoStyle.filterActions}>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filterModulo}
                  onChange={handleFilterModulo}
                >
                  <option value="">Todos los módulos</option>
                  {modulosUnicos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filterAccion}
                  onChange={handleFilterAccion}
                >
                  <option value="">Todas las acciones</option>
                  {accionesUnicas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filterEstado}
                  onChange={handleFilterEstado}
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                {(searchQuery ||
                  filterModulo ||
                  filterAccion ||
                  filterEstado) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearFilters}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={TablaStyle.paginationInfoBar}>
            <div className={TablaStyle.paginationInfo}>
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredPermisos.length)} de{" "}
              {filteredPermisos.length} permisos
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

          {/* Tabla */}
          <div className={TablaStyle.tableContainer}>
            {currentPermisos.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron permisos</h5>
              </div>
            ) : (
              <div className={TablaStyle.tableResponsive}>
                <table
                  className={`${TablaStyle.tableData} table table-striped m-0`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
                    <tr>
                      <th>#</th>
                      <th>Nombre del Permiso</th>
                      <th>Descripción</th>
                      <th>Módulo</th>
                      <th>Acción</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPermisos.map((permiso) => (
                      <tr key={permiso.idPermiso || permiso.id_permiso}>
                        <td>
                          <strong>
                            {permiso.idPermiso || permiso.id_permiso}
                          </strong>
                        </td>
                        <td>
                          <strong>{permiso.nombrePermiso}</strong>
                        </td>
                        <td>
                          <div className={TablaStyle.titleDescripcion}>
                            {permiso.descripcionPermiso}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${ContenidoStyle.badge}  bg-secondary text-white`}
                          >
                            {permiso.modulo}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${ContenidoStyle.badge}  bg-info text-dark`}
                          >
                            {permiso.accion}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${TablaStyle.statusBadge} ${permiso.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                          >
                            {permiso.estado}
                          </span>
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                              onClick={() => openModal("view", permiso)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                              onClick={() => openModal("edit", permiso)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                              onClick={() => handleDelete(permiso)}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`${TablaStyle.paginationButton} ${currentPage === page ? TablaStyle.active : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ),
              )}
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

        {/* Portal del Modal de Permisos inyectado de forma correcta */}
        {showModal &&
          createPortal(
            <div className={`modal fade show d-block ${FormularioStyle.modal}`}>
              <div className={FormularioStyle.modalDialog}>
                <div className={FormularioStyle.modalContent}>
                  <div className={FormularioStyle.modalHeader}>
                    <h5 className={FormularioStyle.modalTitle}>
                      <i
                        className={`fas ${modalMode === "create" ? "fa-plus" : modalMode === "edit" ? "fa-edit" : "fa-eye"} me-2`}
                      ></i>
                      {modalMode === "create"
                        ? "Crear Permiso"
                        : modalMode === "edit"
                          ? "Editar Permiso"
                          : "Ver Permiso"}
                    </h5>
                    <button
                      className={FormularioStyle.modalClose}
                      onClick={closeModal}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className={FormularioStyle.modalBody}>
                    <PermisoForm
                      permiso={selectedPermiso}
                      onSave={handleSavePermiso}
                      onCancel={closeModal}
                      mode={modalMode}
                      serverError={permisoServerError}
                      onServerErrorClear={() => setPermisoServerError(null)}
                      permisosExistentes={permisos}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  };

  // Renderizar vista de roles
  const renderVistaRoles = () => {
    const filteredRoles = roles.filter((rol) => {
      const matchSearch = (rol.nombreRol || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCuenta =
        filterCuentaHabilitada === "" ||
        (rol.habilitaCuentaUsuario || "No") === filterCuentaHabilitada;
      const matchEstado =
        filterEstado === "" || (rol.estado || "") === filterEstado;
      return matchSearch && matchCuenta && matchEstado;
    });

    const totalPagesRoles = Math.ceil(filteredRoles.length / itemsPerPage) || 1;
    const startIndexRoles = (currentPage - 1) * itemsPerPage;
    const endIndexRoles = startIndexRoles + itemsPerPage;
    const currentRoles = filteredRoles.slice(startIndexRoles, endIndexRoles);

    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.tabContent}>
          <div className={ContenidoStyle.pageHeader}>
            <div className={ContenidoStyle.headerLeft}>
              <h2 className={ContenidoStyle.pageTitle}>Gestionar Roles</h2>
            </div>
            <div className={ContenidoStyle.headerActions}>
              <button
                className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
                onClick={handleNuevoRol}
              >
                <i className="fas fa-plus"></i> Nuevo Rol
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-3">
            <div className={ContenidoStyle.searchFilters}>
              <div className={ContenidoStyle.searchBar}>
                <input
                  type="text"
                  className={ContenidoStyle.searchInput}
                  placeholder="Buscar por Nombre de Roles..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className={ContenidoStyle.filterActions}>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filterCuentaHabilitada}
                  onChange={handleFilterCuentaHabilitada}
                >
                  <option value="">Cuenta Habilitada</option>
                  <option value="Si">Si</option>
                  <option value="No">No</option>
                </select>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filterEstado}
                  onChange={handleFilterEstado}
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                {(searchQuery || filterCuentaHabilitada || filterEstado) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearFilters}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={TablaStyle.paginationInfoBar}>
            <div className={TablaStyle.paginationInfo}>
              Mostrando {startIndexRoles + 1} a{" "}
              {Math.min(endIndexRoles, filteredRoles.length)} de{" "}
              {filteredRoles.length} roles
            </div>
          </div>

          <div className={TablaStyle.tableContainer}>
            {currentRoles.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron roles</h5>
              </div>
            ) : (
              <table
                className={`${TablaStyle.tableData} table table-striped m-0`}
              >
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th>#</th>
                    <th>Nombre del Rol</th>
                    <th>Descripción</th>
                    <th>Habilitación de Cuenta</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoles.map((rol) => (
                    <tr key={rol.idRol}>
                      <td>
                        <strong>{rol.idRol}</strong>
                      </td>
                      <td>
                        <strong>{rol.nombreRol}</strong>
                      </td>
                      <td>
                        <div className={TablaStyle.titleDescripcion}>
                          {rol.descripcionRol || rol.descripcion}
                        </div>
                      </td>
                      <td>{rol.habilitaCuentaUsuario || "No"}</td>
                      <td>
                        <span
                          className={`${TablaStyle.statusBadge} ${rol.estado?.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                        >
                          {rol.estado}
                        </span>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleEditarRol(rol)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() => handleEliminarRol(rol)}
                          >
                            <i className="fas fa-trash"></i>
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
          {totalPagesRoles > 1 && (
            <div className={TablaStyle.pagination}>
              <button
                className={TablaStyle.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPagesRoles }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`${TablaStyle.paginationButton} ${currentPage === page ? TablaStyle.active : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                className={TablaStyle.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPagesRoles}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar vista de asignaciones
  const renderVistaAsignaciones = () => {
    const filteredAsignaciones = asignacionesIndividuales.filter(
      (asignacion) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          (asignacion.nombrePermiso || "")
            .toLowerCase()
            .includes(searchLower) ||
          (asignacion.nombreRol || "").toLowerCase().includes(searchLower) ||
          (asignacion.modulo || "").toLowerCase().includes(searchLower)
        );
      },
    );

    const totalPages = Math.ceil(
      filteredAsignaciones.length / itemsPerPageAsignaciones,
    );
    const startIndex = (currentPageAsignaciones - 1) * itemsPerPageAsignaciones;
    const endIndex = startIndex + itemsPerPageAsignaciones;
    const currentAsignaciones = filteredAsignaciones.slice(
      startIndex,
      endIndex,
    );

    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.tabContent}>
          <div className={ContenidoStyle.pageHeader}>
            <div className={ContenidoStyle.headerLeft}>
              <h2 className={ContenidoStyle.pageTitle}>
                Asignación de Permisos a Roles
              </h2>
            </div>
            <div className={ContenidoStyle.headerActions}>
              <button
                className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
                onClick={() => {
                  setRolSeleccionadoParaEditar(null);
                  setShowAsignarPermisosForm(true);
                }}
              >
                <i className="fas fa-plus"></i> Asignar Permisos
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-3">
            <div className={ContenidoStyle.searchFilters}>
              <div className={ContenidoStyle.searchBar}>
                <input
                  type="text"
                  className={ContenidoStyle.searchInput}
                  placeholder="Buscar asignaciones..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>

          <div className={TablaStyle.paginationInfoBar}>
            <div className={TablaStyle.paginationInfo}>
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredAsignaciones.length)} de{" "}
              {filteredAsignaciones.length} asignaciones
            </div>
          </div>

          <div className={TablaStyle.tableContainer}>
            {filteredAsignaciones.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron asignaciones</h5>
              </div>
            ) : (
              <div className={TablaStyle.tableResponsive}>
                <table
                  className={`${TablaStyle.tableData} table table-striped m-0`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
                    <tr>
                      <th>#</th>
                      <th>Nombre del Rol</th>
                      <th>Nombre del Permiso</th>
                      <th>Módulo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAsignaciones.map((asignacion, index) => (
                      <tr
                        key={`${asignacion.id_rol}-${asignacion.id_permiso}-${index}`}
                      >
                        <td>
                          <strong>{startIndex + index + 1}</strong>
                        </td>
                        <td>
                          <strong>{asignacion.nombreRol}</strong>
                        </td>
                        <td>{asignacion.nombrePermiso}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {asignacion.modulo}
                          </span>
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                              onClick={() => handleEditarRolPermiso(asignacion)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                              onClick={() =>
                                handleEliminarAsignacionIndividual(
                                  asignacion.id_rol,
                                  asignacion.id_permiso,
                                  asignacion.nombrePermiso,
                                  asignacion.nombreRol,
                                )
                              }
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
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className={TablaStyle.pagination}>
              <button
                className={TablaStyle.paginationButton}
                onClick={() =>
                  setCurrentPageAsignaciones(currentPageAsignaciones - 1)
                }
                disabled={currentPageAsignaciones === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`${TablaStyle.paginationButton} ${currentPageAsignaciones === page ? TablaStyle.active : ""}`}
                    onClick={() => setCurrentPageAsignaciones(page)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                className={TablaStyle.paginationButton}
                onClick={() =>
                  setCurrentPageAsignaciones(currentPageAsignaciones + 1)
                }
                disabled={currentPageAsignaciones === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>

        {/* Portal del Modal de Asignación inyectado de forma correcta */}
        {showAsignarPermisosForm &&
          createPortal(
            <div className={`modal fade show d-block ${FormularioStyle.modal}`}>
              <div className={FormularioStyle.modalDialog}>
                <div className={FormularioStyle.modalContent}>
                  <div className={FormularioStyle.modalHeader}>
                    <h5 className={FormularioStyle.modalTitle}>
                      <i className="fas fa-user-shield me-2"></i> Asignar
                      Permisos a Rol
                    </h5>
                    <button
                      className={FormularioStyle.modalClose}
                      onClick={() => {
                        setShowAsignarPermisosForm(false);
                        setRolSeleccionadoParaEditar(null);
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className={FormularioStyle.modalBody}>
                    <AsignarPermisosForm
                      rolSeleccionado={rolSeleccionadoParaEditar}
                      onClose={async () => {
                        setShowAsignarPermisosForm(false);
                        setRolSeleccionadoParaEditar(null);
                        await loadAsignacionesIndividuales();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  };

  if (
    error &&
    loading === false &&
    roles.length === 0 &&
    permisos.length === 0
  ) {
    return (
      <div className={TablaStyle.errorContainer}>
        <i className="fas fa-exclamation-triangle fa-2x text-danger"></i>
        <h3>Error al cargar los datos</h3>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-redo me-2"></i>Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-shield-alt"></i> Gestión de Seguridad
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administrar roles, permisos y sus asignaciones
          </p>
        </div>
      </div>

      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader} role="group">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${ContenidoStyle.tabsButton} ${vistaActiva === tab.id ? ContenidoStyle.active : ""}`}
              onClick={() => {
                setVistaActiva(tab.id);
                clearFilters();
              }}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gestion-roles-container">
        {vistaActiva === "roles" && renderVistaRoles()}
        {vistaActiva === "permisos" && renderVistaPermisos()}
        {vistaActiva === "asignaciones" && renderVistaAsignaciones()}
      </div>

      {/* Portal del Modal de Formulario de Rol */}
      {mostrarFormularioRol &&
        createPortal(
          <div className={`modal show d-block ${FormularioStyle.modal}`}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-user-shield me-2"></i>
                    {editandoRol ? "Editar Rol" : "Nuevo Rol"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={() => {
                      setMostrarFormularioRol(false);
                      setEditandoRol(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <RolForm
                    rol={editandoRol}
                    mode={editandoRol ? "edit" : "create"}
                    onSave={handleGuardarRol}
                    onCancel={() => {
                      setMostrarFormularioRol(false);
                      setEditandoRol(null);
                    }}
                    serverError={rolServerError}
                    onServerErrorClear={() => setRolServerError(null)}
                    rolesExistentes={roles}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* UNIFICADO: Único modal-backdrop global para toda la pantalla */}
      {(mostrarFormularioRol || showAsignarPermisosForm || showModal) &&
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

const GestionRolesPermisosWithErrorBoundary = () => (
  <ErrorBoundary>
    <GestionRolesPermisos />
  </ErrorBoundary>
);

export default GestionRolesPermisosWithErrorBoundary;
