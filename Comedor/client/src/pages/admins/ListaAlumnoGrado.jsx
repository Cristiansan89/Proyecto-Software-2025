import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AlumnoGradoForm from "../../components/admin/AlumnoGradoForm";
import alumnoGradoService from "../../services/alumnoGradoService.js";
import { gradoService } from "../../services/gradoService.js";
import { formatCicloLectivo } from "../../utils/dateUtils.js";
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

const ListaAlumnosGrados = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumnos, setSelectedAlumnos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradoFilter, setGradoFilter] = useState("");
  const [cicloFilter, setCicloFilter] = useState(
    new Date().getFullYear().toString(),
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
      const gradosData = await gradoService.getActivos();
      setGrados(Array.isArray(gradosData) ? gradosData : []);
    } catch (error) {
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
      showError("Error", "Error al cargar la lista de alumnos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar alumnos cuando cambien los filtros
  useEffect(() => {
    let filtered = alumnos;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((alumno) => {
        const nombreCompleto =
          `${alumno.nombre} ${alumno.apellido}`.toLowerCase();
        return (
          alumno.nombre.toLowerCase().includes(searchLower) ||
          alumno.apellido.toLowerCase().includes(searchLower) ||
          nombreCompleto.includes(searchLower) ||
          alumno.dni.includes(searchTerm) ||
          alumno.nombreGrado.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro por grado
    if (gradoFilter) {
      filtered = filtered.filter(
        (alumno) => alumno.nombreGrado === gradoFilter,
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

  // Paginación
  const totalPages = Math.ceil(filteredAlumnos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlumnos = filteredAlumnos.slice(startIndex, endIndex);

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

  const handleDelete = async (alumnoId, persona) => {
    // 1. Confirmación personalizada asíncrona
    const confirmed = await showConfirm(
      "Eliminar Asignación",
      `¿Está seguro de eliminar esta asignación de alumno? El alumno "${persona.nombre} ${persona.apellido}" dejará de pertenecer a este grado.`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Ejecutar solo si el usuario confirmó
    if (confirmed) {
      try {
        await alumnoGradoService.delete(alumnoId);

        // 3. Recargar la lista y notificar éxito
        await loadAlumnos();
        showSuccess(
          "Éxito",
          `Asignación de ${persona.nombre} ${persona.apellido} eliminada correctamente`,
        );
      } catch (error) {
        // Manejo de errores sin logs de consola innecesarios
        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${error.response.data.message}`);
        } else {
          showError(
            "Error",
            "Error al eliminar la asignación. Por favor, inténtelo de nuevo.",
          );
        }
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setGradoFilter("");
    setCicloFilter(new Date().getFullYear().toString());
  };

  const handleSave = (result) => {
    setShowModal(false);
    setSelectedAlumno(null);
    loadAlumnos();

    if (modalMode === "create") {
      showSuccess(
        "Éxito",
        `Alumno asignado al grado correctamente!\n\nAlumno: ${result.nombre} ${result.apellido}\nGrado: ${result.nombreGrado}\nCiclo Lectivo: ${result.cicloLectivo}`,
      );
    } else {
      showSuccess(
        "Éxito",
        "Asignación del alumno ha sido actualizada correctamente!",
      );
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedAlumno(null);
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
        <p>Cargando Alumnos por Grado...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>Alumnos por Grado</h1>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Asignar Alumno
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, DNI o grado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={ContenidoStyle.searchInput}
            />
          </div>

          <div className={ContenidoStyle.filterActions}>
            <select
              className={ContenidoStyle.filterSelect}
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
              className={ContenidoStyle.filterSelect}
              value={cicloFilter}
              onChange={(e) => setCicloFilter(e.target.value)}
            >
              <option value="">Todos los ciclos</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            {(searchTerm ||
              gradoFilter ||
              cicloFilter !== new Date().getFullYear().toString()) && (
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

        {/* Información de resultados y paginación */}
        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, filteredAlumnos.length)} de{" "}
            {filteredAlumnos.length} alumnos
          </div>
          <div className={TablaStyle.itemsPerPage}>
            <label className="mb-0">
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
      </div>

      {/* Tabla */}
      <div className={TablaStyle.tableContainer}>
        {currentAlumnos.length === 0 ? (
          <div>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron asignaciones de alumnos</h5>
              <p>
                No hay asignaciones de alumnos que coincidan con tu búsqueda.
              </p>
            </div>
          </div>
        ) : (
          <div className={TablaStyle.scrollableTable}>
            <div className={TablaStyle.tableBodyScroll}>
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <thead className={TablaStyle.tableHeaderFixed}>
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
                  {currentAlumnos.map((alumno) => (
                    <tr key={alumno.idAlumnoGrado}>
                      <td>
                        <strong>
                          {(currentPage - 1) * itemsPerPage +
                            currentAlumnos.indexOf(alumno) +
                            1}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <div>
                            <strong>
                              <h6>
                                {alumno.nombre} {alumno.apellido}
                              </h6>
                            </strong>
                            <small className="d-block">DNI: {alumno.dni}</small>
                            <small className="d-block">
                              {alumno.genero} -{" "}
                              {alumno.fechaNacimiento
                                ? new Date(
                                    alumno.fechaNacimiento,
                                  ).toLocaleDateString()
                                : "Sin fecha"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.typeBadge} ${TablaStyle.studentBadge}`}
                        >
                          {alumno.nombreGrado}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.typeBadge} ${TablaStyle.anualBadge}`}
                        >
                          {formatCicloLectivo(alumno.cicloLectivo)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.statusBadge} ${
                            alumno.estadoPersona.toLowerCase() === "activo"
                              ? TablaStyle.activo
                              : TablaStyle.inactivo
                          }`}
                        >
                          {alumno.estadoPersona || "Activo"}
                        </span>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                            onClick={() => handleView(alumno)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleEdit(alumno)}
                            title="Editar asignación"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() =>
                              handleDelete(alumno.idAlumnoGrado, alumno)
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
            </div>
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

      {/* Modal para AsignarAlumno */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
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
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <AlumnoGradoForm
                    alumnoGrado={selectedAlumno}
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

export default ListaAlumnosGrados;
