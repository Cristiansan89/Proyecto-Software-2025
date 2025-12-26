import { useState, useEffect } from "react";
import AlumnoGradoForm from "../../components/admin/AlumnoGradoForm";
import alumnoGradoService from "../../services/alumnoGradoService.js";
import { gradoService } from "../../services/gradoService.js";
import { formatCicloLectivo } from "../../utils/dateUtils.js";

const ListaAlumnosGrados = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumnos, setSelectedAlumnos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradoFilter, setGradoFilter] = useState("");
  const [cicloFilter, setCicloFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estados para filtros dinámicos
  const [grados, setGrados] = useState([]);
  const [loadingGrados, setLoadingGrados] = useState(false);

  // Cargar alumnos al montar el componente
  useEffect(() => {
    loadAlumnos();
    loadGrados();
  }, []);

  const loadGrados = async () => {
    try {
      setLoadingGrados(true);
      console.log("ListaAlumnosGrados: Cargando grados...");
      const gradosData = await gradoService.getActivos();
      console.log("ListaAlumnosGrados: Grados cargados:", gradosData);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
    } catch (error) {
      console.error("Error al cargar grados:", error);
      setGrados([]);
    } finally {
      setLoadingGrados(false);
    }
  };

  const loadAlumnos = async () => {
    try {
      setLoading(true);
      const data = await alumnoGradoService.getAll();
      setAlumnos(data);
      setFilteredAlumnos(data);
    } catch (error) {
      console.error("Error al cargar los alumnos:", error);
      alert("Error al cargar la lista de alumnos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar alumnos cuando cambien los filtros
  useEffect(() => {
    let filtered = alumnos;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (alumno) =>
          alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alumno.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alumno.dni.includes(searchTerm) ||
          alumno.nombreGrado.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por grado
    if (gradoFilter) {
      filtered = filtered.filter(
        (alumno) => alumno.nombreGrado === gradoFilter
      );
    }

    // Filtro por ciclo lectivo
    if (cicloFilter) {
      filtered = filtered.filter((alumno) => {
        const ciclo = formatCicloLectivo(alumno.cicloLectivo).toString();
        return ciclo === cicloFilter;
      });
    }

    setFilteredAlumnos(filtered);
  }, [searchTerm, gradoFilter, cicloFilter, alumnos]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradoFilter, cicloFilter, alumnos]);

  const totalPages = Math.max(1, Math.ceil(filteredAlumnos.length / pageSize));

  // Ordenar alumnos por ID
  const sortedAlumnos = filteredAlumnos.slice().sort((a, b) => {
    const idA = a.idAlumnoGrado || 0;
    const idB = b.idAlumnoGrado || 0;
    return idA - idB;
  });

  const paginatedAlumnos = sortedAlumnos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Operaciones CRUD
  const handleCreate = () => {
    setModalMode("create");
    setSelectedAlumno(null);
    setShowModal(true);
  };

  const handleEdit = (alumno) => {
    setModalMode("edit");
    setSelectedAlumno(alumno);
    setShowModal(true);
  };

  const handleView = (alumno) => {
    setModalMode("view");
    setSelectedAlumno(alumno);
    setShowModal(true);
  };

  const handleDelete = async (alumnoId) => {
    if (window.confirm("¿Está seguro de eliminar esta asignación de alumno?")) {
      try {
        await alumnoGradoService.delete(alumnoId);
        loadAlumnos();
        alert("✅ Asignación eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar la asignación:", error);
        if (error.response?.data?.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert(
            "Error al eliminar la asignación. Por favor, inténtelo de nuevo."
          );
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAlumnos.length === 0) {
      alert("Seleccione al menos una asignación para eliminar");
      return;
    }

    if (
      window.confirm(
        `¿Está seguro de que desea eliminar ${selectedAlumnos.length} asignación(es)?`
      )
    ) {
      try {
        await Promise.all(
          selectedAlumnos.map((id) => alumnoGradoService.delete(id))
        );
        setSelectedAlumnos([]);
        loadAlumnos();
        alert("Asignaciones eliminadas correctamente");
      } catch (error) {
        console.error("Error al eliminar asignaciones:", error);
        alert("Error al eliminar algunas asignaciones");
      }
    }
  };

  const handleSave = (result) => {
    setShowModal(false);
    setSelectedAlumno(null);
    loadAlumnos();

    if (modalMode === "create") {
      alert(
        `Alumno asignado al grado correctamente!\n\nAlumno: ${result.nombre} ${result.apellido}\nGrado: ${result.nombreGrado}\nCiclo: ${result.cicloLectivo}`
      );
    } else {
      alert("Asignación actualizada correctamente!");
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedAlumno(null);
  };

  // Obtener lista única de grados para el filtro
  // const gradosUnicos = [...new Set(alumnos.map(alumno => alumno.nombreGrado))].sort();

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando asignaciones de alumnos...</p>
      </div>
    );
  }

  return (
    <div className="alumnos-grados-page">
      {/* Header */}
      <div className="page-header mb-3">
        <div className="header-left">
          <h2 className="page-title-sub">Alumnos por Grado</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary-new" onClick={handleCreate}>
            <i className="fas fa-plus"></i>
            Asignar Alumno
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="page-header mb-3">
        <div className="header-left">
          <div className="filters-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, DNI o grado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-actions">
              <select
                className="filter-select"
                value={gradoFilter}
                onChange={(e) => setGradoFilter(e.target.value)}
                disabled={loadingGrados}
              >
                <option value="">Todos los grados</option>
                {loadingGrados ? (
                  <option disabled>Cargando grados...</option>
                ) : (
                  grados.map((grado) => (
                    <option
                      key={grado.idGrado || grado.id}
                      value={grado.nombreGrado}
                    >
                      {grado.nombreGrado}
                    </option>
                  ))
                )}
              </select>

              <select
                className="filter-select"
                value={cicloFilter}
                onChange={(e) => setCicloFilter(e.target.value)}
              >
                <option value="">Todos los ciclos</option>
                {/* TODO: Aplicar filtro por ciclo en service */}
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>

              {(searchTerm ||
                gradoFilter ||
                cicloFilter !== new Date().getFullYear().toString()) && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm("");
                    setGradoFilter("");
                    setCicloFilter(new Date().getFullYear().toString());
                  }}
                  title="Limpiar filtros"
                >
                  <i className="fas fa-times"></i>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Acciones en lote */}
          {selectedAlumnos.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">
                {selectedAlumnos.length} asignación(es) seleccionada(s)
              </span>
              <div className="bulk-buttons">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleBulkDelete}
                >
                  <i className="fas fa-trash"></i>
                  Eliminar seleccionadas
                </button>
              </div>
            </div>
          )}

          {/* Información de resultados y paginación */}
          <div className="results-info mb-1">
            <div className="results-count">
              Mostrando {paginatedAlumnos.length} de {filteredAlumnos.length}{" "}
              alumnos{" "}
              {searchTerm && (
                <span className="filter-indicator">
                  filtrado por "{searchTerm}"
                </span>
              )}
            </div>
            <div className="page-size-selector d-flex align-items-center gap-2">
              <label className="mb-0">
                <strong>Registros por página:</strong>
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: "70px" }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        {filteredAlumnos.length === 0 ? (
          <div className="no-data">
            <p>No se encontraron asignaciones de alumnos</p>
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
                    <th>#</th>
                    <th>Información del Alumno</th>
                    <th>Grado Asignado</th>
                    <th>Ciclo Lectivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlumnos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">
                        No se encontraron alumnos
                      </td>
                    </tr>
                  ) : (
                    paginatedAlumnos.map((alumno) => (
                      <tr key={alumno.idAlumnoGrado}>
                        <td>
                          <strong>{alumno.idAlumnoGrado}</strong>
                        </td>
                        <td>
                          <div className="user-info">
                            <div>
                              <strong>
                                <h6>
                                  {alumno.nombre} {alumno.apellido}
                                </h6>
                              </strong>
                              <small className="d-block">
                                DNI: {alumno.dni}
                              </small>
                              <small className="d-block">
                                {alumno.genero} -{" "}
                                {alumno.fechaNacimiento
                                  ? new Date(
                                      alumno.fechaNacimiento
                                    ).toLocaleDateString()
                                  : "Sin fecha"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="type-badge student">
                            {alumno.nombreGrado}
                          </span>
                        </td>
                        <td>
                          <span className="badge-anual">
                            {formatCicloLectivo(alumno.cicloLectivo)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              alumno.estadoPersona
                                ? alumno.estadoPersona.toLowerCase()
                                : "activo"
                            }`}
                          >
                            {alumno.estadoPersona || "Activo"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleView(alumno)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(alumno)}
                              title="Editar asignación"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(alumno.idAlumnoGrado)}
                              title="Eliminar asignación"
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
              {totalPages > 1 && (
                <div className="table-footer">
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="pagination-info">
                      Página {currentPage} de {totalPages} (
                      {filteredAlumnos.length} registros)
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para AsignarAlumno */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content alumno-modal">
            <div className="modal-header">
              <h3>
                {modalMode === "create" && (
                  <>
                    <i className="fas fa-user-plus me-2"></i>
                    Asignar Alumno a Grado
                  </>
                )}
                {modalMode === "edit" && (
                  <>
                    <i className="fas fa-user-edit me-2"></i>
                    Editar Asignación
                  </>
                )}
                {modalMode === "view" && (
                  <>
                    <i className="fas fa-user me-2"></i>
                    Detalles de Asignación
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={handleCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <AlumnoGradoForm
                alumnoGrado={selectedAlumno}
                mode={modalMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaAlumnosGrados;
