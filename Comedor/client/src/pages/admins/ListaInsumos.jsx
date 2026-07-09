import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import InsumoForm from "../../components/admin/InsumoForm";
import { formatNumeroAR } from "../../utils/formatNumero";
import insumoService from "../../services/insumoService";
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

const ListaInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    //console.log("ListaInsumos: Iniciando loadInsumos");
    try {
      setLoading(true);
      const data = await insumoService.getAll();
      //console.log("ListaInsumos: Datos recibidos:", data);
      setInsumos(data);
    } catch (error) {
      // console.error("Error al cargar insumos:", error);
      showError("Error", "Error al cargar los insumos");
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
      statusFilter === ""
        ? insumo.estado === "Activo"
        : insumo.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, insumos]);

  // Paginación
  const totalPages = Math.ceil(filteredInsumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInsumos = filteredInsumos.slice(startIndex, endIndex);

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
    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Insumo",
      `¿Está seguro de eliminar el insumo "${insumo.nombreInsumo}"? Esta acción podría afectar los registros de inventario actuales.`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        // 2. Llamada al servicio
        await insumoService.delete(insumo.idInsumo);

        // 3. Feedback visual de éxito
        showSuccess("Éxito", "Insumo eliminado correctamente");

        // 4. Recarga de la lista
        await loadInsumos();
      } catch (error) {
        // 5. Manejo de errores detallado
        const msg =
          error.response?.data?.message || "Error al eliminar el insumo";
        const relationsData = error.response?.data?.details;

        // Si el error es por relaciones activas
        if (error.response?.status === 409) {
          let detailsMsg = msg;

          // Si tenemos detalles de las relaciones, construir mensaje más claro
          if (relationsData) {
            let relationsList = [];

            if (relationsData.recetas && relationsData.recetas.length > 0) {
              const recetasNames = relationsData.recetas
                .map((r) => r.nombreReceta)
                .join(", ");
              relationsList.push(`📋 Recetas: ${recetasNames}`);
            }

            if (
              relationsData.proveedores &&
              relationsData.proveedores.length > 0
            ) {
              const proveedoresNames = relationsData.proveedores
                .map((p) => p.razonSocial)
                .join(", ");
              relationsList.push(`🏪 Proveedores: ${proveedoresNames}`);
            }

            if (relationsList.length > 0) {
              detailsMsg = `No se puede eliminar porque está asociado a:\n\n${relationsList.join(".\n")}\n\n Alternativa: Usa el botón de desactivar (✗) para marcarlo como inactivo sin perder el historial.`;
            }
          } else {
            detailsMsg = `${msg}\n\n Alternativa: Usa el botón de desactivar (✗) para marcarlo como inactivo sin perder el historial.`;
          }

          showWarning("No se puede eliminar", detailsMsg);
        } else if (error.response?.data?.message) {
          showInfo("Información", `Error: ${msg}`);
        } else {
          showError("Error", msg);
        }
      }
    }
  };

  const handleChangeStatus = async (insumo, nuevoEstado) => {
    try {
      const updated = { ...insumo, estado: nuevoEstado };
      await insumoService.update(insumo.idInsumo, updated);
      showSuccess(
        "Éxito",
        `Estado del Insumo ${insumo.nombreInsumo} actualizado a ${nuevoEstado}`,
      );
      loadInsumos();
    } catch (error) {
      //console.error("Error al cambiar estado:", error);
      showError("Error", "Error al cambiar el estado del insumo");
      if (error.response?.data?.message) {
        showInfoError("Información", `Error: ${error.response.data.message}`);
      } else {
        showError("Error", "Error al cambiar el estado del insumo");
      }
    }
  };

  const handleSave = async (savedInsumo) => {
    try {
      // Si llegamos aquí sin errores, significa que el guardado fue exitoso
      showSuccess(
        "Éxito",
        `Insumo ${
          modalMode === "create" ? "creado" : "actualizado"
        } correctamente`,
      );
      setShowModal(false);
      setSelectedInsumo(null);
      loadInsumos();
    } catch (error) {
      // Los errores ya se manejan en el InsumoForm
      // Solo relanzar si es necesario
      throw error;
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedInsumo(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
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
    if (value === null || value === undefined) return "0,000";
    const n = Number(value);
    if (isNaN(n)) return String(value);
    return formatNumeroAR(n);
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Insumos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-boxes"></i>
            Gestión de Insumos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los insumos disponibles en el comedor
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus"></i> Nuevo Insumo
          </button>
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.searchBar}>
              <input
                type="text"
                className={ContenidoStyle.searchInput}
                placeholder="Buscar por nombre, descripción, unidad o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={ContenidoStyle.filterActions}>
              <select
                className={ContenidoStyle.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
              <div className="mt-2">
                {(searchTerm || statusFilter) && (
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

          {/* Selector de tamaño de página y Paginación */}
          <div className={TablaStyle.paginationInfoBar}>
            <div className={TablaStyle.paginationInfo}>
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredInsumos.length)} de{" "}
              {filteredInsumos.length} insumos
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

        {/* Tabla de Insumos */}
        <div className={TablaStyle.tableContainer}>
          {currentInsumos.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron insumos</h5>
              <p>No hay insumos que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <table className={`${TablaStyle.tableData} table table-striped`}>
              <thead className={TablaStyle.tableHeaderFixed}>
                <tr>
                  <th>#</th>
                  <th>Insumo</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Unidad</th>
                  <th>Stock Mín.</th>
                  <th>Stock Actual</th>
                  <th>Stock Máx.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentInsumos.map((insumo, index) => {
                  const stockStatus = getStockStatus(insumo);
                  return (
                    <tr key={insumo.idInsumo || index}>
                      <td>
                        <strong>
                          {(currentPage - 1) * pageSize + index + 1}
                        </strong>
                      </td>
                      <td
                        title={insumo.nombreInsumo}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {insumo.nombreInsumo || "-"}
                      </td>
                      <td
                        title={insumo.descripcion}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {insumo.descripcion}
                      </td>
                      <td style={{ fontSize: "0.75rem" }}>
                        {insumo.categoria}
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
                          className={`${TablaStyle.statusBadge} ${
                            insumo.estado.toLowerCase() === "activo"
                              ? TablaStyle.activo
                              : TablaStyle.inactivo
                          }`}
                        >
                          {insumo.estado || ""}
                        </span>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                            onClick={() => handleView(insumo)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleEdit(insumo)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() => handleDelete(insumo)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${
                              insumo.estado === "Activo"
                                ? TablaStyle.btnDisable
                                : TablaStyle.btnEnable
                            }`}
                            onClick={() =>
                              handleChangeStatus(
                                insumo,
                                insumo.estado === "Activo"
                                  ? "Inactivo"
                                  : "Activo",
                              )
                            }
                            title={
                              insumo.estado === "Activo"
                                ? "Desactivar"
                                : "Activar"
                            }
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
                })}
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

      {/* Modal */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-box me-2"></i>
                    {modalMode === "create"
                      ? "Nuevo Insumo"
                      : modalMode === "edit"
                        ? "Editar Insumo"
                        : "Detalles del Insumo"}
                  </h5>
                  <button
                    type="button"
                    className={FormularioStyle.modalClose}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <InsumoForm
                    insumo={selectedInsumo}
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

export default ListaInsumos;
