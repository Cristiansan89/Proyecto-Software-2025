import { useState, useEffect } from "react";
import InsumoForm from "../../components/admin/InsumoForm";
import insumoService from "../../services/insumoService";

const ListaInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    console.log("ListaInsumos: Iniciando loadInsumos");
    try {
      setLoading(true);
      const data = await insumoService.getAll();
      console.log("ListaInsumos: Datos recibidos:", data);
      setInsumos(data);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      alert("Error al cargar los insumos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar insumos
  const filteredInsumos = insumos.filter((insumo) => {
    const matchesSearch =
      insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insumo.descripcion &&
        insumo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      insumo.unidadMedida.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || insumo.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, insumos]);

  const totalPages = Math.max(1, Math.ceil(filteredInsumos.length / pageSize));
  const paginatedInsumos = filteredInsumos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreate = () => {
    setSelectedInsumo(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (insumo) => {
    setSelectedInsumo(insumo);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (insumo) => {
    setSelectedInsumo(insumo);
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = async (insumo) => {
    if (
      window.confirm(
        `¿Está seguro de eliminar el insumo "${insumo.nombreInsumo}"?`
      )
    ) {
      try {
        await insumoService.delete(insumo.idInsumo);
        alert("Insumo eliminado correctamente");
        loadInsumos();
      } catch (error) {
        console.error("Error al eliminar insumo:", error);
        if (error.response?.data?.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert("Error al eliminar el insumo");
        }
      }
    }
  };

  const handleChangeStatus = async (insumo, nuevoEstado) => {
    try {
      const updated = { ...insumo, estado: nuevoEstado };
      await insumoService.update(insumo.idInsumo, updated);
      alert(`Estado actualizado a ${nuevoEstado}`);
      loadInsumos();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error al cambiar el estado del insumo");
      }
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setSelectedInsumo(null);
    loadInsumos();
    alert(
      `Insumo ${
        modalMode === "create" ? "creado" : "actualizado"
      } correctamente`
    );
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedInsumo(null);
  };

  const getStockStatus = (insumo) => {
    const minimo = Number(insumo.stockMinimo);
    const actual = Number(insumo.stockActual);

    const critico = minimo * 0.75;

    if (actual <= critico) {
      return {
        status: "critical",
        color: "text-danger",
        icon: "fa-exclamation-triangle",
      };
    } else if (actual <= minimo) {
      return {
        status: "low",
        color: "text-warning",
        icon: "fa-exclamation-circle",
      };
    } else {
      return {
        status: "good",
        color: "text-success",
        icon: "fa-check-circle",
      };
    }
  };

  const formatStockActual = (value) => {
    if (value === null || value === undefined) return "0";
    const n = Number(value);
    if (isNaN(n)) return String(value);
    // Mostrar como entero (sin decimales)
    return String(Math.round(n));
  };

  if (loading) {
    return (
      <div>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-boxes me-2"></i>
            Gestión de Insumos
          </h1>
          <p className="page-subtitle">
            Administra los insumos disponibles en el comedor
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary-new" onClick={handleCreate}>
            <i className="fas fa-plus me-2"></i> Nuevo Insumo
          </button>
        </div>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, descripción, unidad o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Selector de tamaño de página y Paginación */}
      <div className="page-size-selector d-flex align-items-center gap-2 ml-2 mb-2">
        <label className="mb-0">
          <strong>
            <i>Registros por página</i>:
          </strong>
        </label>
        <select
          className="form-select"
          style={{ width: "60px" }}
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
        <span className="ms-2 text-muted">
          Total: {filteredInsumos.length} registros
        </span>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando insumos...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped data-table table-sm">
              <thead>
                <tr>
                  <th style={{ fontSize: "0.75rem" }}>#</th>
                  <th style={{ fontSize: "0.75rem" }}>Insumo</th>
                  <th style={{ fontSize: "0.75rem" }}>Descripción</th>
                  <th style={{ fontSize: "0.75rem" }}>Categoría</th>
                  <th style={{ fontSize: "0.75rem" }}>Unidad</th>
                  <th style={{ fontSize: "0.75rem" }}>Stock Mín.</th>
                  <th style={{ fontSize: "0.75rem" }}>Stock Actual</th>
                  <th style={{ fontSize: "0.75rem" }}>Stock Máx.</th>
                  <th style={{ fontSize: "0.75rem" }}>Estado</th>
                  <th style={{ fontSize: "0.75rem" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInsumos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="no-data">
                      No se encontraron insumos
                    </td>
                  </tr>
                ) : (
                  paginatedInsumos.map((insumo, index) => {
                    const stockStatus = getStockStatus(insumo);
                    return (
                      <tr key={insumo.idInsumo || index}>
                        <td style={{ fontSize: "0.75rem" }}>
                          <strong>
                            {(currentPage - 1) * pageSize + index + 1}
                          </strong>
                        </td>
                        <td
                          className="truncate-cell"
                          title={insumo.nombreInsumo}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {insumo.nombreInsumo || "-"}
                        </td>
                        <td
                          className="truncate-cell"
                          title={insumo.descripcion}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {insumo.descripcion || "Sin descripción"}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          {insumo.categoria || ""}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          {insumo.unidadMedida || ""}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          {formatStockActual(insumo.stockMinimo)}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          <span className={`fw-bold ${stockStatus.color}`}>
                            {formatStockActual(insumo.stockActual)}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          {formatStockActual(insumo.stockMaximo)}
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          <span
                            className={`status-badge-insumo ${String(
                              insumo.estado || ""
                            ).toLowerCase()}`}
                          >
                            {insumo.estado || ""}
                          </span>
                        </td>
                        <td>
                          <div
                            className="action-buttons"
                            style={{ gap: "2px" }}
                          >
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleView(insumo)}
                              title="Ver detalles"
                              style={{
                                padding: "4px 6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(insumo)}
                              title="Editar"
                              style={{
                                padding: "4px 6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(insumo)}
                              title="Eliminar"
                              style={{
                                padding: "4px 6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            <button
                              className={`btn-action ${
                                insumo.estado === "Activo"
                                  ? "btn-delete"
                                  : "btn-assign"
                              }`}
                              onClick={() =>
                                handleChangeStatus(
                                  insumo,
                                  insumo.estado === "Activo"
                                    ? "Inactivo"
                                    : "Activo"
                                )
                              }
                              title={
                                insumo.estado === "Activo"
                                  ? "Desactivar"
                                  : "Activar"
                              }
                              style={{
                                padding: "4px 6px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <i
                                className={`fas ${
                                  insumo.estado === "Activo"
                                    ? "fa-times"
                                    : "fa-check"
                                }`}
                              ></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                    {filteredInsumos.length} registros)
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content insumo-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-box me-2"></i>
                {modalMode === "create"
                  ? "Nuevo Insumo"
                  : modalMode === "edit"
                  ? "Editar Insumo"
                  : "Detalles del Insumo"}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={handleCancel}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <InsumoForm
                insumo={selectedInsumo}
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

export default ListaInsumos;
