import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import GradoForm from "../../components/admin/GradoForm";
import gradoService from "../../services/gradoService";
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

const ListaGrados = () => {
  const [grados, setGrados] = useState([]);
  const [filteredGrados, setFilteredGrados] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedGrado, setSelectedGrado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => {
    loadGrados();
  }, [filterEstado]);

  const loadGrados = async () => {
    try {
      setLoading(true);
      // Si hay un filtro de estado activo, pasar al servicio
      // Si no, obtener todos (el backend devolverá Activos por defecto)
      const gradosData = await gradoService.getAll(filterEstado || null);
      setGrados(gradosData);
      setFilteredGrados(gradosData);
    } catch (error) {
      showError("Error", "Error al cargar los grados");
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda y filtros
  useEffect(() => {
    let filtered = grados;

    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter((grado) =>
        grado.nombreGrado.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter((grado) => grado.estado === filterEstado);
    }

    setFilteredGrados(filtered);
    setCurrentPage(1);
  }, [searchQuery, grados, filterEstado]);

  // Paginación
  const totalPages = Math.ceil(filteredGrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGrados = filteredGrados.slice(startIndex, endIndex);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterEstado = (e) => {
    setFilterEstado(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterEstado("");
  };

  const openModal = (mode, grado = null) => {
    setModalMode(mode);
    setSelectedGrado(grado);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGrado(null);
    setModalMode("create");
  };

  const handleSaveGrado = async () => {
    try {
      // Cerrar el modal inmediatamente
      closeModal();

      // Resetear filtro y página para evitar inconsistencias
      // cuando el grado cambió de estado (Activo a Inactivo, etc)
      setFilterEstado("");
      setSearchQuery("");
      setCurrentPage(1);

      // Recargar la lista sin filtros
      try {
        const gradosData = await gradoService.getAll();
        setGrados(gradosData);
        setFilteredGrados(gradosData);
      } catch (error) {
        // Si falla la recarga, aún mostramos éxito porque la actualización fue exitosa
        console.warn("Advertencia al recargar grados:", error);
      }

      // Mostrar mensaje de éxito al final
      showSuccess(
        "Éxito",
        `Grado ${
          modalMode === "create" ? "creado" : "actualizado"
        } correctamente`,
      );
    } catch (error) {
      console.error("Error en handleSaveGrado:", error);
      // No mostrar error aquí, el mensaje de éxito ya se mostró
    }
  };

  const handleDelete = async (grado) => {
    // 1. Esperamos la confirmación del usuario
    const confirmed = await showConfirm(
      "Eliminar Grado",
      `¿Está seguro de eliminar el grado "${grado.nombreGrado}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Si el usuario acepta (true), procedemos con la eliminación
    if (confirmed) {
      try {
        await gradoService.delete(grado.idGrado);

        // Remover de forma inmediata de la tabla
        setGrados(grados.filter((g) => g.idGrado !== grado.idGrado));
        setFilteredGrados(
          filteredGrados.filter((g) => g.idGrado !== grado.idGrado),
        );

        // Limpiar estado si el grado eliminado era el seleccionado
        if (selectedGrado?.idGrado === grado.idGrado) {
          setSelectedGrado(null);
        }

        showSuccess("Grado eliminado correctamente");

        // Resetear filtros y recargar para sincronizar con backend
        setFilterEstado("");
        setSearchQuery("");
        setCurrentPage(1);

        setTimeout(async () => {
          const gradosData = await gradoService.getAll();
          setGrados(gradosData);
          setFilteredGrados(gradosData);
        }, 500);
      } catch (error) {
        /*console.error("Error al eliminar grado:", error);*/

        // Manejo de errores dinámico
        if (error.response?.data?.message) {
          showInfoError("Información", `Error: ${error.response.data.message}`);
        } else {
          showError("Error", "Error al eliminar el grado");
        }
      }
    }
    // Si no es confirmado, no entra al bloque y no sucede nada.
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
        <p>Cargando Grados...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-graduation-cap"></i>
            Gestión de Grados
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Administra los grados académicos del centro educativo
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={() => openModal("create")}
          >
            <i className="fas fa-plus me-1"></i>
            Nuevo Grado
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
                placeholder="Buscar por nombre del grado..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className={ContenidoStyle.filterActions}>
              <select
                className={ContenidoStyle.filterSelect}
                value={filterEstado}
                onChange={handleFilterEstado}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              {(searchQuery || filterEstado) && (
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

        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, filteredGrados.length)} de{" "}
            {filteredGrados.length} grados
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

        {/* Tabla */}
        <div className={TablaStyle.tableContainer}>
          {currentGrados.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron grados</h5>
              <p>No hay grados que coincidan con tu búsqueda.</p>
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
                      <th>Grado</th>
                      <th>Turno</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGrados.map((grado) => (
                      <tr key={grado.idGrado}>
                        <td>
                          <strong>{grado.idGrado}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{grado.nombreGrado}</strong>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={TablaStyle.turnoName}>
                              {grado.turno}
                            </span>
                            <span className={TablaStyle.turnoHours}>
                              ({grado.horaInicio} - {grado.horaFin})
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${TablaStyle.statusBadge} ${grado.estado.toLowerCase() === "activo" ? TablaStyle.activo : TablaStyle.inactivo}`}
                          >
                            {grado.estado}
                          </span>
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                              onClick={() => openModal("view", grado)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                              onClick={() => openModal("edit", grado)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                              onClick={() => handleDelete(grado)}
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

      {/* Modal para Grado */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    {modalMode === "create" && (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        Nuevo Grado
                      </>
                    )}
                    {modalMode === "edit" && (
                      <>
                        <i className="fas fa-edit me-2"></i>
                        Editar Grado
                      </>
                    )}
                    {modalMode === "view" && (
                      <>
                        <i className="fas fa-graduation-cap me-2"></i>
                        Detalles del Grado
                      </>
                    )}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <GradoForm
                    grado={selectedGrado}
                    mode={modalMode}
                    onSave={handleSaveGrado}
                    onCancel={closeModal}
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

export default ListaGrados;
