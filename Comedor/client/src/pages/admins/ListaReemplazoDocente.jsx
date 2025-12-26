import { useState, useEffect } from "react";
import ReemplazoDocenteForm from "../../components/admin/ReemplazoDocenteForm";
import reemplazoDocenteService from "../../services/reemplazoDocenteService.js";
import { gradoService } from "../../services/gradoService.js";
import { formatCicloLectivo } from "../../utils/dateUtils.js";

const ListaReemplazosGrados = () => {
  const [reemplazos, setReemplazos] = useState([]);
  const [filteredReemplazos, setFilteredReemplazos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedReemplazo, setSelectedReemplazo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradoFilter, setGradoFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [motivoFilter, setMotivoFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estados para filtros dinámicos
  const [grados, setGrados] = useState([]);
  const [loadingGrados, setLoadingGrados] = useState(false);

  // Cargar reemplazos al montar el componente
  useEffect(() => {
    loadReemplazos();
    loadGrados();
  }, []);

  const loadGrados = async () => {
    try {
      setLoadingGrados(true);
      console.log("ListaReemplazosGrados: Cargando grados...");
      const gradosData = await gradoService.getActivos();
      console.log("ListaReemplazosGrados: Grados cargados:", gradosData);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
    } catch (error) {
      console.error("Error al cargar grados:", error);
      setGrados([]);
    } finally {
      setLoadingGrados(false);
    }
  };

  const loadReemplazos = async () => {
    try {
      setLoading(true);
      const data = await reemplazoDocenteService.getAll();
      setReemplazos(data);
      setFilteredReemplazos(data);
    } catch (error) {
      console.error("Error al cargar los reemplazos:", error);
      alert("Error al cargar la lista de reemplazos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reemplazos cuando cambien los filtros
  useEffect(() => {
    let filtered = reemplazos;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (reemplazo) =>
          reemplazo.nombreSuplente
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reemplazo.apellidoSuplente
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reemplazo.dniSuplente.includes(searchTerm) ||
          reemplazo.nombreTitular
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reemplazo.apellidoTitular
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          reemplazo.dniTitular.includes(searchTerm) ||
          reemplazo.nombreGrado.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por grado
    if (gradoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.nombreGrado === gradoFilter
      );
    }

    // Filtro por estado
    if (estadoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.estado === estadoFilter
      );
    }

    // Filtro por motivo
    if (motivoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.motivo === motivoFilter
      );
    }

    setFilteredReemplazos(filtered);
  }, [searchTerm, gradoFilter, estadoFilter, motivoFilter, reemplazos]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradoFilter, estadoFilter, motivoFilter, reemplazos]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReemplazos.length / pageSize)
  );

  // Ordenar reemplazos por ID
  const sortedReemplazos = filteredReemplazos.slice().sort((a, b) => {
    const idA = a.idReemplazoDocente || 0;
    const idB = b.idReemplazoDocente || 0;
    return idA - idB;
  });

  const paginatedReemplazos = sortedReemplazos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Operaciones CRUD
  const handleCreate = () => {
    setModalMode("create");
    setSelectedReemplazo(null);
    setShowModal(true);
  };

  const handleEdit = (reemplazo) => {
    setModalMode("edit");
    setSelectedReemplazo(reemplazo);
    setShowModal(true);
  };

  const handleView = (reemplazo) => {
    setModalMode("view");
    setSelectedReemplazo(reemplazo);
    setShowModal(true);
  };

  const handleDelete = async (reemplazoId) => {
    if (window.confirm("¿Está seguro de eliminar este reemplazo?")) {
      try {
        await reemplazoDocenteService.delete(reemplazoId);
        loadReemplazos();
        alert("✅ Reemplazo eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el reemplazo:", error);
        if (error.response?.data?.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert(
            "Error al eliminar el reemplazo. Por favor, inténtelo de nuevo."
          );
        }
      }
    }
  };

  const handleFinalizarReemplazo = async (reemplazoId) => {
    if (window.confirm("¿Está seguro de finalizar este reemplazo?")) {
      try {
        await reemplazoDocenteService.finalizar(reemplazoId);
        loadReemplazos();
        alert("✅ Reemplazo finalizado correctamente");
      } catch (error) {
        console.error("Error al finalizar el reemplazo:", error);
        if (error.response?.data?.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert(
            "Error al finalizar el reemplazo. Por favor, inténtelo de nuevo."
          );
        }
      }
    }
  };

  const handleSave = (result) => {
    setShowModal(false);
    setSelectedReemplazo(null);
    loadReemplazos();

    if (modalMode === "create") {
      alert(
        `✅ Reemplazo creado correctamente!\n\nSuplente: ${result.nombreSuplente} ${result.apellidoSuplente}\nTitular: ${result.nombreTitular} ${result.apellidoTitular}\nGrado: ${result.nombreGrado}\nMotivo: ${result.motivo}`
      );
    } else {
      alert("✅ Reemplazo actualizado correctamente!");
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedReemplazo(null);
  };

  // Obtener listas únicas para los filtros
  // const gradosUnicos = [...new Set(reemplazos.map(reemplazo => reemplazo.nombreGrado))].sort();
  const estadosUnicos = [
    ...new Set(reemplazos.map((reemplazo) => reemplazo.estado)),
  ].sort();
  const motivosUnicos = [
    ...new Set(reemplazos.map((reemplazo) => reemplazo.motivo)),
  ].sort();

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando reemplazos...</p>
      </div>
    );
  }

  return (
    <div className="reemplazos-page">
      {/* Header */}
      <div className="page-header mb-3">
        <div className="header-left">
          <h2 className="page-title-sub">Reemplazos de Docentes</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary-new" onClick={handleCreate}>
            <i className="fas fa-plus"></i>
            Crear Reemplazo
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
                placeholder="Buscar por suplente, titular, grado o DNI..."
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
                      value={grado.nombre}
                    >
                      {grado.nombre}
                    </option>
                  ))
                )}
              </select>

              <select
                className="filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={motivoFilter}
                onChange={(e) => setMotivoFilter(e.target.value)}
              >
                <option value="">Todos los motivos</option>
                {motivosUnicos.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>

              {(searchTerm || gradoFilter || estadoFilter || motivoFilter) && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm("");
                    setGradoFilter("");
                    setEstadoFilter("");
                    setMotivoFilter("");
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
          <div className="results-info">
            <div className="results-count">
              Mostrando {paginatedReemplazos.length} de{" "}
              {filteredReemplazos.length} reemplazos{" "}
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
        {paginatedReemplazos.length === 0 ? (
          <div className="no-data">
            <p>No se encontraron reemplazos de docentes</p>
          </div>
        ) : (
          <div className="scrollable-table">
            <div className="table-body-scroll">
              <table className="table table-striped data-table">
                <thead className="table-header-fixed">
                  <tr>
                    <th>#</th>
                    <th>Docente Suplente</th>
                    <th>Docente Titular</th>
                    <th>Grado</th>
                    <th>Período</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReemplazos.map((reemplazo) => (
                    <tr key={reemplazo.idReemplazoDocente}>
                      <td>
                        <strong>
                          {(currentPage - 1) * pageSize +
                            filteredReemplazos.indexOf(reemplazo) +
                            1}
                        </strong>
                      </td>
                      <td>
                        <div className="user-info">
                          <div>
                            <strong>
                              <h6>
                                {reemplazo.nombreSuplente}{" "}
                                {reemplazo.apellidoSuplente}
                              </h6>
                            </strong>
                            <small className="d-block">
                              DNI: {reemplazo.dniSuplente}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          <div>
                            <strong>
                              <h6>
                                {reemplazo.nombreTitular}{" "}
                                {reemplazo.apellidoTitular}
                              </h6>
                            </strong>
                            <small className="d-block">
                              DNI: {reemplazo.dniTitular}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="type-badge teacher">
                          {reemplazo.nombreGrado}
                        </span>
                        <small className="d-block text-muted">
                          Ciclo: {formatCicloLectivo(reemplazo.cicloLectivo)}
                        </small>
                      </td>
                      <td>
                        <div>
                          <strong>Inicio:</strong>{" "}
                          {new Date(reemplazo.fechaInicio).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Fin:</strong>{" "}
                          {reemplazo.fechaFin
                            ? new Date(reemplazo.fechaFin).toLocaleDateString()
                            : "Sin definir"}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {reemplazo.motivo}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${reemplazo.estado.toLowerCase()}`}
                        >
                          {reemplazo.estado}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-view"
                            onClick={() => handleView(reemplazo)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(reemplazo)}
                            title="Editar reemplazo"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {reemplazo.estado === "Activo" && (
                            <button
                              className="btn-action btn-warning"
                              onClick={() =>
                                handleFinalizarReemplazo(
                                  reemplazo.idReemplazoDocente
                                )
                              }
                              title="Finalizar reemplazo"
                            >
                              <i className="fas fa-stop"></i>
                            </button>
                          )}
                          <button
                            className="btn-action btn-delete"
                            onClick={() =>
                              handleDelete(reemplazo.idReemplazoDocente)
                            }
                            title="Eliminar reemplazo"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                      {filteredReemplazos.length} registros)
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

      {/* Modal para Reemplazo */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content reemplazo-modal">
            <div className="modal-header">
              <h3>
                {modalMode === "create" && (
                  <>
                    <i className="fas fa-user-plus me-2"></i>
                    Crear Reemplazo
                  </>
                )}
                {modalMode === "edit" && (
                  <>
                    <i className="fas fa-user-edit me-2"></i>
                    Editar Reemplazo
                  </>
                )}
                {modalMode === "view" && (
                  <>
                    <i className="fas fa-user me-2"></i>
                    Detalles del Reemplazo
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={handleCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <ReemplazoDocenteForm
                reemplazo={selectedReemplazo}
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

export default ListaReemplazosGrados;
