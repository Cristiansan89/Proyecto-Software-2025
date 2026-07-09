import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import {
  showSuccess,
  showError,
  showConfirm,
  showWarning,
} from "../../utils/alertService";
import proveedorService from "../../services/proveedorService";
import AddInsumosForm from "../../components/proveedor/AddInsumosForm";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const GestionProductos = () => {
  // ==================== Estado ====================
  const navigate = useNavigate();
  const { user } = useAuth();
  const [insumosProveedor, setInsumosProveedor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [proveedorData, setProveedorData] = useState(null);

  // ==================== useEffect - Cargar Insumos ====================
  useEffect(() => {
    if (user?.idProveedor) {
      loadInsumosProveedor();
      // Establecer datos del proveedor actual para pasar al formulario
      setProveedorData(user);
    }
  }, [user]);

  // ==================== Funciones Principales ====================
  /**
   * Carga los insumos del proveedor actual desde la API
   * Conecta con la tabla proveedorinsumo de la BD
   * Expected API Response: GET /api/proveedores/{idProveedor}/insumos
   * Returns: Array de objetos con propiedades:
   *   - idProvedorInsumo (number)
   *   - idInsumo (number)
   *   - nombreInsumo (string)
   *   - categoria (string)
   *   - descripcion (string, opcional)
   *   - calificacion (string, opcional)
   */
  const loadInsumosProveedor = async () => {
    try {
      setLoading(true);

      // Llamada real a la API usando proveedorService
      if (user?.idProveedor) {
        const insumosAsignados = await proveedorService.getInsumosAsignados(
          user.idProveedor,
        );
        setInsumosProveedor(insumosAsignados || []);
      }
    } catch (error) {
      console.error("Error al cargar insumos del proveedor:", error);
      showError(
        "Error",
        "No se pudieron cargar los insumos. Intenta nuevamente.",
      );
      setInsumosProveedor([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre el modal para agregar nuevos insumos
   */
  const handleAgregarInsumo = () => {
    setShowModal(true);
  };

  /**
   * Maneja el guardado de insumos desde el formulario
   */
  const handleSaveInsumos = async (insumosToSave) => {
    try {
      // Llamada real a la API para guardar
      if (user?.idProveedor) {
        await proveedorService.asignarInsumos(user.idProveedor, insumosToSave);
      }

      showSuccess("Éxito", "Insumos actualizados correctamente");
      setShowModal(false);
      await loadInsumosProveedor(); // Recargar la lista
    } catch (error) {
      console.error("Error al guardar insumos:", error);
      showError("Error", "No se pudieron guardar los insumos");
    }
  };

  /**
   * Elimina un insumo del catálogo del proveedor
   * TODO: Reemplazar con llamada real a la API
   * Expected API: DELETE /api/proveedores/insumos/{idInsumo}
   */
  const handleQuitarInsumo = async (idProvedorInsumo) => {
    const insumo = insumosProveedor.find(
      (i) => i.idProvedorInsumo === idProvedorInsumo,
    );
    const nombreInsumo = insumo?.nombreInsumo || "el insumo";

    // Confirmación con SweetAlert2
    const confirmado = await showConfirm(
      "Eliminar Insumo",
      `¿Está seguro de que desea remover "${nombreInsumo}" de su catálogo?`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (!confirmado) return;

    try {
      // Llamada real a la API para eliminar
      if (user?.idProveedor) {
        await proveedorService.removerInsumo(
          user.idProveedor,
          idProvedorInsumo,
        );
      }

      // Actualizar estado local
      setInsumosProveedor((prevState) =>
        prevState.filter(
          (insumo) => insumo.idProvedorInsumo !== idProvedorInsumo,
        ),
      );

      showSuccess(
        "Éxito",
        `"${nombreInsumo}" ha sido removido de su catálogo.`,
      );
    } catch (error) {
      console.error("Error al eliminar insumo:", error);

      if (error.response?.status === 409) {
        showWarning(
          "No se puede eliminar",
          "Este insumo está siendo utilizado en pedidos activos. Intenta más tarde.",
        );
      } else {
        showError(
          "Error",
          "No se pudo eliminar el insumo. Intenta nuevamente.",
        );
      }
    }
  };

  // ==================== Paginación ====================
  const totalPages = Math.ceil(insumosProveedor.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const insumosActuales = insumosProveedor.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  // ==================== Render - Loading ====================
  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando sus insumos...</p>
      </div>
    );
  }

  // ==================== Render - Contenido Principal ====================
  return (
    <div className={ContenidoStyle.pageContent}>
      {/* ===== HEADER DE LA PÁGINA ===== */}
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-boxes"></i>
            Mis Insumos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Gestiona el catálogo de insumos que provees a la empresa
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleAgregarInsumo}
            title="Agregar nuevos insumos"
          >
            <i className="fas fa-plus"></i> Agregar Insumo
          </button>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className={ContenidoStyle.tabContent}>
        {/* Información de Paginación */}
        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, insumosProveedor.length)} de{" "}
            {insumosProveedor.length} insumos
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

        {/* TABLA DE INSUMOS O ESTADO VACÍO */}
        <div className={TablaStyle.tableContainer}>
          {insumosActuales.length === 0 ? (
            // ===== ESTADO VACÍO =====
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-inbox ${TablaStyle.emptyIcon}`}></i>
              <h5>No tiene insumos asignados</h5>
              <p>
                Comienza agregando insumos a tu catálogo para que la empresa
                pueda consultarlos.
              </p>
              <button
                className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo} mt-3`}
                onClick={handleAgregarInsumo}
              >
                <i className="fas fa-plus"></i> Agregar Primer Insumo
              </button>
            </div>
          ) : (
            // ===== TABLA DE DATOS =====
            <table className={`${TablaStyle.tableData} table table-striped`}>
              <thead className={TablaStyle.tableHeaderFixed}>
                <tr>
                  <th width="10%">#</th>
                  <th width="40%">Nombre del Insumo</th>
                  <th width="30%">Categoría</th>
                  <th width="20%">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumosActuales.map((insumo, index) => (
                  <tr key={insumo.idInsumo || index}>
                    {/* Índice */}
                    <td>
                      <strong>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </strong>
                    </td>

                    {/* Nombre del Insumo (en negrita) */}
                    <td title={insumo.nombreInsumo}>
                      <strong>{insumo.nombreInsumo}</strong>
                    </td>

                    {/* Categoría con Badge */}
                    <td>
                      <span
                        className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeInfo}`}
                      >
                        {insumo.categoria || "Sin categoría"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ width: "100px" }}>
                      <div className={TablaStyle.actionButtons}>
                        <button
                          className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                          onClick={() =>
                            handleQuitarInsumo(insumo.idProvedorInsumo)
                          }
                          title="Remover insumo"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINACIÓN - Solo mostrar si hay datos y hay múltiples páginas */}
        {insumosProveedor.length > 0 && totalPages > 1 && (
          <div className={TablaStyle.pagination}>
            <nav>
              <ul className="pagination mb-0">
                {/* Botón Anterior */}
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                </li>

                {/* Números de Página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ),
                )}

                {/* Botón Siguiente */}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* MODAL - Agregar/Editar Insumos */}
      {showModal &&
        createPortal(
          <div
            className={`modal d-block ${showModal ? "show" : ""}`}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-plus-circle me-2"></i>
                    Agregar Insumos
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <AddInsumosForm
                    proveedor={proveedorData}
                    onSave={handleSaveInsumos}
                    onCancel={() => setShowModal(false)}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

// Función auxiliar para obtener color según calificación
const getCalificacionColor = (calificacion) => {
  const colores = {
    Excelente: "success",
    Bueno: "info",
    Regular: "warning",
    Malo: "danger",
  };
  return colores[calificacion] || "secondary";
};

export default GestionProductos;
