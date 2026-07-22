import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PersonaForm from "../../components/admin/PersonaForm";
import PersonaEditForm from "../../components/admin/PersonaEditForm";
import personaService from "../../services/personaService.js";
import { rolService } from "../../services/rolService.js";
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

const Personas = () => {
  const [personas, setPersonas] = useState([]);
  const [filteredPersonas, setFilteredPersonas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    loadPersonas();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      //console.log("ListaPersonas: Cargando roles...");
      const rolesData = await rolService.getActivos();
      //console.log("ListaPersonas: Roles cargados:", rolesData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      // console.error("Error al cargar roles:", error);
      showError("Error", "Error al cargar roles: " + error.message);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadPersonas = async () => {
    try {
      setLoading(true);
      //console.log("ListaPersonas: Iniciando carga de personas...");
      const data = await personaService.getAll();
      //console.log("ListaPersonas: Datos recibidos:", data);

      // Asegurar que data es un array
      let personas = Array.isArray(data) ? data : [];
      // Ordenar por id numérico si existe (idPersona, id_persona o id)
      personas.sort((a, b) => {
        const ai = Number(a.idPersona ?? a.id_persona ?? a.id ?? 0);
        const bi = Number(b.idPersona ?? b.id_persona ?? b.id ?? 0);
        if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi;
        return String(a.idPersona ?? a.id_persona ?? a.id ?? "").localeCompare(
          String(b.idPersona ?? b.id_persona ?? b.id ?? ""),
        );
      });

      setPersonas(personas);
      setFilteredPersonas(personas);
      /* console.log(
        "ListaPersonas: Estado actualizado con",
        personas.length,
        "personas"
      );*/
    } catch (error) {
      // console.error("Error al cargar personas:", error);
      showError("Error", "Error al cargar personas: " + error.message);
      setPersonas([]);
      setFilteredPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda y filtros
  useEffect(() => {
    // Asegurar que personas es un array
    let filtered = Array.isArray(personas) ? personas : [];

    // Filtro por búsqueda de texto
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((persona) => {
        try {
          const nombreCompleto =
            `${persona.nombre || ""} ${persona.apellido || ""}`.toLowerCase();
          return (
            (persona.nombre &&
              persona.nombre.toLowerCase().includes(searchLower)) ||
            (persona.apellido &&
              persona.apellido.toLowerCase().includes(searchLower)) ||
            nombreCompleto.includes(searchLower) ||
            (persona.dni && persona.dni.toString().includes(searchQuery)) ||
            (persona.numeroDocumento &&
              persona.numeroDocumento.toString().includes(searchQuery)) ||
            (persona.nombreRol &&
              persona.nombreRol.toLowerCase().includes(searchLower)) ||
            (persona.genero &&
              persona.genero.toLowerCase().includes(searchLower))
          );
        } catch (error) {
          //console.error("Error al filtrar persona:", persona, error);
          showError("Error", "Error al filtrar personas: " + error.message);
          return false;
        }
      });
    }

    // Filtro por rol
    if (filterTipo && filterTipo !== "") {
      filtered = filtered.filter((persona) => persona.nombreRol === filterTipo);
    }

    // Filtro por estado
    if (filterEstado && filterEstado !== "") {
      filtered = filtered.filter((persona) => persona.estado === filterEstado);
    }

    // Ordenar resultados filtrados por id antes de guardarlos
    filtered.sort((a, b) => {
      const ai = Number(a.idPersona ?? a.id_persona ?? a.id ?? 0);
      const bi = Number(b.idPersona ?? b.id_persona ?? b.id ?? 0);
      if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi;
      return String(a.idPersona ?? a.id_persona ?? a.id ?? "").localeCompare(
        String(b.idPersona ?? b.id_persona ?? b.id ?? ""),
      );
    });

    setFilteredPersonas(filtered);
    setCurrentPage(1);
  }, [searchQuery, personas, filterTipo, filterEstado]);

  // Paginación
  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPersonas = filteredPersonas.slice(startIndex, endIndex);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterTipo = (e) => {
    setFilterTipo(e.target.value);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
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

  const clearFilters = () => {
    setSearchQuery("");
    setFilterTipo("");
    setFilterEstado("");
  };

  const openModal = (mode, persona = null) => {
    setModalMode(mode);
    setSelectedPersona(persona);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPersona(null);
  };

  const handleSavePersona = async (personaData, usuarioData = null) => {
    // Recargar la lista desde el servidor para obtener datos actualizados
    await loadPersonas();

    // Mostrar mensaje de éxito
    if (modalMode === "create") {
      if (usuarioData) {
        showSuccess(
          "Éxito",
          `Persona creada exitosamente!\n\nPersona: ${personaData.nombre} ${personaData.apellido}\nUsuario: ${usuarioData.nombreUsuario}`,
        );
      } else {
        showSuccess(
          "Éxito",
          `Persona creada exitosamente!\n\n${personaData.nombre} ${personaData.apellido}`,
        );
      }
    } else if (modalMode === "edit") {
      showSuccess("Éxito", "Persona actualizada exitosamente!");
    }

    closeModal();
  };

  const handleDelete = async (persona) => {
    const personaId = persona.id_persona ?? persona.idPersona ?? persona.id;

    // 1. Confirmación personalizada asíncrona
    const confirmed = await showConfirm(
      "Eliminar Persona",
      `¿Está seguro de que desea eliminar a ${persona.nombre} ${persona.apellido}?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Proceder solo si el usuario confirmó
    if (confirmed) {
      try {
        await personaService.delete(personaId);

        // 3. Actualización optimista de la UI (filtramos el estado local)
        setPersonas((prev) => prev.filter((p) => p.idPersona !== personaId));

        // 4. Feedback de éxito
        showSuccess(
          "Éxito",
          `${persona.nombre} ${persona.apellido} eliminado(a) exitosamente!`,
        );
      } catch (error) {
        // Manejo de errores sin logs de consola innecesarios
        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${error.response.data.message}`);
        } else {
          showError(
            "Error",
            "Error al eliminar la persona. Por favor, inténtelo de nuevo.",
          );
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Personas...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-user-friends"> </i>
            Gestión de Personas
          </h1>
          <p>Administra las personas del sistema</p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={() => openModal("create")}
          >
            <i className="fas fa-plus me-1"></i>
            Nueva Persona
          </button>
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.searchBar}>
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, documento o rol..."
                value={searchQuery}
                onChange={handleSearch}
                className={ContenidoStyle.searchInput}
              />
            </div>
            <div className={ContenidoStyle.filterActions}>
              <select
                className={ContenidoStyle.filterSelect}
                value={filterTipo}
                onChange={handleFilterTipo}
                disabled={loadingRoles}
              >
                <option value="">Todos los roles</option>
                {loadingRoles ? (
                  <option disabled>Cargando roles...</option>
                ) : (
                  roles.map((rol) => (
                    <option key={rol.idRol || rol.id} value={rol.nombreRol}>
                      {rol.nombreRol}
                    </option>
                  ))
                )}
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

              {(searchQuery || filterTipo || filterEstado) && (
                <button
                  className={ContenidoStyle.btnOutlineSecondary}
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
            {Math.min(endIndex, filteredPersonas.length)} de{" "}
            {filteredPersonas.length} permisos
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
          {currentPersonas.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron Personas</h5>
              <p>No hay Personas que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <table className={`${TablaStyle.tableData} table table-striped`}>
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className={TablaStyle.tableHeaderFixed}>
                <tr>
                  <th> # </th>
                  <th>Nombre y Apellido</th>
                  <th>Documento</th>
                  <th>Fecha Nacimiento</th>
                  <th>Género</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPersonas.map((persona, index) => (
                  <tr
                    key={
                      persona.idPersona ||
                      persona.id_persona ||
                      `persona-${index}`
                    }
                  >
                    <td>
                      <strong>{persona.idPersona}</strong>
                    </td>
                    <td
                      title={`${persona.nombre || ""} ${
                        persona.apellido || ""
                      }`}
                    >
                      <strong>
                        {(persona.nombre || "") +
                          " " +
                          (persona.apellido || "")}
                      </strong>
                    </td>
                    <td>
                      {persona.dni ||
                        persona.numeroDocumento ||
                        "Sin documento"}
                    </td>
                    <td>
                      {persona.fechaNacimiento
                        ? new Date(persona.fechaNacimiento).toLocaleDateString(
                            "es-ES",
                          )
                        : "No registrada"}
                    </td>
                    <td>
                      <span
                        className={`${ContenidoStyle.badge} bg-secondary text-white`}
                      >
                        {persona.genero || "No especificado"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${TablaStyle.typeBadge} ${
                          persona.nombreRol === "Alumno"
                            ? TablaStyle.studentBadge
                            : TablaStyle.teacherBadge
                        }`}
                      >
                        {persona.nombreRol}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${TablaStyle.statusBadge} ${
                          persona.estado.toLowerCase() === "activo"
                            ? TablaStyle.activo
                            : TablaStyle.inactivo
                        }`}
                      >
                        {persona.estado}
                      </span>
                    </td>
                    <td>
                      <div className={TablaStyle.actionButtons}>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                          onClick={() => openModal("view", persona)}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                          onClick={() => openModal("edit", persona)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                          onClick={() => handleDelete(persona)}
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

      {/* Modal para crear nueva Persona */}
      {showModal &&
        modalMode === "create" &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-user-plus me-2"></i>
                    Nueva Persona
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <PersonaForm
                    persona={selectedPersona}
                    mode={modalMode}
                    onSave={handleSavePersona}
                    onCancel={closeModal}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal para ver/editar Persona existente */}
      {showModal &&
        (modalMode === "edit" || modalMode === "view") &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    {modalMode === "edit" && (
                      <>
                        <i className="fas fa-user-edit me-2"></i>
                        Editar Persona
                      </>
                    )}
                    {modalMode === "view" && (
                      <>
                        <i className="fas fa-user me-2"></i>
                        Detalles de Persona
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
                  <PersonaEditForm
                    persona={selectedPersona}
                    mode={modalMode}
                    onSave={handleSavePersona}
                    onCancel={closeModal}
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

export default Personas;
