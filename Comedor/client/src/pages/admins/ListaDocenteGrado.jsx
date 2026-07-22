import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DocenteGradoForm from "../../components/admin/DocenteGradoForm";
import docenteGradoService from "../../services/docenteGradoService.js";
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

const ListaDocentesGrados = () => {
  const [docentes, setDocentes] = useState([]);
  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedDocente, setSelectedDocente] = useState(null);
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

  // Cargar docentes al montar el componente
  useEffect(() => {
    loadDocentes();
    loadGrados();
  }, []);

  const loadGrados = async () => {
    try {
      setLoadingGrados(true);
      // console.log("ListaDocentesGrados: Cargando grados...");
      const gradosData = await gradoService.getActivos();
      // console.log("ListaDocentesGrados: Grados cargados:", gradosData);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
    } catch (error) {
      //console.error("Error al cargar grados:", error);
      showError("Error", "Error al cargar la lista de grados");
      setGrados([]);
    } finally {
      setLoadingGrados(false);
    }
  };

  const loadDocentes = async () => {
    try {
      setLoading(true);
      const data = await docenteGradoService.getAll();
      setDocentes(data);
      setFilteredDocentes(data);
    } catch (error) {
      //console.error("Error al cargar los docentes:", error);
      showError("Error", "Error al cargar la lista de docentes");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar docentes cuando cambien los filtros
  useEffect(() => {
    let filtered = docentes;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((docente) => {
        const nombreCompleto =
          `${docente.nombre} ${docente.apellido}`.toLowerCase();
        return (
          docente.nombre.toLowerCase().includes(searchLower) ||
          docente.apellido.toLowerCase().includes(searchLower) ||
          nombreCompleto.includes(searchLower) ||
          docente.dni.includes(searchTerm) ||
          docente.nombreGrado.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro por grado
    if (gradoFilter) {
      filtered = filtered.filter(
        (docente) => docente.nombreGrado === gradoFilter,
      );
    }

    // Filtro por ciclo lectivo
    if (cicloFilter) {
      filtered = filtered.filter((docente) => {
        const ciclo = formatCicloLectivo(docente.cicloLectivo).toString();
        return ciclo === cicloFilter;
      });
    }

    setFilteredDocentes(filtered);
  }, [searchTerm, gradoFilter, cicloFilter, docentes]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradoFilter, cicloFilter, docentes]);

  // Paginación
  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocentes = filteredDocentes.slice(startIndex, endIndex);

  // Ordenar docentes por grado y luego por ID
  const sortedDocentes = filteredDocentes.slice().sort((a, b) => {
    // Comparar por grado primero
    const gradoComparison = (a.nombreGrado || "").localeCompare(
      b.nombreGrado || "",
    );
    if (gradoComparison !== 0) return gradoComparison;

    // Si son del mismo grado, comparar por ID
    const idA = a.idDocenteTitular || 0;
    const idB = b.idDocenteTitular || 0;
    return idA - idB;
  });

  const paginatedDocentes = sortedDocentes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Operaciones CRUD
  const handleCreate = () => {
    setModalMode("create");
    setSelectedDocente(null);
    setShowModal(true);
  };

  const handleEdit = (docente) => {
    setModalMode("edit");
    setSelectedDocente(docente);
    setShowModal(true);
  };

  const handleView = (docente) => {
    setModalMode("view");
    setSelectedDocente(docente);
    setShowModal(true);
  };

  const handleDelete = async (docente) => {
    // 1. Confirmación asíncrona personalizada
    // Incluimos el nombre del grado para que el usuario esté seguro de qué está borrando
    const confirmed = await showConfirm(
      "Eliminar Asignación",
      `¿Está seguro de eliminar la asignación del docente "${docente.nombre} ${docente.apellido}" para el grado "${docente.nombreGrado}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        // 2. Llamada al servicio con los 3 parámetros de identificación
        await docenteGradoService.delete(
          docente.idDocenteTitular,
          docente.idPersona,
          docente.nombreGrado,
        );

        // 3. Recarga de datos y feedback
        await loadDocentes();

        // Cambiamos showInfo por showSuccess para dar un feedback positivo claro
        showSuccess(
          "Éxito",
          `La asignación del docente "${docente.nombre} ${docente.apellido}" se eliminó correctamente`,
        );
      } catch (error) {
        // 4. Manejo de errores sin logs de consola
        const msg =
          error.response?.data?.message ||
          "Error al eliminar la asignación. Por favor, inténtelo de nuevo.";

        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${msg}`);
        } else {
          showError("Error", msg);
        }
      }
    }
  };

  const handleSave = (result) => {
    setShowModal(false);
    setSelectedDocente(null);
    loadDocentes();

    if (modalMode === "create") {
      showSuccess(
        "Éxito",
        `Docente asignado al grado correctamente!\n\nDocente: ${result.nombre} ${result.apellido}\nGrado: ${result.nombreGrado}\nCiclo: ${formatCicloLectivo(result.cicloLectivo)}`,
      );
    } else {
      showSuccess(
        "Éxito",
        "Asignación del docente ha sido actualizada correctamente!",
      );
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedDocente(null);
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
        <p>Cargando Docentes por Grado...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.contenidoPage}>
      <div className={ContenidoStyle.pageHeader} mb-3>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>Docentes por Grado</h1>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Asignar Docente
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
                    key={grado.id_grado || grado.idGrado || grado.id}
                    value={grado.nombreGrado || grado.nombre}
                  >
                    {grado.nombreGrado || grado.nombre}
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
                className={ContenidoStyle.btnOutlineSecondary}
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

        {/* Información de resultados y paginación */}
        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, currentDocentes.length)} de{" "}
            {currentDocentes.length} docentes
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
      </div>

      {/* Tabla */}
      <div className={TablaStyle.tableContainer}>
        {currentDocentes.length === 0 ? (
          <div className={TablaStyle.emptyState}>
            <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
            <h5>No se encontraron docentes</h5>
            <p>No hay docentes que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className={TablaStyle.scrollableTable}>
            <div className={TablaStyle.tableBodyScroll}>
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th>#</th>
                    <th>Información del Docente</th>
                    <th>Grado Asignado</th>
                    <th>Fecha Asignación</th>
                    <th>Ciclo Lectivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocentes.map((docente) => (
                    <tr
                      key={`${docente.idDocenteTitular}-${docente.idPersona}-${docente.nombreGrado}`}
                    >
                      <td>
                        <strong>
                          {(currentPage - 1) * itemsPerPage +
                            currentDocentes.indexOf(docente) +
                            1}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <div>
                            <strong>
                              <h6>
                                {docente.nombre} {docente.apellido}
                              </h6>
                            </strong>
                            <small className="d-block">
                              DNI: {docente.dni}
                            </small>
                            <small className="d-block">
                              {docente.genero} -{" "}
                              {docente.fechaNacimiento
                                ? new Date(
                                    docente.fechaNacimiento,
                                  ).toLocaleDateString()
                                : "Sin fecha"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.typeBadge} ${TablaStyle.teacherBadge}`}
                        >
                          {docente.nombreGrado}
                        </span>
                      </td>
                      <td>
                        {docente.fechaAsignado
                          ? new Date(docente.fechaAsignado).toLocaleDateString()
                          : "No registrada"}
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.typeBadge} ${TablaStyle.anualBadge}`}
                        >
                          {formatCicloLectivo(docente.cicloLectivo)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${TablaStyle.statusBadge} ${
                            docente.estadoPersona.toLowerCase() === "activo"
                              ? TablaStyle.activo
                              : TablaStyle.inactivo
                          }`}
                        >
                          {docente.estadoPersona}
                        </span>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                            onClick={() => handleView(docente)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleEdit(docente)}
                            title="Editar asignación"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() => handleDelete(docente)}
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

      {/* Modal para AsignarDocente */}
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
                        Asignar Docente a Grado
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
                  <DocenteGradoForm
                    docenteGrado={selectedDocente}
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

export default ListaDocentesGrados;
