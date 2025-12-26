import { useState, useEffect } from "react";
import ProveedorForm from "../../components/admin/ProveedorForm";
import AsignarInsumosForm from "../../components/admin/AsignarInsumosForm";
import proveedorService from "../../services/proveedorService";

const ListaProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInsumosModal, setShowInsumosModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadProveedores();
  }, []);

  useEffect(() => {
    filterProveedores();
  }, [proveedores, searchTerm, estadoFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProveedores = async () => {
    console.log("ListaProveedores: Iniciando loadProveedores");
    try {
      setLoading(true);
      const data = await proveedorService.getAll();
      console.log("ListaProveedores: Datos recibidos:", data);
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      alert("Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const filterProveedores = () => {
    let filtered = proveedores;

    // Filtrar por estado
    if (estadoFilter !== "todos") {
      filtered = filtered.filter(
        (proveedor) => proveedor.estado === estadoFilter
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (proveedor) =>
          proveedor.razonSocial
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          proveedor.direccion
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          proveedor.telefono?.includes(searchTerm) ||
          proveedor.insumos?.some((insumo) =>
            insumo.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredProveedores(filtered);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, proveedores]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProveedores.length / pageSize)
  );

  // Ordenar proveedores por id (numérico si corresponde, si no lexicográfico)
  const sortedProveedores = filteredProveedores.slice().sort((a, b) => {
    const ia = String(a.idProveedor ?? "");
    const ib = String(b.idProveedor ?? "");
    const onlyDigits = /^\d+$/;
    if (onlyDigits.test(ia) && onlyDigits.test(ib)) {
      return Number(ia) - Number(ib);
    }
    return ia.localeCompare(ib);
  });

  const paginatedProveedores = sortedProveedores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreate = () => {
    setSelectedProveedor(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (proveedor) => {
    setSelectedProveedor(proveedor);
    setModalMode("view");
    setShowModal(true);
  };

  const handleAssignInsumos = (proveedor) => {
    setSelectedProveedor(proveedor);
    setShowInsumosModal(true);
  };

  const handleDelete = async (proveedorId) => {
    if (window.confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      try {
        await proveedorService.delete(proveedorId);
        alert("Proveedor eliminado correctamente");
        loadProveedores();
      } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        const errorMessage =
          error.response?.data?.message || "Error al eliminar el proveedor";
        alert(`⚠️ ${errorMessage}`);
      }
    }
  };

  const handleSaveProveedor = async (proveedorData) => {
    try {
      if (modalMode === "create") {
        await proveedorService.create(proveedorData);
        alert("Proveedor creado correctamente");
      } else if (modalMode === "edit") {
        await proveedorService.update(
          selectedProveedor.idProveedor,
          proveedorData
        );
        alert("Proveedor actualizado correctamente");
      }

      setShowModal(false);
      setSelectedProveedor(null);
      loadProveedores();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      // Los errores ya se manejan en el ProveedorForm
    }
  };

  const handleSaveInsumosAsignados = async (insumosData) => {
    try {
      await proveedorService.asignarInsumos(selectedProveedor.idProveedor, {
        insumos: insumosData,
      });
      alert("Insumos asignados correctamente");
      setShowInsumosModal(false);
      setSelectedProveedor(null);
      loadProveedores();
    } catch (error) {
      console.error("Error al asignar insumos:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error al asignar insumos");
      }
    }
  };

  const formatCUIT = (cuit) => {
    if (!cuit) return "";
    const clearned = cuit.toString().replace(/\D/g, "");
    if (clearned.length === 11) {
      return `${clearned.slice(0, 2)}-${clearned.slice(2, 10)}-${clearned.slice(
        10
      )}`;
    }

    return cuit;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProveedor(null);
  };

  const handleCloseInsumosModal = () => {
    setShowInsumosModal(false);
    setSelectedProveedor(null);
  };

  const getCalificacionBadge = (calificacion) => {
    const badges = {
      Excelente: "bg-success",
      Aceptable: "bg-warning",
      "Poco Eficiente": "bg-danger",
    };
    return badges[calificacion] || "bg-secondary";
  };

  const getEstadoBadge = (estado) => {
    return estado === "Activo" ? "bg-success" : "bg-secondary";
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
      <div className="page-header mb-3">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-truck me-2"></i>
            Gestión de Proveedores
          </h1>
          <p className="page-subtitle">
            Administra los proveedores y sus insumos disponibles
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary-new" onClick={handleCreate}>
            <i className="fas fa-plus me-2"></i>
            Nuevo Proveedor
          </button>
        </div>
      </div>
      <div className="tab-content">
        {/* Filtros y Búsqueda */}
        <div className="page-header mb-3">
          <div className="header-left">
            <div className="filters-section">
              <div className="search-bar">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Buscar por razón social, dirección, teléfono o insumos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-actions">
                <select
                  className="filter-select"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
              </div>
            </div>

            {/* Información de resultados y paginación */}
            <div className="results-info">
              <div className="results-count">
                Mostrando {paginatedProveedores.length} de{" "}
                {filteredProveedores.length} proveedores{" "}
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

        {/* Tabla de Proveedores */}

        <div className="table-container">
          <div className="scrollable-table">
            <div className="table-body-scroll">
              <table className="table table-striped data-table">
                <thead className="table-header-fixed">
                  <tr>
                    <th>#</th>
                    <th>Proveedor</th>
                    <th>CUIT</th>
                    <th>Insumos Asignados</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProveedores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">
                        No se encontraron proveedores
                      </td>
                    </tr>
                  ) : (
                    paginatedProveedores.map((proveedor, index) => (
                      <tr key={proveedor.idProveedor || `proveedor-${index}`}>
                        <td>
                          {/* Mostrar un id entero basado en la posición global (no por página) */}
                          <strong>
                            {(currentPage - 1) * pageSize + index + 1}
                          </strong>
                          {/* Si necesitas ver el UUID original, descomenta la línea siguiente */}
                          {/* <div className="text-muted small">{proveedor.idProveedor}</div> */}
                        </td>
                        <td>
                          <div className="item-info">
                            <div>
                              <div className="item-name">
                                <h5>{proveedor.razonSocial}</h5>
                              </div>
                              <div>
                                <i className="fas fa-phone me-1"></i>
                                {proveedor.telefono}
                              </div>
                              <div className="item-detail text-muted">
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {proveedor.direccion}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <h6>{formatCUIT(proveedor.CUIT)}</h6>
                          </div>
                        </td>
                        <td>
                          <div>
                            {proveedor.insumos.length > 0 ? (
                              <div>
                                {proveedor.insumos
                                  .slice(0, 5)
                                  .map((insumo, index) => (
                                    <div key={index}>
                                      <span className="insumo-name">
                                        {insumo.nombreInsumo}
                                      </span>
                                    </div>
                                  ))}
                                {proveedor.insumos.length > 5 && (
                                  <small className="text-muted">
                                    +{proveedor.insumos.length - 5} más
                                  </small>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">
                                Sin insumos asignados
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getEstadoBadge(
                              proveedor.estado
                            )}`}
                          >
                            {proveedor.estado}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleView(proveedor)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(proveedor)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-action btn-assign"
                              onClick={() => handleAssignInsumos(proveedor)}
                              title="Asignar Insumos"
                            >
                              <i className="fas fa-boxes"></i>
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() =>
                                handleDelete(proveedor.idProveedor)
                              }
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
                      {filteredProveedores.length} registros)
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

            {filteredProveedores.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-search empty-icon"></i>
                <h5>No se encontraron proveedores</h5>
                <p>No hay proveedores que coincidan con tu búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Proveedor */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-proveedores-insumos proveedor-modal">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-truck me-2"></i>
                {modalMode === "create" && "Nuevo Proveedor"}
                {modalMode === "edit" && "Editar Proveedor"}
                {modalMode === "view" && "Detalles del Proveedor"}
              </h5>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <ProveedorForm
                proveedor={selectedProveedor}
                mode={modalMode}
                onSave={handleSaveProveedor}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Asignar Insumos */}
      {showInsumosModal && (
        <div className="modal-overlay">
          <div className="modal-content insumos-asignacion-modal">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-boxes me-2"></i>
                Asignar Insumos - {selectedProveedor?.razonSocial}
              </h5>
              <button className="modal-close" onClick={handleCloseInsumosModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <AsignarInsumosForm
                proveedor={selectedProveedor}
                onSave={handleSaveInsumosAsignados}
                onCancel={handleCloseInsumosModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaProveedores;
