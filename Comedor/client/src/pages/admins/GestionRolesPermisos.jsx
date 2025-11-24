import { useState, useEffect } from "react";
import { permisoService } from "../../services/permisoService";
import { rolService } from "../../services/rolService";
import { rolPermisoService } from "../../services/rolPermisoService";
import API from "../../services/api.js";
import PermisoForm from "../../components/admin/PermisoForm";
import AsignarPermisosForm from "../../components/admin/AsignarPermisosForm";
import RolForm from "../../components/admin/RolForm";
import ErrorBoundary from "../../components/ErrorBoundary";

const GestionRolesPermisos = () => {
  // Verificación de funcionamiento básico
  console.log("GestionRolesPermisos componente se está renderizando...");

  const [vistaActiva, setVistaActiva] = useState("permisos"); // 'roles', 'permisos', 'permisos-avanzado', 'asignaciones'
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]); // Vacío por ahora
  const [loading, setLoading] = useState(false);
  const [rolesConPermisos] = useState([]);
  const [asignacionesIndividuales, setAsignacionesIndividuales] = useState([]);
  const [error, setError] = useState(null);
  const [rolSeleccionadoParaEditar, setRolSeleccionadoParaEditar] =
    useState(null);

  // Cargar datos básicos al inicializar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      console.log("Iniciando carga de datos iniciales...");
      setLoading(true);

      try {
        // Cargar roles y permisos básicos
        const resultados = await Promise.allSettled([
          loadPermisos(),
          loadRoles(),
          loadAsignacionesIndividuales(),
        ]);

        // Verificar si hubo errores
        const errores = resultados
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason);

        if (errores.length > 0) {
          console.warn("Algunos datos no se pudieron cargar:", errores);
          setError(
            `Error al cargar algunos datos: ${errores
              .map((e) => e.message)
              .join(", ")}`
          );
        } else {
          console.log("Carga inicial completada exitosamente");
          setError(null);
        }
      } catch (error) {
        console.error("Error en carga inicial:", error);
        setError(`Error crítico: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Cargar asignaciones cuando se cambie a la vista de asignaciones
  useEffect(() => {
    if (vistaActiva === "asignaciones") {
      loadAsignacionesIndividuales();
    }
  }, [vistaActiva]);

  const loadPermisos = async () => {
    try {
      console.log("Cargando permisos...");
      setLoading(true);

      const data = await Promise.race([
        permisoService.getAll(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout al cargar permisos")),
            10000
          )
        ),
      ]);

      setPermisos(data || []);
      console.log("Permisos cargados:", data?.length || 0);
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      setPermisos([]);
      alert(
        "Error al cargar permisos. Por favor, verifique la conexión con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      console.log("Cargando roles...");
      setLoading(true);

      const data = await Promise.race([
        rolService.getAll(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout al cargar roles")), 10000)
        ),
      ]);

      setRoles(data || []);
      console.log("Roles cargados:", data?.length || 0);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setRoles([]);
      alert(
        "Error al cargar roles. Por favor, verifique la conexión con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  // Estados para formularios
  const [mostrarFormularioRol, setMostrarFormularioRol] = useState(false);
  const [editandoRol, setEditandoRol] = useState(null);
  const [showAsignarPermisosForm, setShowAsignarPermisosForm] = useState(false);

  console.log("GestionRolesPermisos - Estado actual:", {
    vistaActiva,
    rolesCount: roles.length,
    permisosCount: permisos.length,
    rolesConPermisosCount: rolesConPermisos.length,
    loading,
    error,
    showAsignarPermisosForm,
    rolSeleccionadoParaEditar,
  });

  // Estados para formulario de rol
  const [formRol, setFormRol] = useState({
    nombreRol: "",
    descripcion: "",
    habilitaCuentaUsuario: "No",
    estado: "Activo",
  });

  // Estados para la lista completa de permisos
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModulo, setFilterModulo] = useState("");
  const [filterAccion, setFilterAccion] = useState("");
  const [filterCuentaHabilitada, setFilterCuentaHabilitada] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedPermiso, setSelectedPermiso] = useState(null);

  const itemsPerPage = 10;

  // Handlers globales para búsqueda y filtros (usados por Permisos y Roles)
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
  };

  // Mover handler de paginación al nivel del componente (usado por Permisos y Roles)
  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
  };

  // Simular carga de datos
  useEffect(() => {
    // Aquí cargarías los datos reales de la API
  }, []);

  // Funciones para gestión de roles
  const handleNuevoRol = () => {
    setFormRol({
      nombreRol: "",
      descripcion: "",
      habilitaCuentaUsuario: "No",
      estado: "Activo",
    });
    setEditandoRol(null);
    setMostrarFormularioRol(true);
  };

  const handleEditarRol = (rol) => {
    setFormRol({
      nombreRol: rol.nombreRol,
      descripcion: rol.descripcionRol || rol.descripcion, // Manejar ambos nombres de campo
      habilitaCuentaUsuario: rol.habilitaCuentaUsuario || "No",
      estado: rol.estado || "Activo",
    });
    setEditandoRol(rol);
    setMostrarFormularioRol(true);
  };

  // Ahora recibe los datos desde el componente RolForm
  const handleGuardarRol = async (dataFromForm) => {
    try {
      const rolData = {
        nombreRol: dataFromForm.nombreRol,
        descripcionRol: dataFromForm.descripcionRol || dataFromForm.descripcion,
        habilitaCuentaUsuario: dataFromForm.habilitaCuentaUsuario || "No",
        estado: dataFromForm.estado || "Activo",
      };

      if (editandoRol && editandoRol.idRol) {
        // Actualizar rol existente
        await rolService.update(editandoRol.idRol, {
          ...rolData,
          idRol: editandoRol.idRol,
        });
      } else {
        // Crear nuevo rol
        await rolService.create(rolData);
      }

      // Recargar la lista de roles
      await loadRoles();
      setMostrarFormularioRol(false);
      setEditandoRol(null);
    } catch (error) {
      console.error("Error al guardar rol:", error);
      alert("Error al guardar el rol");
    }
  };

  const handleEliminarRol = async (idRol) => {
    if (!idRol) {
      alert("ID de rol inválido");
      return;
    }

    if (!window.confirm("¿Está seguro de eliminar este rol?")) return;

    try {
      const numericId = Number(idRol);
      if (Number.isNaN(numericId)) {
        throw new Error("ID de rol no es numérico");
      }
      await rolService.delete(numericId);
      // Recargar lista de roles
      await loadRoles();
      // También eliminar asignaciones relacionadas en memoria
      setAsignaciones((prev) => prev.filter((a) => a.idRol !== numericId));
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      const msg =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : error.message || "Error al eliminar el rol";
      alert(msg);
    }
  };

  // Funciones para gestión de asignaciones - Ahora usando el componente AsignarPermisosForm

  // Cargar todas las asignaciones individuales rol-permiso
  const loadAsignacionesIndividuales = async () => {
    try {
      console.log("Cargando asignaciones individuales...");
      setLoading(true);

      // Usar el endpoint que devuelve todas las relaciones rol-permiso
      const response = await API.get("/rol-permisos");
      const asignaciones = response.data;
      console.log("Asignaciones cargadas:", asignaciones.length);
      setAsignacionesIndividuales(asignaciones);
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      setError(`Error al cargar asignaciones: ${error.message}`);
      setAsignacionesIndividuales([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar roles con sus permisos asignados
  /*
    // Cargar roles con sus permisos asignados - Función deshabilitada temporalmente
    const loadRolesConPermisos = async () => {
        try {
            console.log('Iniciando carga de roles con permisos...');
            setLoading(true);
 
            const rolesData = await rolService.getAll();
            console.log('Roles cargados:', rolesData.length);
 
            // Para cada rol, obtener sus permisos asignados con timeout
            const rolesConPermisosData = await Promise.allSettled(
                rolesData.map(async (rol) => {
                    try {
                        const permisosDelRol = await Promise.race([
                            rolPermisoService.getPermisosByRol(rol.idRol),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 5000)
                            )
                        ]);
                        console.log(`Permisos cargados para rol ${rol.nombreRol}:`, permisosDelRol.length);
                        return {
                            ...rol,
                            permisos: permisosDelRol
                        };
                    } catch (error) {
                        console.warn(`Error al cargar permisos del rol ${rol.nombreRol}:`, error.message);
                        return {
                            ...rol,
                            permisos: []
                        };
                    }
                })
            );
 
            const resultados = rolesConPermisosData.map(result =>
                result.status === 'fulfilled' ? result.value : result.reason
            );
 
            setRolesConPermisos(resultados);
            console.log('Carga de roles con permisos completada');
        } catch (error) {
            console.error('Error al cargar roles con permisos:', error);
            // Fallback: cargar solo roles sin permisos
            try {
                const rolesData = await rolService.getAll();
                setRolesConPermisos(rolesData.map(rol => ({ ...rol, permisos: [] })));
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
                setRolesConPermisos([]);
            }
        } finally {
            setLoading(false);
        }
    };
    */ // Obtener permisos asignados a un rol (texto para mostrar)
  const _getPermisosAsignados = (idRol) => {
    const rol = rolesConPermisos.find((r) => r.idRol === idRol);
    if (!rol || !rol.permisos || rol.permisos.length === 0) {
      return "No hay permisos asignados";
    }
    return rol.permisos.map((p) => p.nombrePermiso || p.descripcion).join(", ");
  };

  // Funciones para gestión de asignaciones
  const handleEditarRolPermiso = (asignacion) => {
    console.log("Editando asignación:", asignacion);
    // Establecer el rol para editar
    setRolSeleccionadoParaEditar(asignacion.id_rol);
    // Mostrar el formulario de asignación
    setShowAsignarPermisosForm(true);
  };

  // Nueva función para eliminar una asignación individual
  const handleEliminarAsignacionIndividual = async (idRol, idPermiso) => {
    console.log("handleEliminarAsignacionIndividual llamado con:", {
      idRol,
      idPermiso,
    });

    if (!idRol || !idPermiso) {
      console.error("Error: idRol o idPermiso son undefined:", {
        idRol,
        idPermiso,
      });
      alert("Error: Datos de asignación inválidos");
      return;
    }

    if (
      window.confirm("¿Está seguro de eliminar esta asignación específica?")
    ) {
      try {
        await rolPermisoService.removerPermiso(idRol, idPermiso);
        await loadAsignacionesIndividuales(); // Recargar datos
      } catch (error) {
        console.error("Error al eliminar asignación:", error);
        alert("Error al eliminar la asignación");
      }
    }
  };

  // Renderizar vista de permisos
  const renderVistaPermisos = () => {
    // Obtener módulos únicos para el filtro
    const modulosUnicos = [...new Set(permisos.map((p) => p.modulo))].sort();
    const accionesUnicas = [...new Set(permisos.map((p) => p.accion))].sort();

    // Ordenar permisos por id antes de filtrar (numérico si es posible, fallback a string)
    const sortedPermisos = [...permisos].sort((a, b) => {
      const aId = a.idPermiso || a.id_permiso || "";
      const bId = b.idPermiso || b.id_permiso || "";
      const an = Number(aId);
      const bn = Number(bId);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(aId).localeCompare(String(bId));
    });

    // Filtrar permisos
    const filteredPermisos = sortedPermisos.filter((permiso) => {
      const matchSearch =
        (permiso.nombrePermiso || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (permiso.descripcionPermiso || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (permiso.modulo || "")
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

    // Paginación
    const totalPages = Math.ceil(filteredPermisos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPermisos = filteredPermisos.slice(startIndex, endIndex);

    // NOTE: handlers moved to component scope to be shared across views

    // Funciones de selección eliminadas - no se usan en esta vista

    const openModal = (mode, permiso = null) => {
      setModalMode(mode);
      setSelectedPermiso(permiso);
      setShowModal(true);
    };

    const closeModal = () => {
      setShowModal(false);
      setSelectedPermiso(null);
      setModalMode("create");
    };

    const handleSavePermiso = async (permisoData) => {
      try {
        if (modalMode === "create") {
          await permisoService.create(permisoData);
        } else if (modalMode === "edit") {
          const permisoId =
            selectedPermiso.idPermiso || selectedPermiso.id_permiso;
          await permisoService.update(permisoId, permisoData);
        }
        await loadPermisos();
        closeModal();
      } catch (error) {
        console.error("Error al guardar permiso:", error);
        // Aquí podrías mostrar un toast de error
      }
    };

    const handleDelete = async (permisoId) => {
      try {
        // Verificar si el permiso está siendo usado
        const asignacionesResp = await API.get("/rol-permisos");
        const asignaciones = asignacionesResp.data;
        const usosPermiso = asignaciones.filter(
          (a) => a.id_permiso === permisoId
        ).length;

        let confirmMessage = "¿Está seguro de que desea eliminar este permiso?";
        if (usosPermiso > 0) {
          confirmMessage = `Este permiso está asignado a ${usosPermiso} rol(es). Para eliminarlo, primero debe quitar las asignaciones. ¿Desea continuar con la eliminación?`;
        }

        if (window.confirm(confirmMessage)) {
          await permisoService.delete(permisoId);
          await loadPermisos();
          alert("Permiso eliminado correctamente");
        }
      } catch (error) {
        console.error("Error al eliminar permiso:", error);

        // Mostrar mensaje enviado por el servidor si existe
        const serverMsg = error?.response?.data?.message || error?.message;
        if (serverMsg) {
          alert(serverMsg);
        } else {
          alert("Error al eliminar el permiso. Por favor, inténtelo de nuevo.");
        }
      }
    };
    const handleBulkDelete = async () => {
      if (
        window.confirm(
          `¿Está seguro de que desea eliminar ${selectedPermisos.length} permiso(s)?`
        )
      ) {
        try {
          const results = await Promise.allSettled(
            selectedPermisos.map((id) => permisoService.delete(id))
          );

          const rejected = results
            .map((r, i) => ({ r, id: selectedPermisos[i] }))
            .filter((x) => x.r.status === "rejected");

          if (rejected.length > 0) {
            const messages = rejected
              .map((x) => {
                const err = x.r.reason;
                const msg =
                  err?.response?.data?.message || err?.message || "Error";
                return `ID ${x.id}: ${msg}`;
              })
              .join("\n");
            alert(`Algunos permisos no se pudieron eliminar:\n${messages}`);
          }

          await loadPermisos();
          setSelectedPermisos([]);
        } catch (error) {
          console.error("Error al eliminar permisos:", error);
          const msg =
            error?.response?.data?.message || error?.message || "Error";
          alert(`Error al eliminar permisos: ${msg}`);
        }
      }
    };

    // Función de toggle estado eliminada - no se usa en esta vista

    // NOTE: handler moved to component scope: see `handlePageChange` above

    return (
      <div>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title-sub">Lista de Permisos</h1>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary-new"
              onClick={() => openModal("create")}
            >
              <i className="fas fa-plus me-2"></i>
              Nuevo Permiso
            </button>
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="search-filters">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por descripción o módulo..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-actions">
            <select
              className="filter-select"
              value={filterModulo}
              onChange={handleFilterModulo}
            >
              <option value="">Todos los módulos</option>
              {modulosUnicos.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterAccion}
              onChange={handleFilterAccion}
            >
              <option value="">Todas las acciones</option>
              {accionesUnicas.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
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
              filterEstado ||
              filterCuentaHabilitada) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
                title="Limpiar filtros"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Acciones en lote */}
        {selectedPermisos.length > 0 && (
          <div className="bulk-actions">
            <div className="selected-info">
              <span>{selectedPermisos.length} permiso(s) seleccionado(s)</span>
            </div>
            <div className="bulk-buttons">
              <button
                className="btn btn-danger btn-sm"
                onClick={handleBulkDelete}
              >
                <i className="fas fa-trash me-1"></i>
                Eliminar Seleccionados
              </button>
            </div>
          </div>
        )}

        {/* Tabla de permisos */}
        <div className="table-container">
          {currentPermisos.length === 0 ? (
            <div className="no-data">
              <p>No se encontraron permisos</p>
            </div>
          ) : (
            <table className="table table-striped data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre del Permiso</th>
                  <th>Descripción</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Estado</th>
                  <th>Fecha de Alta</th>
                  <th>Fecha de Modificación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPermisos.map((permiso) => (
                  <tr key={permiso.idPermiso || permiso.id_permiso}>
                    <td>{permiso.idPermiso || permiso.id_permiso}</td>
                    <td>
                      <strong>{permiso.nombrePermiso}</strong>
                    </td>
                    <td>
                      <small className="text-muted">
                        {permiso.descripcionPermiso || "Sin descripción"}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (permiso.modulo || "").toLowerCase() === "sin módulo"
                            ? "bg-secondary"
                            : "bg-secondary"
                        }`}
                      >
                        {permiso.modulo || "Sin módulo"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (permiso.accion || "").toLowerCase() === "sin acción"
                            ? "bg-info"
                            : "bg-info"
                        }`}
                      >
                        {permiso.accion || "Sin acción"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          (permiso.estado || "").toLowerCase() === "activo"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {permiso.estado || "Sin estado"}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {permiso.fechaAlta
                          ? new Date(permiso.fechaAlta).toLocaleDateString()
                          : "N/A"}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {permiso.fechaModificacion
                          ? new Date(
                              permiso.fechaModificacion
                            ).toLocaleDateString()
                          : "---"}
                      </strong>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-action btn-view"
                          onClick={() => openModal("view", permiso)}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openModal("edit", permiso)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() =>
                            handleDelete(
                              permiso.idPermiso || permiso.id_permiso
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
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredPermisos.length)} de{" "}
              {filteredPermisos.length} permisos
            </div>
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`page-btn ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Modal para permiso*/}
        {showModal && (
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i
                      className={`fas ${
                        modalMode === "create"
                          ? "fa-plus"
                          : modalMode === "edit"
                          ? "fa-edit"
                          : "fa-eye"
                      } me-2`}
                    ></i>
                    {modalMode === "create"
                      ? "Crear Permiso"
                      : modalMode === "edit"
                      ? "Editar Permiso"
                      : "Ver Permiso"}
                  </h5>
                  <button className="modal-close" onClick={closeModal}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <PermisoForm
                    permiso={selectedPermiso}
                    onSave={handleSavePermiso}
                    onCancel={closeModal}
                    mode={modalMode}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de roles
  const renderVistaRoles = () => {
    // Ordenar roles por id antes de filtrar para mostrar tabla ordenada por id
    const sortedRoles = [...roles].sort((a, b) => {
      const ai = Number(a.idRol || 0);
      const bi = Number(b.idRol || 0);
      return ai - bi;
    });

    // Filtrar roles según búsqueda y filtros aplicados
    const filteredRoles = sortedRoles.filter((rol) => {
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

    // Paginación para roles
    const totalPagesRoles = Math.ceil(filteredRoles.length / itemsPerPage) || 1;
    const startIndexRoles = (currentPage - 1) * itemsPerPage;
    const endIndexRoles = startIndexRoles + itemsPerPage;
    const currentRoles = filteredRoles.slice(startIndexRoles, endIndexRoles);

    return (
      <div>
        <div className="page-header">
          <div className="header-left">
            <h2 className="page-title-sub">Lista de Roles</h2>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary-new" onClick={handleNuevoRol}>
              <i className="fas fa-plus"></i> Nuevo Rol
            </button>
          </div>
        </div>

        {/* Controles de busqueda y filtros */}
        <div className="search-filters">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por Nombre de Roles..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-actions">
            <select
              className="filter-select"
              value={filterCuentaHabilitada}
              onChange={handleFilterCuentaHabilitada}
            >
              <option value="">Cuenta Habilitada</option>
              <option value="Si">Si</option>
              <option value="No">No</option>
            </select>

            <select
              className="filter-select"
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
                title="Limpiar filtros"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Tabla de roles */}
        <div className="table-container">
          {currentRoles.length === 0 ? (
            <div className="no-data">
              <p>No se encontraron roles</p>
            </div>
          ) : (
            <table className="table table-striped data-table">
              <thead>
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
                    <td>{rol.idRol}</td>
                    <td>{rol.nombreRol}</td>
                    <td>{rol.descripcionRol || rol.descripcion}</td>
                    <td>{rol.habilitaCuentaUsuario || "No especificado"}</td>
                    <td>{rol.estado || "No especificado"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditarRol(rol)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleEliminarRol(rol.idRol)}
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
          )}
        </div>

        {/* Paginación roles */}
        {totalPagesRoles > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndexRoles + 1} a{" "}
              {Math.min(endIndexRoles, filteredRoles.length)} de{" "}
              {filteredRoles.length} roles
            </div>
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {Array.from({ length: totalPagesRoles }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`page-btn ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPagesRoles}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de asignaciones
  const renderVistaAsignaciones = () => (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h2 className="page-title-sub">Asignación de Permisos a Roles</h2>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary-new"
            onClick={() => {
              console.log("Abriendo formulario para nueva asignación");
              setRolSeleccionadoParaEditar(null);
              setShowAsignarPermisosForm(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Asignar Permisos
          </button>
        </div>
      </div>

      <div className="table-container">
        {asignacionesIndividuales.length === 0 ? (
          <div className="no-data">
            <p>No se encontraron asignaciones de roles y permisos</p>
          </div>
        ) : (
          <table className="table table-striped data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre del Rol</th>
                <th>Nombre del Permiso</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignacionesIndividuales.map((asignacion, index) => (
                <tr
                  key={`${asignacion.id_rol}-${asignacion.id_permiso}-${index}`}
                >
                  <td>
                    <strong>{index + 1}</strong>
                  </td>
                  <td>
                    <strong>{asignacion.nombreRol}</strong>
                  </td>
                  <td>{asignacion.nombrePermiso}</td>
                  <td>
                    <span className="badge bg-info">{asignacion.accion}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary">
                      {asignacion.modulo}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-action btn-edit me-2"
                        onClick={() => handleEditarRolPermiso(asignacion)}
                        title="Editar asignación"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() =>
                          handleEliminarAsignacionIndividual(
                            asignacion.id_rol,
                            asignacion.id_permiso
                          )
                        }
                        title="Eliminar asignación"
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

      {/* Modal para asignar permisos */}
      {showAsignarPermisosForm && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user-shield me-2"></i>
                  Asignar Permisos a Rol
                </h5>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowAsignarPermisosForm(false);
                    setRolSeleccionadoParaEditar(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div>
                <AsignarPermisosForm
                  rolSeleccionado={rolSeleccionadoParaEditar}
                  onClose={() => {
                    setShowAsignarPermisosForm(false);
                    setRolSeleccionadoParaEditar(null);
                    // Recargar datos después de asignar permisos
                    loadRoles();
                    loadPermisos();
                    loadAsignacionesIndividuales();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Manejo de errores críticos
  if (
    error &&
    loading === false &&
    roles.length === 0 &&
    permisos.length === 0
  ) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error al cargar los datos</h3>
        <p className="error-message">{error}</p>
        <div className="error-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
          >
            <i className="fas fa-redo me-2"></i>
            Reintentar
          </button>
        </div>
        <div className="debug-info">
          <small className="text-muted">
            Debug info: Backend should be running on 192.168.100.10:3000
            <br />
            Frontend running on: {window.location.origin}
          </small>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            padding: 2rem;
          }
          .error-icon {
            font-size: 4rem;
            color: #dc3545;
            margin-bottom: 1rem;
          }
          .error-message {
            color: #721c24;
            background: #f8d7da;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            max-width: 500px;
          }
          .debug-info {
            margin-top: 2rem;
            max-width: 400px;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando gestión de roles y permisos...</p>
        <div className="loading-details">
          <small className="text-muted">
            Conectando con el servidor backend...
            <br />
            Si la carga toma mucho tiempo, verifique que el servidor esté
            ejecutándose en el puerto 3000.
          </small>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            padding: 2rem;
          }
          .loading-details {
            margin-top: 1rem;
            max-width: 400px;
          }
          .spinner-border {
            width: 3rem;
            height: 3rem;
            margin-bottom: 1rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-shield-alt me-2"></i>
            Gestión de Seguridad
          </h1>
          <p>Administrar roles, permisos y sus asignaciones</p>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="navigation-buttons">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${
              vistaActiva === "permisos" ? "btn-lista" : "btn-outline-secondary"
            }`}
            onClick={() => setVistaActiva("permisos")}
          >
            <i className="fas fa-key me-2"></i>
            Gestión de Permisos
          </button>
          <button
            type="button"
            className={`btn ${
              vistaActiva === "roles" ? "btn-lista" : "btn-outline-secondary"
            }`}
            onClick={() => setVistaActiva("roles")}
          >
            <i className="fas fa-users me-2"></i>
            Gestión de Roles
          </button>
          <button
            type="button"
            className={`btn ${
              vistaActiva === "asignaciones"
                ? "btn-lista"
                : "btn-outline-secondary"
            }`}
            onClick={() => setVistaActiva("asignaciones")}
          >
            <i className="fas fa-link me-2"></i>
            Asignar Permisos
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="gestion-roles-container">
        {vistaActiva === "roles" && renderVistaRoles()}
        {vistaActiva === "permisos" && renderVistaPermisos()}
        {vistaActiva === "asignaciones" && renderVistaAsignaciones()}
      </div>

      {/* Modal para formulario de rol: usar componente RolForm */}
      {mostrarFormularioRol && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editandoRol ? "Editar Rol" : "Nuevo Rol"}
                </h5>
                <button
                  className="modal-close"
                  onClick={() => {
                    setMostrarFormularioRol(false);
                    setEditandoRol(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <RolForm
                  rol={editandoRol}
                  mode={editandoRol ? "edit" : "create"}
                  onSave={handleGuardarRol}
                  onCancel={() => {
                    setMostrarFormularioRol(false);
                    setEditandoRol(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Overlay para modales */}
      {(mostrarFormularioRol || showAsignarPermisosForm) && (
        <div className="modal-backdrop show"></div>
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
