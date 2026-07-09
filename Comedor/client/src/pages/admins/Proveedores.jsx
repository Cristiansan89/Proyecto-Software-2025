import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ProveedorForm from "../../components/admin/ProveedorForm";
import AsignarInsumosForm from "../../components/admin/AsignarInsumosForm";
import proveedorService from "../../services/proveedorService";
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

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInsumosModal, setShowInsumosModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProveedores();
  }, []);

  useEffect(() => {
    filterProveedores();
  }, [proveedores, searchTerm, estadoFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedorService.getAll();
      setProveedores(data);
    } catch (error) {
      showError("Error", "Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const filterProveedores = () => {
    let filtered = proveedores;

    // Filtrar por estado
    if (estadoFilter !== "") {
      filtered = filtered.filter(
        (proveedor) => proveedor.estado === estadoFilter,
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
            insumo.nombreInsumo
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
          ),
      );
    }

    setFilteredProveedores(filtered);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, proveedores]);

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

  // Paginación
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProveedores = filteredProveedores.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
  };

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
    setSearchTerm("");
    setEstadoFilter("");
  };

  const handleDelete = async (proveedorId, proveedor) => {
    // 1. Confirmación personalizada asíncrona
    const confirmed = await showConfirm(
      "Eliminar Proveedor",
      `¿Está seguro de que desea eliminar el proveedor "${proveedor.razonSocial}"? Esta acción podría afectar el historial de pedidos vinculado.`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Proceder solo si el usuario confirmó
    if (confirmed) {
      try {
        await proveedorService.delete(proveedorId);

        // 3. Notificación de éxito y recarga
        // Cambiamos showInfo por showSuccess para una confirmación positiva estándar
        showSuccess(
          "Éxito",
          `El proveedor "${proveedor.razonSocial}" eliminado correctamente`,
        );

        await loadProveedores();
      } catch (error) {
        // 4. Manejo de errores detallado
        const errorMessage =
          error.response?.data?.message || "Error al eliminar el proveedor";

        // Si el error es 404, significa que el proveedor no existe (pudo haber sido eliminado por otro usuario)
        if (error.response?.status === 404) {
          showInfoError(
            "Proveedor no encontrado",
            "El proveedor que intenta eliminar no existe. Podría haber sido eliminado por otro usuario. Se recargará la lista.",
          );
          // Recargar la lista para sincronizar
          await loadProveedores();
        }
        // Si el error es una restricción de integridad (usuarios, insumos, etc. vinculados)
        else if (error.response?.status === 409) {
          showWarning(
            "No se puede eliminar",
            `${errorMessage}\n\nVerifique que el proveedor no tenga usuarios ni registros vinculados.`,
          );
        }
        // Si el error es validación o técnico
        else if (error.response?.status === 400) {
          showInfoError("Información", `⚠️ ${errorMessage}`);
        } else {
          showError("Error", errorMessage);
        }
      }
    }
  };

  const handleSaveProveedor = async (proveedorData) => {
    try {
      if (modalMode === "create") {
        await proveedorService.create(proveedorData);
        showSuccess("Éxito", "Proveedor creado correctamente");
      } else if (modalMode === "edit") {
        await proveedorService.update(
          selectedProveedor.idProveedor,
          proveedorData,
        );
        showSuccess("Éxito", "Proveedor actualizado correctamente");
      }

      setShowModal(false);
      setSelectedProveedor(null);
      loadProveedores();
    } catch (error) {
      // Los errores se manejan en el ProveedorForm, no mostrar error aquí
      // Solo relanzar si es necesario
      throw error;
    }
  };

  const handleSaveInsumosAsignados = async (insumosData) => {
    try {
      await proveedorService.asignarInsumos(selectedProveedor.idProveedor, {
        insumos: insumosData,
      });
      showSuccess("Éxito", "Insumos asignados correctamente");
      setShowInsumosModal(false);
      setSelectedProveedor(null);
      loadProveedores();
    } catch (error) {
      showError("Error", "Error al asignar insumos");
      if (error.response?.data?.message) {
        showInfoError("Información", `Error: ${error.response.data.message}`);
      } else {
        showError("Error", "Error al asignar insumos");
      }
    }
  };

  const formatCUIT = (cuit) => {
    if (!cuit) return "";
    const clearned = cuit.toString().replace(/\D/g, "");
    if (clearned.length === 11) {
      return `${clearned.slice(0, 2)}-${clearned.slice(2, 10)}-${clearned.slice(
        10,
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
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Proveedores...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-truck"></i>
            Gestión de Proveedores
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los proveedores y sus insumos disponibles
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.searchBar}>
              <input
                type="text"
                className={ContenidoStyle.searchInput}
                placeholder="Buscar por razón social, dirección, teléfono o insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={ContenidoStyle.filterActions}>
              <select
                className={ContenidoStyle.filterSelect}
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
              <div className="mt-2">
                {(searchTerm || estadoFilter) && (
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
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

        {/* Información de resultados y paginación */}
        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, filteredProveedores.length)} de{" "}
            {filteredProveedores.length} permisos
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

        {/* Tabla de Proveedores */}
        <div className={TablaStyle.tableContainer}>
          {currentProveedores.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron proveedores</h5>
              <p>No hay proveedores que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className={TablaStyle.scrollableTable}>
              <div className={TablaStyle.tableBodyScroll}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
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
                    {currentProveedores.map((proveedor, index) => (
                      <tr key={proveedor.idProveedor || `proveedor-${index}`}>
                        <td>
                          <strong>{startIndex + index + 1}</strong>
                        </td>
                        <td>
                          <h5>{proveedor.razonSocial}</h5>
                          <div>
                            <i className="fas fa-envelope me-1"></i>
                            {proveedor.mail}
                          </div>
                          <div>
                            <i className="fas fa-phone me-1"></i>
                            {proveedor.telefono}
                          </div>
                          <div className="text-muted">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {proveedor.direccion}
                          </div>
                        </td>
                        <td>
                          <div>
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
                                      <span className="text-muted">
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
                            className={`${TablaStyle.statusBadge} ${
                              proveedor.estado.toLowerCase() === "activo"
                                ? TablaStyle.activo
                                : TablaStyle.inactivo
                            }`}
                          >
                            {proveedor.estado}
                          </span>
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                              onClick={() => handleView(proveedor)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                              onClick={() => handleEdit(proveedor)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnAssign}`}
                              onClick={() => handleAssignInsumos(proveedor)}
                              title="Asignar Insumos"
                            >
                              <i className="fas fa-boxes"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                              onClick={() =>
                                handleDelete(proveedor.idProveedor, proveedor)
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
      </div>

      {/* Modal para Proveedor */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-truck me-2"></i>
                    {modalMode === "create" && "Nuevo Proveedor"}
                    {modalMode === "edit" && "Editar Proveedor"}
                    {modalMode === "view" && "Detalles del Proveedor"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCloseModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ProveedorForm
                    proveedor={selectedProveedor}
                    mode={modalMode}
                    onSave={handleSaveProveedor}
                    onCancel={handleCloseModal}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal para Asignar Insumos */}
      {showInsumosModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-boxes me-2"></i>
                    Asignar Insumos - {selectedProveedor?.razonSocial}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCloseInsumosModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <AsignarInsumosForm
                    proveedor={selectedProveedor}
                    onSave={handleSaveInsumosAsignados}
                    onCancel={handleCloseInsumosModal}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showModal ||
        (showInsumosModal &&
          createPortal(
            <div
              className={`${FormularioStyle.modalBackdrop}`}
              style={{ zIndex: 1040, pointerEvents: "all" }}
            ></div>,
            document.body,
          ))}
    </div>
  );
};

export default Proveedores;
