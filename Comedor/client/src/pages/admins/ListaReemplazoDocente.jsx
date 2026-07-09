import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReemplazoDocenteForm from "../../components/admin/ReemplazoDocenteForm";
import reemplazoDocenteService from "../../services/reemplazoDocenteService.js";
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      // console.log("ListaReemplazosGrados: Cargando grados...");
      const gradosData = await gradoService.getActivos();
      // console.log("ListaReemplazosGrados: Grados cargados:", gradosData);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
    } catch (error) {
      //console.error("Error al cargar grados:", error);
      showError("Error", "Error al cargar la lista de grados");
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
      // console.error("Error al cargar los reemplazos:", error);
      showError("Error", "Error al cargar la lista de reemplazos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reemplazos cuando cambien los filtros
  useEffect(() => {
    let filtered = reemplazos;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((reemplazo) => {
        const nombreCompletoSuplente =
          `${reemplazo.nombreSuplente} ${reemplazo.apellidoSuplente}`.toLowerCase();
        const nombreCompletoTitular =
          `${reemplazo.nombreTitular} ${reemplazo.apellidoTitular}`.toLowerCase();
        return (
          reemplazo.nombreSuplente.toLowerCase().includes(searchLower) ||
          reemplazo.apellidoSuplente.toLowerCase().includes(searchLower) ||
          nombreCompletoSuplente.includes(searchLower) ||
          reemplazo.dniSuplente.includes(searchTerm) ||
          reemplazo.nombreTitular.toLowerCase().includes(searchLower) ||
          reemplazo.apellidoTitular.toLowerCase().includes(searchLower) ||
          nombreCompletoTitular.includes(searchLower) ||
          reemplazo.dniTitular.includes(searchTerm) ||
          reemplazo.nombreGrado.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro por grado
    if (gradoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.nombreGrado === gradoFilter,
      );
    }

    // Filtro por estado
    if (estadoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.estado === estadoFilter,
      );
    }

    // Filtro por motivo
    if (motivoFilter) {
      filtered = filtered.filter(
        (reemplazo) => reemplazo.motivo === motivoFilter,
      );
    }

    setFilteredReemplazos(filtered);
  }, [searchTerm, gradoFilter, estadoFilter, motivoFilter, reemplazos]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradoFilter, estadoFilter, motivoFilter, reemplazos]);

  // Paginación
  const totalPages = Math.ceil(filteredReemplazos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReemplazos = filteredReemplazos.slice(startIndex, endIndex);

  // Ordenar reemplazos por ID
  const sortedReemplazos = filteredReemplazos.slice().sort((a, b) => {
    const idA = a.idReemplazoDocente || 0;
    const idB = b.idReemplazoDocente || 0;
    return idA - idB;
  });

  const paginatedReemplazos = sortedReemplazos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Operaciones CRUD
  const handleCreate = () => {
    setModalMode("create");
    setSelectedReemplazo(null);
    setShowModal(true);
  };

  const handleEdit = (reemplazo) => {
    setModalMode("edit");
    // Asegurar que el objeto tiene todos los datos necesarios
    const reemplazoCompleto = {
      ...reemplazo,
      idReemplazoDocente:
        reemplazo.idReemplazoDocente || reemplazo.id_reemplazoDocente,
      idPersona: reemplazo.idPersona || reemplazo.id_persona,
      idDocenteTitular:
        reemplazo.idDocenteTitular || reemplazo.id_docenteTitular,
      nombreGrado: reemplazo.nombreGrado || reemplazo.nombre_grado,
      cicloLectivo: reemplazo.cicloLectivo || reemplazo.ciclo_lectivo,
      fechaInicio: reemplazo.fechaInicio || reemplazo.fecha_inicio,
      fechaFin: reemplazo.fechaFin || reemplazo.fecha_fin,
      motivo: reemplazo.motivo,
      estado: reemplazo.estado,
      nombreSuplente: reemplazo.nombreSuplente,
      apellidoSuplente: reemplazo.apellidoSuplente,
      dniSuplente: reemplazo.dniSuplente,
      nombreTitular: reemplazo.nombreTitular,
      apellidoTitular: reemplazo.apellidoTitular,
      dniTitular: reemplazo.dniTitular,
    };
    setSelectedReemplazo(reemplazoCompleto);
    setShowModal(true);
  };

  const handleView = (reemplazo) => {
    setModalMode("view");
    // Asegurar que el objeto tiene todos los datos necesarios
    const reemplazoCompleto = {
      ...reemplazo,
      idReemplazoDocente:
        reemplazo.idReemplazoDocente || reemplazo.id_reemplazoDocente,
      idPersona: reemplazo.idPersona || reemplazo.id_persona,
      idDocenteTitular:
        reemplazo.idDocenteTitular || reemplazo.id_docenteTitular,
      nombreGrado: reemplazo.nombreGrado || reemplazo.nombre_grado,
      cicloLectivo: reemplazo.cicloLectivo || reemplazo.ciclo_lectivo,
      fechaInicio: reemplazo.fechaInicio || reemplazo.fecha_inicio,
      fechaFin: reemplazo.fechaFin || reemplazo.fecha_fin,
      motivo: reemplazo.motivo,
      estado: reemplazo.estado,
      nombreSuplente: reemplazo.nombreSuplente,
      apellidoSuplente: reemplazo.apellidoSuplente,
      dniSuplente: reemplazo.dniSuplente,
      nombreTitular: reemplazo.nombreTitular,
      apellidoTitular: reemplazo.apellidoTitular,
      dniTitular: reemplazo.dniTitular,
    };
    setSelectedReemplazo(reemplazoCompleto);
    setShowModal(true);
  };

  const handleDelete = async (reemplazoId, reemplazo) => {
    // 1. Confirmación para eliminar (Acción permanente)
    const confirmed = await showConfirm(
      "Eliminar Reemplazo",
      `¿Está seguro de eliminar "${reemplazo.nombreSuplente} ${reemplazo.apellidoSuplente}" del registro de reemplazo? Esta acción no se puede deshacer.`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        await reemplazoDocenteService.delete(reemplazoId);

        // 2. Refrescar y notificar
        await loadReemplazos();
        showSuccess(
          "Éxito",
          `El reemplazo de "${reemplazo.nombreSuplente} ${reemplazo.apellidoSuplente}" se ha eliminado correctamente`,
        );
      } catch (error) {
        const msg =
          error.response?.data?.message || "Error al eliminar el reemplazo.";
        showError("Error", msg);
      }
    }
  };

  const handleFinalizarReemplazo = async (reemplazoId, reemplazo) => {
    // 1. Confirmación para finalizar (Cierre de gestión)
    const confirmed = await showConfirm(
      "Finalizar Reemplazo",
      `¿Está seguro de marcar como finalizado el reemplazo de "${reemplazo.nombreSuplente} ${reemplazo.apellidoSuplente}" para el titular "${reemplazo.nombreTitular} ${reemplazo.apellidoTitular}"?`,
      "Sí, finalizar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        await reemplazoDocenteService.finalizar(reemplazoId);

        // 2. Refrescar y notificar
        await loadReemplazos();
        showSuccess(
          "Éxito",
          `Reemplazo de "${reemplazo.nombreSuplente} ${reemplazo.apellidoSuplente}" finalizado correctamente`,
        );
      } catch (error) {
        const msg =
          error.response?.data?.message || "Error al finalizar el reemplazo.";
        // Usamos showInfo si el error es una validación de negocio (ej. ya estaba finalizado)
        if (error.response?.data?.message) {
          showInfoError("Información", msg);
        } else {
          showError("Error", msg);
        }
      }
    }
  };

  const formatearMotivo = (motivo) => {
    if (!motivo) return "";
    return motivo
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSave = (result) => {
    setShowModal(false);
    setSelectedReemplazo(null);
    loadReemplazos();

    const motivoFormateado = formatearMotivo(result.motivo);

    if (modalMode === "create") {
      showSuccess(
        "Éxito",
        `✅ Reemplazo del docente creado correctamente!\n\nSuplente: ${result.nombreSuplente} ${result.apellidoSuplente}\nTitular: ${result.nombreTitular} ${result.apellidoTitular}\nGrado: ${result.nombreGrado}\nMotivo: ${motivoFormateado}`,
      );
    } else {
      showSuccess(
        "Éxito",
        "Reemplazo del docente ha sido actualizado correctamente!",
      );
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedReemplazo(null);
  };

  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    setCurrentPage(page);
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
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Reemplazos de Docentes...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>Reemplazos de Docentes</h1>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleCreate}
          >
            <i className="fas fa-plus me-1"></i>
            Asignar Reemplazo
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              placeholder="Buscar por suplente, titular, grado o DNI..."
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
              className={ContenidoStyle.filterSelect}
              value={motivoFilter}
              onChange={(e) => setMotivoFilter(e.target.value)}
            >
              <option value="">Todos los motivos</option>

              {motivosUnicos.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {formatearMotivo(motivo)}
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
        <div className={TablaStyle.paginationInfoBar}>
          <div className={TablaStyle.paginationInfo}>
            Mostrando {startIndex + 1} a{" "}
            {Math.min(endIndex, filteredReemplazos.length)} de{" "}
            {filteredReemplazos.length} docente
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
          {currentReemplazos.length === 0 ? (
            <div colSpan={12}>
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron reemplazos de docentes</h5>
                <p>
                  No hay reemplazos de docentes que coincidan con tu búsqueda.
                </p>
              </div>
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
                    {currentReemplazos.map((reemplazo) => (
                      <tr key={reemplazo.idReemplazoDocente}>
                        <td>
                          <strong>
                            {(currentPage - 1) * pageSize +
                              filteredReemplazos.indexOf(reemplazo) +
                              1}
                          </strong>
                        </td>
                        <td>
                          <div>
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
                          <div>
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
                          <span
                            className={`${TablaStyle.typeBadge} ${TablaStyle.teacherBadge}`}
                          >
                            {reemplazo.nombreGrado}
                          </span>
                          <small className="d-block text-muted">
                            Ciclo: {formatCicloLectivo(reemplazo.cicloLectivo)}
                          </small>
                        </td>
                        <td>
                          <div>
                            <strong>Inicio:</strong>{" "}
                            {new Date(
                              reemplazo.fechaInicio,
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Fin:</strong>{" "}
                            {reemplazo.fechaFin && reemplazo.fechaFin.trim()
                              ? new Date(
                                  reemplazo.fechaFin,
                                ).toLocaleDateString()
                              : "Sin definir"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${ContenidoStyle.badge} bg-danger text-white`}
                          >
                            {formatearMotivo(reemplazo.motivo)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${TablaStyle.statusBadge} 
                                ${
                                  reemplazo.estado.toLowerCase() === "activo"
                                    ? TablaStyle.activo
                                    : reemplazo.estado.toLowerCase() ===
                                        "inactivo"
                                      ? TablaStyle.inactivo
                                      : TablaStyle.finalizado
                                }
                            `}
                          >
                            {reemplazo.estado}
                          </span>
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                              onClick={() => handleView(reemplazo)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {reemplazo.estado !== "Finalizado" && (
                              <button
                                className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                                onClick={() => handleEdit(reemplazo)}
                                title="Editar reemplazo"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            )}
                            {reemplazo.estado === "Activo" && (
                              <button
                                className={`${TablaStyle.btnAction} ${TablaStyle.btnWarning}`}
                                onClick={() =>
                                  handleFinalizarReemplazo(
                                    reemplazo.idReemplazoDocente,
                                    reemplazo,
                                  )
                                }
                                title="Finalizar reemplazo"
                              >
                                <i className="fas fa-stop"></i>
                              </button>
                            )}
                            {reemplazo.estado !== "Finalizado" && (
                              <button
                                className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                                onClick={() =>
                                  handleDelete(
                                    reemplazo.idReemplazoDocente,
                                    reemplazo,
                                  )
                                }
                                title="Eliminar reemplazo"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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
            </div>
          )}
        </div>
      </div>

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
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ReemplazoDocenteForm
                    reemplazo={selectedReemplazo}
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

export default ListaReemplazosGrados;
