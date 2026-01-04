import { useState, useEffect } from "react";
import PersonaForm from "../../components/admin/PersonaForm";
import PersonaEditForm from "../../components/admin/PersonaEditForm.jsx";
import personaService from "../../services/personaService.js";
import { rolService } from "../../services/rolService.js";
import "../../styles/table-insumos.css";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const ListaPersonas = () => {
  const [personas, setPersonas] = useState([]);
  const [filteredPersonas, setFilteredPersonas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Estados para filtros dinámicos
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    loadPersonas();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      console.log("ListaPersonas: Cargando roles...");
      const rolesData = await rolService.getActivos();
      console.log("ListaPersonas: Roles cargados:", rolesData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadPersonas = async () => {
    try {
      setLoading(true);
      console.log("ListaPersonas: Iniciando carga de personas...");
      const data = await personaService.getAll();
      console.log("ListaPersonas: Datos recibidos:", data);

      // Asegurar que data es un array
      let personas = Array.isArray(data) ? data : [];
      // Ordenar por id numérico si existe (idPersona, id_persona o id)
      personas.sort((a, b) => {
        const ai = Number(a.idPersona ?? a.id_persona ?? a.id ?? 0);
        const bi = Number(b.idPersona ?? b.id_persona ?? b.id ?? 0);
        if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi;
        return String(a.idPersona ?? a.id_persona ?? a.id ?? "").localeCompare(
          String(b.idPersona ?? b.id_persona ?? b.id ?? "")
        );
      });

      setPersonas(personas);
      setFilteredPersonas(personas);
      console.log(
        "ListaPersonas: Estado actualizado con",
        personas.length,
        "personas"
      );
    } catch (error) {
      console.error("Error al cargar personas:", error);
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
          return (
            (persona.nombre &&
              persona.nombre.toLowerCase().includes(searchLower)) ||
            (persona.apellido &&
              persona.apellido.toLowerCase().includes(searchLower)) ||
            (persona.dni && persona.dni.toString().includes(searchQuery)) ||
            (persona.numeroDocumento &&
              persona.numeroDocumento.toString().includes(searchQuery)) ||
            (persona.nombreRol &&
              persona.nombreRol.toLowerCase().includes(searchLower)) ||
            (persona.genero &&
              persona.genero.toLowerCase().includes(searchLower))
          );
        } catch (error) {
          console.error("Error al filtrar persona:", persona, error);
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
        String(b.idPersona ?? b.id_persona ?? b.id ?? "")
      );
    });

    setFilteredPersonas(filtered);
    setCurrentPage(1);
  }, [searchQuery, personas, filterTipo, filterEstado]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPersonas = Array.isArray(filteredPersonas)
    ? filteredPersonas.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Array.isArray(filteredPersonas)
    ? Math.ceil(filteredPersonas.length / itemsPerPage)
    : 0;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterTipo = (e) => {
    setFilterTipo(e.target.value);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
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
          `Persona creada exitosamente!\n\nPersona: ${personaData.nombre} ${personaData.apellido}\nUsuario: ${usuarioData.nombreUsuario}`
        );
      } else {
        showSuccess(
          "Éxito",
          `Persona creada exitosamente!\n\n${personaData.nombre} ${personaData.apellido}`
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
      "Cancelar"
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
          `${persona.nombre} ${persona.apellido} eliminado(a) exitosamente!`
        );
      } catch (error) {
        // Manejo de errores sin logs de consola innecesarios
        if (error.response?.data?.message) {
          showInfo("Información", `Error: ${error.response.data.message}`);
        } else {
          showError(
            "Error",
            "Error al eliminar la persona. Por favor, inténtelo de nuevo."
          );
        }
      }
    }
  };

  return (
    <div className="content-page">
      <div className="page-header mb-3">
        <div className="header-left">
          <h2 className="page-title-sub">Lista de Personas</h2>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary-new"
            onClick={() => openModal("create")}
          >
            <i className="fas fa-plus"></i>
            Nueva Persona
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="page-header mb-3">
        <div className="header-left">
          <div className="search-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, documento o rol..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="filter-actions">
              <select
                className="filter-select"
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
                className="filter-select"
                value={filterEstado}
                onChange={handleFilterEstado}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>

              {(searchQuery || filterTipo || filterEstado) && (
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

      {/* Tabla */}
      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando personas...</p>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table
              className="table table-striped data-table table-responsive-insumos"
              style={{ minWidth: 900 }}
            >
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
              <thead className="table-header-fixed">
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
                {currentPersonas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      <p>No se encontraron personas</p>
                    </td>
                  </tr>
                ) : (
                  currentPersonas.map((persona, index) => (
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
                        className="truncate-cell"
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
                      <td className="truncate-cell">
                        {persona.dni ||
                          persona.numeroDocumento ||
                          "Sin documento"}
                      </td>
                      <td>
                        {persona.fechaNacimiento
                          ? new Date(
                              persona.fechaNacimiento
                            ).toLocaleDateString("es-ES")
                          : "No registrada"}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {persona.genero || "No especificado"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`type-badge ${
                            persona.habilitaCuentaUsuario === "Sí"
                              ? "teacher"
                              : "student"
                          }`}
                        >
                          {persona.nombreRol || "Sin rol"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            persona.estado
                              ? persona.estado.toLowerCase()
                              : "unknown"
                          }`}
                        >
                          {persona.estado || "Desconocido"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-view"
                            onClick={() => openModal("view", persona)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openModal("edit", persona)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(persona)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
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
            Página {currentPage} de {totalPages} ({filteredPersonas.length}{" "}
            registros)
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

      {/* Modal para crear nueva Persona */}
      {showModal && modalMode === "create" && (
        <div className="modal-overlay">
          <div className="modal-content persona-modal">
            <div className="modal-header">
              <h3 className="text-white">
                <i className="fas fa-user-plus me-2"></i>
                Nueva Persona
              </h3>
              <button className="modal-close text-white" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <PersonaForm
                persona={selectedPersona}
                mode={modalMode}
                onSave={handleSavePersona}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver/editar Persona existente */}
      {showModal && (modalMode === "edit" || modalMode === "view") && (
        <div className="modal-overlay">
          <div className="modal-content persona-modal">
            <div className="modal-header">
              <h3 className="text-white">
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
              </h3>
              <button className="modal-close text-white" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <PersonaEditForm
                persona={selectedPersona}
                mode={modalMode}
                onSave={handleSavePersona}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPersonas;
