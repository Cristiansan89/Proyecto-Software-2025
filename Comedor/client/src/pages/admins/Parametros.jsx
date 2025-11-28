import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
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
    tipoParametro: "string",
    estado: "Activo",
  });
  const [mensaje, setMensaje] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    cargarParametros();
  }, []);

  const cargarParametros = async () => {
    try {
      setLoading(true);
      const response = await API.get("/parametros-sistemas");
      setParametros(response.data || []);    } catch (error) {      setMensaje({
        tipo: "error",
        texto: "Error al cargar los parámetros",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombreParametro.trim()) {
      setMensaje({
        tipo: "error",
        texto: "El nombre del parámetro es obligatorio",
      });
      return false;
    }
    if (!formData.valor.trim()) {
      setMensaje({
        tipo: "error",
        texto: "El valor del parámetro es obligatorio",
      });
      return false;
    }
    return true;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      if (editandoId) {
        // Actualizar
        await API.patch(`/parametros-sistemas/${editandoId}`, {
          nombreParametro: formData.nombreParametro,
          valor: formData.valor,
          tipoParametro: formData.tipoParametro,
          estado: formData.estado,
        });
        setMensaje({
          tipo: "success",
          texto: "Parámetro actualizado correctamente",
        });
      } else {
        // Crear
        await API.post("/parametros-sistemas", {
          nombreParametro: formData.nombreParametro,
          valor: formData.valor,
          tipoParametro: formData.tipoParametro,
          estado: formData.estado,
        });
        setMensaje({
          tipo: "success",
          texto: "Parámetro creado correctamente",
        });
      }

      setModalParametro(false);
      setFormData({
        nombreParametro: "",
        valor: "",
        tipoParametro: "string",
        estado: "Activo",
      });
      setEditandoId(null);
      cargarParametros();
    } catch (error) {      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || "Error al guardar el parámetro",
      });
    }
  };

  const handleEditar = (parametro) => {
    setFormData({
      nombreParametro: parametro.nombreParametro,
      valor: parametro.valor,
      tipoParametro: parametro.tipoParametro || "string",
      estado: parametro.estado,
    });
    setEditandoId(parametro.id_parametro);
    setModalParametro(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Está seguro de que desea eliminar este parámetro?")) {
      try {
        await API.delete(`/parametros-sistemas/${id}`);
        setMensaje({
          tipo: "success",
          texto: "Parámetro eliminado correctamente",
        });
        cargarParametros();
      } catch (error) {        setMensaje({
          tipo: "error",
          texto: "Error al eliminar el parámetro",
        });
      }
    }
  };

  const handleNuevo = () => {
    setFormData({
      nombreParametro: "",
      valor: "",
      tipoParametro: "string",
      estado: "Activo",
    });
    setEditandoId(null);
    setModalParametro(true);
  };

  const handleCerrarModal = () => {
    setModalParametro(false);
    setEditandoId(null);
    setFormData({
      nombreParametro: "",
      valor: "",
      tipoParametro: "string",
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

  // Paginación
  const totalPages = Math.ceil(parametrosFiltrados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const parametrosPaginados = parametrosFiltrados.slice(
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
    <div className="container-fluid parametros-container">
      <div className="page-header">
        <div className="page-left">
          <h1 className="page-title">
            <i className="fas fa-sliders-h"></i> Parámetros del Sistema
          </h1>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-primary" onClick={handleNuevo}>
            <i className="fas fa-plus"></i> Nuevo Parámetro
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}
          role="alert"
        >
          {mensaje.texto}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMensaje(null)}
          ></button>
        </div>
      )}

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
            <div className="col-md-4">
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
          </div>
        </div>

        <div className="card-body">
          {parametrosPaginados.length === 0 ? (
            <div className="alert alert-info text-center">
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
                          {param.tipoParametro || "string"}
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
                          onClick={() => handleEliminar(param.id_parametro)}
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
                  {Math.min(startIndex + pageSize, parametrosFiltrados.length)}{" "}
                  de {parametrosFiltrados.length} parámetros
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

      {/* Modal para crear/editar parámetro */}
      {modalParametro && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editandoId ? "Editar Parámetro" : "Nuevo Parámetro"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCerrarModal}
                ></button>
              </div>
              <form onSubmit={handleGuardar}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="nombreParametro" className="form-label">
                      Nombre del Parámetro{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nombreParametro"
                      name="nombreParametro"
                      value={formData.nombreParametro}
                      onChange={handleInputChange}
                      placeholder="Ej: HORA_PEDIDO_AUTOMATICO"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="valor" className="form-label">
                      Valor <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="valor"
                      name="valor"
                      value={formData.valor}
                      onChange={handleInputChange}
                      placeholder="Ingrese el valor del parámetro"
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="tipoParametro" className="form-label">
                        Tipo de Parámetro
                      </label>
                      <select
                        className="form-select"
                        id="tipoParametro"
                        name="tipoParametro"
                        value={formData.tipoParametro}
                        onChange={handleInputChange}
                      >
                        <option value="string">String (Texto)</option>
                        <option value="number">Number (Número)</option>
                        <option value="boolean">
                          Boolean (Verdadero/Falso)
                        </option>
                        <option value="json">JSON</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="estado" className="form-label">
                        Estado
                      </label>
                      <select
                        className="form-select"
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCerrarModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editandoId ? "Actualizar" : "Crear"} Parámetro
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametros;
