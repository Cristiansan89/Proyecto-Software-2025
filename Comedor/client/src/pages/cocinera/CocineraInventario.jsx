import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import Select from "react-select";
import "../../styles/CocineraInventario.css";

const CocineraInventario = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventarios, setInventarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [filtros, setFiltros] = useState({
    categoria: "",
    estado: "",
    busqueda: "",
  });
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    id_insumo: "",
    tipoMovimiento: "Entrada",
    cantidadMovimiento: "",
    comentarioMovimiento: "",
    id_tipoMerma: "",
  });
  const [tiposMerma, setTiposMerma] = useState([]);
  const [alertasInventario, setAlertasInventario] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "id_insumo",
    direction: "asc",
  });

  useEffect(() => {
    cargarDatos();
    cargarTiposMerma();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [inventariosRes, movimientosRes] = await Promise.all([
        API.get("/inventarios"),
        API.get("/movimientos-inventarios"),
      ]);

      const inventariosData = inventariosRes.data || [];
      const movimientosData = movimientosRes.data || [];

      setInventarios(inventariosData);
      setMovimientos(movimientosData);

      // Generar alertas de stock bajo
      generarAlertas(inventariosData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposMerma = async () => {
    try {
      const response = await API.get("/tipos-merma/activos");
      setTiposMerma(response.data || []);
    } catch (error) {}
  };

  const generarAlertas = (inventariosData, insumosData) => {
    const alertas = [];

    inventariosData.forEach((inv) => {
      const cantidad = parseInt(inv.cantidadActual);
      const nivelMinimo = parseInt(inv.nivelMinimoAlerta);
      const stockMaximo = parseInt(inv.stockMaximo) || nivelMinimo; // Fallback si no hay stockMaximo

      // Alerta si: stock actual <= stock mínimo de alerta
      if (cantidad <= nivelMinimo) {
        // Calcular porcentaje respecto al stock máximo
        const porcentaje = stockMaximo > 0 ? (cantidad / stockMaximo) * 100 : 0;

        alertas.push({
          tipo: cantidad <= 0 ? "agotado" : "critico",
          insumo: inv.nombreInsumo,
          cantidad: cantidad,
          unidad: inv.unidadMedida,
          porcentaje: porcentaje,
        });
      }
    });

    setAlertasInventario(alertas);
  };

  const obtenerInventarioFiltrado = () => {
    return inventarios.filter((inv) => {
      // Los datos ya vienen con toda la información del insumo incluida
      const matchBusqueda =
        !filtros.busqueda ||
        inv.nombreInsumo.toLowerCase().includes(filtros.busqueda.toLowerCase());

      const matchCategoria =
        !filtros.categoria || inv.categoria === filtros.categoria;

      // Usar la nueva definición de estados basada en porcentaje de stock máximo
      const cantidad = parseFloat(inv.cantidadActual);
      const stockMaximo = parseFloat(inv.stockMaximo);
      const nivelMinimo = parseFloat(inv.nivelMinimoAlerta);

      const porcentajeActual = (cantidad / stockMaximo) * 100;
      const porcentajeMinimo = (nivelMinimo / stockMaximo) * 100;

      let matchEstado = true;

      if (filtros.estado === "agotado") {
        matchEstado = cantidad <= 0;
      } else if (filtros.estado === "critico") {
        matchEstado = porcentajeActual <= 2;
      } else if (filtros.estado === "bajo") {
        matchEstado =
          porcentajeActual > 2 && porcentajeActual <= porcentajeMinimo;
      } else if (filtros.estado === "bueno") {
        matchEstado =
          porcentajeActual > porcentajeMinimo && porcentajeActual <= 70;
      } else if (filtros.estado === "excelente") {
        matchEstado = porcentajeActual > 70;
      }
      // Si no hay filtro de estado, mostrar todos

      return matchBusqueda && matchCategoria && matchEstado;
    });
  };

  const obtenerCategorias = () => {
    const cats = [...new Set(inventarios.map((inv) => inv.categoria))].filter(
      Boolean
    );
    return cats;
  };

  const obtenerEstadoStock = (inventario) => {
    const cantidad = parseFloat(inventario.cantidadActual);
    const stockMaximo = parseFloat(inventario.stockMaximo);
    const nivelMinimo = parseFloat(inventario.nivelMinimoAlerta);

    // Calcular porcentajes basado en stock máximo
    const porcentajeActual = (cantidad / stockMaximo) * 100;
    const porcentajeMinimo = (nivelMinimo / stockMaximo) * 100;

    // Nuevas definiciones de estado basadas en (stock actual / stock máximo) * 100
    if (cantidad <= 0) {
      return { estado: "agotado", color: "dark", texto: "Agotado" };
    }
    if (porcentajeActual <= 2) {
      // Crítico: ≤ 2% del stock máximo
      return { estado: "critico", color: "danger", texto: "Crítico" };
    }
    if (porcentajeActual <= porcentajeMinimo) {
      // Bajo: entre 2% y el porcentaje del nivel mínimo
      return { estado: "bajo", color: "warning", texto: "Bajo" };
    }
    if (porcentajeActual <= 70) {
      // Bueno: entre nivel mínimo y 70%
      return { estado: "bueno", color: "info", texto: "Bueno" };
    }
    // Excelente: > 70%
    return { estado: "excelente", color: "success", texto: "Excelente" };
  };

  const registrarMovimiento = async () => {
    try {
      if (!nuevoMovimiento.id_insumo || !nuevoMovimiento.cantidadMovimiento) {
        alert("Complete los campos requeridos");
        return;
      }

      setLoading(true);

      const movimientoData = {
        id_insumo: parseInt(nuevoMovimiento.id_insumo),
        tipoMovimiento: nuevoMovimiento.tipoMovimiento,
        cantidadMovimiento: parseFloat(nuevoMovimiento.cantidadMovimiento),
        comentarioMovimiento: nuevoMovimiento.comentarioMovimiento,
        id_usuario: user.idUsuario || user.id_usuario,
        id_tipoMerma:
          nuevoMovimiento.tipoMovimiento === "Merma"
            ? parseInt(nuevoMovimiento.id_tipoMerma)
            : null,
      };
      await API.post("/movimientos-inventarios", movimientoData);

      setModalMovimiento(false);
      setNuevoMovimiento({
        id_insumo: "",
        tipoMovimiento: "Entrada",
        cantidadMovimiento: "",
        comentarioMovimiento: "",
        id_tipoMerma: "",
      });

      await cargarDatos();
      alert("Movimiento registrado exitosamente");
    } catch (error) {
      alert(
        "Error al registrar el movimiento: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const obtenerUltimosMovimientos = () => {
    return movimientos
      .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
      .slice(0, 10);
  };

  // Opciones para react-select
  const opcionesInsumos = inventarios.map((inv) => {
    return {
      value: inv.id_insumo,
      label: `${inv.nombreInsumo} (${inv.unidadMedida})`,
      data: {
        idInsumo: inv.id_insumo,
        nombreInsumo: inv.nombreInsumo,
        unidadMedida: inv.unidadMedida,
        categoria: inv.categoria,
        inventario: {
          cantidadActual: inv.cantidadActual,
          stockMaximo: inv.stockMaximo,
        },
      },
    };
  });

  const opcionesTiposMovimiento = [
    { value: "Entrada", label: "↗️ Entrada" },
    { value: "Salida", label: "↙️ Salida" },
    { value: "Merma", label: "🗑️ Merma" },
  ];

  const opcionesTiposMerma = tiposMerma.map((tipo) => ({
    value: tipo.id_tipo_merma || tipo.id_tipoMerma,
    label: `${tipo.nombre} - ${tipo.descripcion}`,
  }));

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#0d6efd" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: "#0d6efd",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
        ? "#f8f9fa"
        : "white",
      color: state.isSelected ? "white" : "#212529",
    }),
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando inventario...</p>
      </div>
    );
  }

  const inventariosFiltrados = obtenerInventarioFiltrado();
  const categorias = obtenerCategorias();
  const ultimosMovimientos = obtenerUltimosMovimientos();

  const manejarOrdenamiento = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Aplicar ordenamiento
  const inventariosOrdenados = [...inventariosFiltrados].sort((a, b) => {
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    if (typeof valueA === "string") {
      const comparison = valueA.localeCompare(valueB);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    const comparison = valueA - valueB;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  // Aplicar paginación
  const totalPages = Math.ceil(inventariosOrdenados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const inventariosPaginados = inventariosOrdenados.slice(startIndex, endIndex);

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-warehouse me-2"></i>
            Control de Inventario
          </h1>
          <p>Gestión de insumos y stock del comedor</p>
        </div>
      </div>

      {/* Alertas de stock */}
      {alertasInventario.length > 0 && (
        <div className="accordion mb-3" id="accordionAlertas">
          <div className="accordion-item border-warning">
            <h2 className="accordion-header">
              <button
                className="accordion-button bg-warning text-dark"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseAlertas"
              >
                <i className="fas fa-exclamation-triangle me-2"></i>
                Alertas de Inventario
              </button>
            </h2>

            <div
              id="collapseAlertas"
              className="accordion-collapse collapse "
              data-bs-parent="#accordionAlertas"
            >
              <div className="accordion-body">
                <div className="row">
                  {alertasInventario.map((alerta, index) => (
                    <div key={index} className="col-md-6 col-lg-4 mb-2">
                      <div
                        className={`alert alert-${
                          alerta.tipo === "critico"
                            ? "danger"
                            : alerta.tipo === "agotado"
                            ? "dark"
                            : "warning"
                        } mb-0`}
                      >
                        <strong>{alerta.insumo}</strong>
                        <br />
                        <small>
                          {alerta.cantidad} {alerta.unidad} (
                          {alerta.porcentaje.toFixed(1)}% del stock máximo)
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Panel principal */}
        <div className="col-lg-9">
          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-4">
                  <label className="form-label">Buscar Insumo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del Insumo..."
                    value={filtros.busqueda}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        busqueda: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    value={filtros.categoria}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        categoria: e.target.value,
                      })
                    }
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Estado de stock</label>
                  <select
                    className="form-select"
                    value={filtros.estado}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        estado: e.target.value,
                      })
                    }
                  >
                    <option value="">Todos los estados</option>
                    <option value="critico">Stock Crítico</option>
                    <option value="bajo">Stock Bajo</option>
                    <option value="normal">Stock Normal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de inventario */}
          <div className="card">
            <div className="card-header">
              <h4>
                <i className="fas fa-clipboard-list me-2"></i>
                Inventario Actual
              </h4>
              <div></div>
            </div>
            <div className="card-body">
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
                  Total: {inventariosOrdenados.length} registros
                </span>
              </div>
              {inventariosFiltrados.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-search fa-2x text-muted mb-3"></i>
                  <p className="text-muted">
                    No se encontraron insumos con los filtros aplicados
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-striped">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Insumo</th>
                        <th>Categoría</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                        <th>Última Actualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventariosPaginados.map((inventario) => {
                        const estadoStock = obtenerEstadoStock(inventario);
                        // Calcular porcentaje respecto al stock maximo
                        const porcentajeDelMinimo =
                          (parseFloat(inventario.cantidadActual) * 100) /
                          parseFloat(inventario.stockMaximo);
                        return (
                          <tr key={inventario.id_insumo}>
                            <td>
                              <strong>{inventario.id_insumo}</strong>
                            </td>
                            <td>
                              <div>
                                <strong>
                                  {inventario.nombreInsumo ||
                                    "Insumo no encontrado"}
                                </strong>
                                {inventario.descripcion && (
                                  <small className="text-muted d-block">
                                    {inventario.descripcion}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {inventario.categoria || "Sin categoría"}
                              </span>
                            </td>
                            <td>
                              <strong>
                                {Math.round(
                                  parseFloat(inventario.cantidadActual)
                                )}{" "}
                                {inventario.unidadMedida}
                              </strong>
                            </td>
                            <td className="text-danger">
                              <strong>
                                {Math.round(
                                  parseFloat(inventario.nivelMinimoAlerta)
                                )}{" "}
                                {inventario.unidadMedida}
                              </strong>
                            </td>
                            <td>
                              <div>
                                <span
                                  className={`badge bg-${estadoStock.color}`}
                                >
                                  {estadoStock.texto}
                                </span>
                                <div
                                  className="progress mt-1"
                                  style={{ height: "6px" }}
                                >
                                  <div
                                    className={`progress-bar bg-${estadoStock.color}`}
                                    style={{
                                      width: `${Math.min(
                                        porcentajeDelMinimo,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <small className="text-muted">
                                  {porcentajeDelMinimo.toFixed(1)}% del nivel
                                  mínimo
                                </small>
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(
                                  inventario.fechaUltimaActualizacion
                                ).toLocaleDateString("es-ES")}
                              </small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="table-footer">
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="pagination-info">
                          Página {currentPage} de {totalPages} (
                          {inventariosOrdenados.length} registros)
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
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-lg-3 ml-lg-4">
          {/* Accordion de Estadísticas */}
          <div className="accordion ml-2" id="accordionEstadisticas">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingEst">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseEst"
                  aria-expanded="true"
                  aria-controls="collapseEst"
                >
                  <i className="fas fa-chart-pie me-2"></i>
                  Estadísticas
                </button>
              </h2>

              <div
                id="collapseEst"
                className="accordion-collapse collapse"
                aria-labelledby="headingEst"
                data-bs-parent="#accordionEstadisticas"
              >
                <div className="accordion-body">
                  <div className="stat-item mb-2">
                    <div className="stat-icon bg-primary">
                      <i className="fas fa-boxes"></i>
                    </div>
                    <div className="stat-content">
                      <h6>Total Insumos</h6>
                      <h5>{inventarios.length}</h5>
                    </div>
                  </div>

                  <div className="stat-item mb-2">
                    <div className="stat-icon bg-danger">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="stat-content">
                      <h6>Stock Crítico</h6>
                      <h5>
                        {
                          alertasInventario.filter((a) => a.tipo === "critico")
                            .length
                        }
                      </h5>
                    </div>
                  </div>

                  <div className="stat-item mb-2">
                    <div className="stat-icon bg-warning">
                      <i className="fas fa-minus-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h6>Stock Bajo</h6>
                      <h5>
                        {
                          alertasInventario.filter((a) => a.tipo === "bajo")
                            .length
                        }
                      </h5>
                    </div>
                  </div>

                  <div className="stat-item mb-2">
                    <div className="stat-icon bg-info">
                      <i className="fas fa-tags"></i>
                    </div>
                    <div className="stat-content">
                      <h6>Categorías</h6>
                      <h5>{categorias.length}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="card mt-3">
            <div className="card-header text-dark pb-0">
              <h6>
                <i className="fas fa-history me-2"></i>
                Últimos Movimientos
              </h6>
            </div>
            <div className="card-body">
              {ultimosMovimientos.length === 0 ? (
                <p className="text-muted text-center">
                  No hay movimientos recientes
                </p>
              ) : (
                <div className="movimientos-list">
                  {ultimosMovimientos.map((mov, index) => {
                    const insumo = inventarios.find(
                      (inv) =>
                        inv.id_insumo === mov.idInsumo ||
                        inv.id_insumo === mov.id_insumo
                    );

                    return (
                      <div key={index} className="movimiento-item">
                        <div className="movimiento-header">
                          <span
                            className={`badge bg-${
                              mov.tipoMovimiento === "Entrada"
                                ? "success"
                                : mov.tipoMovimiento === "Salida"
                                ? "danger"
                                : "warning"
                            }`}
                          >
                            {mov.tipoMovimiento === "Entrada"
                              ? "↗️ Entrada"
                              : mov.tipoMovimiento === "Salida"
                              ? "↙️ Salida"
                              : "🗑️ Merma"}
                          </span>
                          <small className="text-muted mx-2">
                            {new Date(mov.fechaHora).toLocaleDateString(
                              "es-ES"
                            )}
                          </small>
                        </div>
                        <div className="movimiento-content mb-2">
                          <strong>
                            {insumo?.nombreInsumo || "Insumo desconocido"}
                          </strong>
                          <br />
                          <span>
                            {Math.round(parseFloat(mov.cantidadMovimiento))}{" "}
                            {insumo?.unidadMedida}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de nuevo movimiento */}
      {modalMovimiento && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Registrar Movimiento de Inventario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalMovimiento(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Debug info */}
                <div className="alert alert-info mb-3">
                  <small>
                    <strong>Debug:</strong> Inventarios: {inventarios.length},
                    Opciones: {opcionesInsumos.length}, Tipos de merma:{" "}
                    {tiposMerma.length}
                    <br />
                    Estado loading: {loading ? "Sí" : "No"}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Insumo *</label>
                  {opcionesInsumos.length === 0 && (
                    <div className="alert alert-warning">
                      🔄 Cargando inventario... ({inventarios.length} items
                      disponibles)
                    </div>
                  )}
                  <Select
                    options={opcionesInsumos}
                    value={
                      opcionesInsumos.find(
                        (opt) => opt.value == nuevoMovimiento.id_insumo
                      ) || null
                    }
                    onChange={(selectedOption) => {
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        id_insumo: selectedOption ? selectedOption.value : "",
                      });
                    }}
                    placeholder={`Buscar y seleccionar insumo... (${opcionesInsumos.length} disponibles)`}
                    isSearchable
                    isClearable
                    styles={customSelectStyles}
                    formatOptionLabel={(option) => (
                      <div>
                        <div style={{ fontWeight: "bold" }}>
                          {option.data.nombreInsumo}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                          Unidad: {option.data.unidadMedida} | Categoría:{" "}
                          {option.data.categoria || "Sin categoría"}
                          {option.data.inventario &&
                            ` | Stock: ${Math.round(
                              parseFloat(
                                option.data.inventario.cantidadActual || 0
                              )
                            )}`}
                        </div>
                      </div>
                    )}
                    noOptionsMessage={() => "No se encontraron insumos"}
                    loadingMessage={() => "Cargando insumos..."}
                  />
                  {nuevoMovimiento.id_insumo && (
                    <small className="form-text text-muted">
                      {(() => {
                        const inventarioSeleccionado = inventarios.find(
                          (inv) => inv.id_insumo == nuevoMovimiento.id_insumo
                        );
                        if (inventarioSeleccionado) {
                          return `Stock actual: ${Math.round(
                            parseFloat(inventarioSeleccionado.cantidadActual)
                          )} ${
                            inventarioSeleccionado.unidadMedida
                          } | Categoría: ${
                            inventarioSeleccionado.categoria || "Sin categoría"
                          }`;
                        }
                        return "";
                      })()}
                    </small>
                  )}
                </div>{" "}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de movimiento</label>
                    <Select
                      options={opcionesTiposMovimiento}
                      value={opcionesTiposMovimiento.find(
                        (opt) => opt.value === nuevoMovimiento.tipoMovimiento
                      )}
                      onChange={(selectedOption) => {
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          tipoMovimiento: selectedOption.value,
                          id_tipoMerma: "", // Reset merma when changing type
                        });
                      }}
                      isSearchable={false}
                      styles={customSelectStyles}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nuevoMovimiento.cantidadMovimiento}
                      onChange={(e) =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          cantidadMovimiento: e.target.value,
                        })
                      }
                      min="0"
                      step="0.001"
                      required
                    />
                  </div>
                </div>
                {nuevoMovimiento.tipoMovimiento === "Merma" && (
                  <div className="mb-3">
                    <label className="form-label">Tipo de Merma *</label>
                    <Select
                      options={opcionesTiposMerma}
                      value={
                        opcionesTiposMerma.find(
                          (opt) => opt.value == nuevoMovimiento.id_tipoMerma
                        ) || null
                      }
                      onChange={(selectedOption) => {
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          id_tipoMerma: selectedOption
                            ? selectedOption.value
                            : "",
                        });
                      }}
                      placeholder="Seleccionar tipo de merma..."
                      isSearchable
                      isClearable
                      styles={customSelectStyles}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">
                    {nuevoMovimiento.tipoMovimiento === "Entrada"
                      ? "Observaciones (proveedor, factura, etc.)"
                      : nuevoMovimiento.tipoMovimiento === "Salida"
                      ? "Observaciones (destino, receta, etc.)"
                      : "Descripción de la merma"}
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={nuevoMovimiento.comentarioMovimiento}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        comentarioMovimiento: e.target.value,
                      })
                    }
                    placeholder={
                      nuevoMovimiento.tipoMovimiento === "Entrada"
                        ? "Proveedor, número de factura, lote..."
                        : nuevoMovimiento.tipoMovimiento === "Salida"
                        ? "Para qué receta, consumo directo..."
                        : "Detalles sobre la causa de la merma..."
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalMovimiento(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={registrarMovimiento}
                  disabled={
                    !nuevoMovimiento.id_insumo ||
                    !nuevoMovimiento.cantidadMovimiento ||
                    (nuevoMovimiento.tipoMovimiento === "Merma" &&
                      !nuevoMovimiento.id_tipoMerma)
                  }
                >
                  <i className="fas fa-save me-2"></i>
                  Registrar {nuevoMovimiento.tipoMovimiento}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CocineraInventario;
