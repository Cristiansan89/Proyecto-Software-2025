import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import ParametrosForm from "../../components/admin/ParametrosForm";
import Swal from "sweetalert2";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const Parametros = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parametros, setParametros] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "",
  });
  const [modalParametro, setModalParametro] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    nombreParametro: "",
    valor: "",
    tipoParametro: "Texto",
    estado: "Activo",
  });
  const [mensaje, setMensaje] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    cargarParametros();
  }, []);

  const cargarParametros = async () => {
    try {
      setLoading(true);
      const response = await API.get("/parametros-sistemas");
      setParametros(response.data || []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error al cargar los parámetros",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChangeName = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    if (!formData.nombreParametro.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validación",
        text: "El nombre del parámetro es obligatorio",
        confirmButtonColor: "#d33",
      });
      return false;
    }
    if (!formData.valor.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validación",
        text: "El valor del parámetro es obligatorio",
        confirmButtonColor: "#d33",
      });
      return false;
    }
    return true;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setServerError(null);
      if (editandoId) {
        // Actualizar
        await API.patch(`/parametros-sistemas/${editandoId}`, {
          nombreParametro: formData.nombreParametro,
          valor: formData.valor,
          tipoParametro: formData.tipoParametro,
          estado: formData.estado,
        });

        // Cerrar modal inmediatamente
        setModalParametro(false);
        setFormData({
          nombreParametro: "",
          valor: "",
          tipoParametro: "Texto",
          estado: "Activo",
        });
        setEditandoId(null);
        setMensaje(null);

        // Mostrar sweetalert de éxito después de cerrar
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Parámetro actualizado correctamente",
          confirmButtonColor: "#3085d6",
        });

        cargarParametros();
      } else {
        // Crear
        await API.post("/parametros-sistemas", {
          nombreParametro: formData.nombreParametro,
          valor: formData.valor,
          tipoParametro: formData.tipoParametro,
          estado: formData.estado,
        });

        // Cerrar modal inmediatamente
        setModalParametro(false);
        setFormData({
          nombreParametro: "",
          valor: "",
          tipoParametro: "Texto",
          estado: "Activo",
        });
        setEditandoId(null);
        setMensaje(null);

        // Mostrar sweetalert de éxito después de cerrar
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Parámetro creado correctamente",
          confirmButtonColor: "#3085d6",
        });

        cargarParametros();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al guardar el parámetro";
      // Detectar error de duplicación (409 Conflict)
      if (
        error.response?.status === 409 ||
        errorMessage.toLowerCase().includes("ya existe")
      ) {
        setServerError(errorMessage);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#d33",
        });
      }
    }
    setShowModal(false);
  };

  const handleEditar = (parametro) => {
    setFormData({
      nombreParametro: parametro.nombreParametro,
      valor: parametro.valor,
      tipoParametro: parametro.tipoParametro || "Texto",
      estado: parametro.estado,
    });
    setEditandoId(parametro.id_parametro);
    setServerError(null);
    setMensaje(null);
    setModalParametro(true);
    setShowModal(true);
  };

  const handleEliminar = async (parametro) => {
    // 1. Confirmación asíncrona con sweetalert
    const result = await Swal.fire({
      title: "Eliminar Parámetro",
      text: `¿Está seguro de que desea eliminar el parámetro "${parametro.nombreParametro}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    // 2. Si el usuario confirma, procedemos
    if (result.isConfirmed) {
      try {
        await API.delete(`/parametros-sistemas/${parametro.id_parametro}`);

        // Feedback de éxito
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: `Parámetro "${parametro.nombreParametro}" eliminado correctamente`,
          confirmButtonColor: "#3085d6",
        });

        cargarParametros();
      } catch (error) {
        // Feedback de error
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al eliminar el parámetro "${parametro.nombreParametro}"`,
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const handleNuevo = () => {
    setFormData({
      nombreParametro: "",
      valor: "",
      tipoParametro: "Texto",
      estado: "Activo",
    });
    setEditandoId(null);
    setServerError(null);
    setMensaje(null);
    setModalParametro(true);
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setModalParametro(false);
    setEditandoId(null);
    setServerError(null);
    setFormData({
      nombreParametro: "",
      valor: "",
      tipoParametro: "Texto",
      estado: "Activo",
    });
    setMensaje(null);
    setShowModal(false);
  };

  const clearFilters = () => {
    setFiltros((prev) => ({
      ...prev,
      busqueda: "",
      estado: "",
    }));
  };

  // Filtrar parámetros
  const parametrosFiltrados = parametros.filter((param) => {
    const matchBusqueda =
      !filtros.busqueda ||
      param.nombreParametro
        .toLowerCase()
        .includes(filtros.busqueda.toLowerCase()) ||
      param.valor.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const matchEstado = !filtros.estado || param.estado === filtros.estado;

    return matchBusqueda && matchEstado;
  });

  // Ordenar parámetros por ID desde el último (descendente)
  const parametrosOrdenados = parametrosFiltrados.slice().sort((a, b) => {
    const idA = a.id_parametro || 0;
    const idB = b.id_parametro || 0;
    return idA - idB; // Descendente: último ID primero
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.busqueda, filtros.estado]);

  // Paginación
  const totalPages = Math.ceil(parametrosOrdenados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentParametros = parametrosOrdenados.slice(startIndex, endIndex);

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
        <p>Cargando Parámetros del Sistema...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>Gestión de Parámetros</h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleNuevo}
          >
            <i className="fas fa-plus me-1"></i>
            Nuevo Parámetro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              className={ContenidoStyle.searchInput}
              placeholder="Buscar parámetro..."
              value={filtros.busqueda}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  busqueda: e.target.value,
                }))
              }
            />
          </div>
          <div className={ContenidoStyle.filterActions}>
            <select
              className={ContenidoStyle.filterSelect}
              value={filtros.estado}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  estado: e.target.value,
                }))
              }
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            {(filtros.busqueda || filtros.estado) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                <i className="fas fa-times"></i> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={TablaStyle.paginationInfoBar}>
        <div className={TablaStyle.paginationInfo}>
          Mostrando {startIndex + 1} a{" "}
          {Math.min(endIndex, currentParametros.length)} de{" "}
          {currentParametros.length} parámetros
        </div>
        <div className={TablaStyle.itemsPerPage}>
          <label>
            <strong>Registros por página:</strong>
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
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

      <div className={TablaStyle.tableContainer}>
        {currentParametros.length === 0 ? (
          <div colSpan={12}>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron parámetros</h5>
              <p>No hay parámetros que coincidan con tu búsqueda.</p>
            </div>
          </div>
        ) : (
          <table className={`${TablaStyle.tableData} table table-striped`}>
            <thead className={TablaStyle.tableHeaderFixed}>
              <tr>
                <th width="2%">#</th>
                <th width="25%">Nombre</th>
                <th width="28%">Valor</th>
                <th width="15%">Tipo</th>
                <th width="15%">Estado</th>
                <th width="15%">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentParametros.map((param, index) => (
                <tr key={param.id_parametro || `param-${index}`}>
                  <td>
                    <strong>{param.id_parametro}</strong>
                  </td>
                  <td className="fw-500">{param.nombreParametro}</td>
                  <td>
                    <code
                      className={`${ContenidoStyle.badge} bg-warning text-black`}
                    >
                      {param.valor}
                    </code>
                  </td>
                  <td>
                    <span className={`${ContenidoStyle.badge} bg-info`}>
                      {param.tipoParametro || "Texto"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${TablaStyle.statusBadge} ${
                        param.estado.toLowerCase() === "activo"
                          ? TablaStyle.activo
                          : TablaStyle.inactivo
                      }`}
                    >
                      {param.estado}
                    </span>
                  </td>
                  <td>
                    <div className={TablaStyle.actionButtons}>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                        onClick={() => handleEditar(param)}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                        onClick={() => handleEliminar(param)}
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
        )}

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

      {/* Modal para crear nuevo parametros */}
      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-user-plus me-2"></i>
                    Nuevo Parámetro
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCerrarModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <ParametrosForm
                    modalParametro={modalParametro}
                    editandoId={editandoId}
                    formData={formData}
                    onCerrarModal={handleCerrarModal}
                    onGuardar={handleGuardar}
                    onInputChange={handleInputChange}
                    onInputChangeName={handleInputChangeName}
                    serverError={serverError}
                    onServerErrorClear={() => setServerError(null)}
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

export default Parametros;
