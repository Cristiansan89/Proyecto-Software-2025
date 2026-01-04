import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import ParametrosForm from "../../components/admin/ParametrosForm";
import Swal from "sweetalert2";
// import ConfiguracionServiciosAutomaticos from "../../components/ConfigServiciosAuto";
import "../../styles/Parametros.css";

const Parametros = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parametros, setParametros] = useState([]);
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
    return idB - idA; // Descendente: último ID primero
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.busqueda, filtros.estado]);

  // Paginación
  const totalPages = Math.ceil(parametrosOrdenados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const parametrosPaginados = parametrosOrdenados.slice(
    startIndex,
    startIndex + pageSize
  );

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid parametros-container pt-1">
      {/* Tabs para navegación */}
      {/* Pestaña de Parámetros */}
      {true && (
        <div role="tabpanel">
          <div className="page-header mb-3">
            <div className="header-left">
              <h2 className="page-title-sub">Gestión de Parámetros</h2>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary-new" onClick={handleNuevo}>
                <i className="fas fa-plus"></i>
                Nuevo Parámetro
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-light">
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
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
                <div className="col-md-3">
                  <select
                    className="form-select"
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
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 text-nowrap">
                      <small>Registros:</small>
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
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
            </div>

            <div className="card-body">
              {parametrosPaginados.length === 0 ? (
                <div className="alert alert-light text-center">
                  No hay parámetros disponibles
                </div>
              ) : (
                <div className="table-container">
                  <table className="table table-striped data-table">
                    <thead className="table-header-fixed">
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
                      {parametrosPaginados.map((param) => (
                        <tr key={param.id_parametro}>
                          <td>
                            <strong>{param.id_parametro}</strong>
                          </td>
                          <td className="fw-500">{param.nombreParametro}</td>
                          <td>
                            <code className="bg-light p-2 rounded">
                              {param.valor}
                            </code>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {param.tipoParametro || "Texto"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                param.estado === "Activo"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {param.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEditar(param)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleEliminar(param)}
                              title="Eliminar"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="card-footer bg-light">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <small className="text-muted">
                      Mostrando {startIndex + 1} a{" "}
                      {Math.min(
                        startIndex + pageSize,
                        parametrosOrdenados.length
                      )}{" "}
                      de {parametrosOrdenados.length} parámetros
                    </small>
                  </div>
                  <div className="col-md-6">
                    <nav>
                      <ul className="pagination justify-content-end mb-0">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                          >
                            Anterior
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                          <li
                            key={i + 1}
                            className={`page-item ${
                              currentPage === i + 1 ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                          >
                            Siguiente
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Componente del formulario modal */}
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
  );
};

export default Parametros;
