import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import Select from "react-select";
import { showSuccess, showError, showWarning } from "../../utils/alertService";
import { formatNumeroAR } from "../../utils/formatNumero";
import { formatDate } from "../../utils/dateUtils";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import CocineraStyle from "../../styles/CocineraInventario.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
      const cantidad = parseFloat(inv.cantidadActual);
      const nivelMinimo = parseFloat(inv.nivelMinimoAlerta);
      const stockMaximo = parseFloat(inv.stockMaximo) || nivelMinimo; // Fallback si no hay stockMaximo

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
      Boolean,
    );
    return cats;
  };

  const clearFilters = () => {
    setFiltros({
      categoria: "",
      estado: "",
      busqueda: "",
    });

    setCurrentPage(1);
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
    return { estado: "excelente", color: "excelente", texto: "Excelente" };
  };

  const handleFilterSearch = (e) => {
    setFiltros({
      ...filtros,
      busqueda: e.target.value,
    });
  };

  const handleFilterCategoria = (e) => {
    setFiltros({
      ...filtros,
      categoria: e.target.value,
    });
  };

  const handleFilterEstado = (e) => {
    setFiltros({
      ...filtros,
      estado: e.target.value,
    });
  };

  const registrarMovimiento = async () => {
    try {
      if (!nuevoMovimiento.id_insumo || !nuevoMovimiento.cantidadMovimiento) {
        showWarning("Campos incompletos", "Complete los campos requeridos");
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
      showSuccess("Éxito", "Movimiento registrado exitosamente", 2000);
    } catch (error) {
      showError(
        "Error",
        "Error al registrar el movimiento: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const obtenerUltimosMovimientos = () => {
    return movimientos
      .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
      .slice(0, 5);
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

  // Paginación
  const totalPages = Math.ceil(inventariosOrdenados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const inventariosPaginados = inventariosOrdenados.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Inventarios...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-warehouse"></i>
            Control de Inventario
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Gestión de insumos y stock del comedor
          </p>
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
                  {alertasInventario.map((alerta, index) => {
                    const alertaTypeClass =
                      alerta.tipo === "critico"
                        ? CocineraStyle.alertaDanger
                        : alerta.tipo === "agotado"
                          ? CocineraStyle.alertaDark
                          : CocineraStyle.alertaWarning;

                    return (
                      <div key={index} className="col-md-6 col-lg-4 mb-2">
                        <div
                          className={`${CocineraStyle.alertaInventario} ${alertaTypeClass}`}
                        >
                          <strong>{alerta.insumo}</strong>
                          <small>
                            {formatNumeroAR(alerta.cantidad)} {alerta.unidad} (
                            {alerta.porcentaje.toFixed(1)}% del stock máximtto)
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-9">
          <div className={ContenidoStyle.headerLeft}>
            <div className={ContenidoStyle.searchFilters}>
              <div className={ContenidoStyle.searchBar}>
                <input
                  type="text"
                  className={ComponenteStyle.formControl}
                  placeholder="Nombre del Insumo..."
                  value={filtros.busqueda}
                  onChange={handleFilterSearch}
                />
              </div>
              <div className={ContenidoStyle.filterActions}>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filtros.categoria}
                  onChange={handleFilterCategoria}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  className={ContenidoStyle.filterSelect}
                  value={filtros.estado}
                  onChange={handleFilterEstado}
                >
                  <option value="">Todos los estados</option>
                  <option value="critico">Stock Crítico</option>
                  <option value="bajo">Stock Bajo</option>
                  <option value="normal">Stock Normal</option>
                </select>
                {(filtros.busqueda || filtros.categoria || filtros.estado) && (
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

          {/* Lista de inventario */}
          <div className={ContenidoStyle.card}>
            <div
              className={`${ContenidoStyle.cardHeader} ${ContenidoStyle.headerInventario} pb-0 pt-2`}
            >
              <h5>
                <i className="fas fa-clipboard-list me-1"></i>
                Registro de Inventario
              </h5>

              <div className={ContenidoStyle.headerRight}>
                <label className="mx-2">
                  <span>Registros por página:</span>
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
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
              {inventariosFiltrados.length === 0 ? (
                <div>
                  <div className={TablaStyle.emptyState}>
                    <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                    <h5>No se encontraron insumos</h5>
                    <p>No hay insumos que coincidan con tu búsqueda.</p>
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
                          <th>Insumo</th>
                          <th>Categoría</th>
                          <th>Stock Actual</th>
                          <th>Stock Mínimo</th>
                          <th>Estado</th>
                          <th>Nivel</th>
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
                                <span
                                  className={`${ComponenteStyle.badge} bg-secondary text-white fw-bold`}
                                >
                                  {inventario.categoria || "Sin categoría"}
                                </span>
                              </td>
                              <td>
                                <strong>
                                  {formatNumeroAR(inventario.cantidadActual)}{" "}
                                  {inventario.unidadMedida}
                                </strong>
                              </td>
                              <td className="text-danger">
                                <strong>
                                  {formatNumeroAR(inventario.nivelMinimoAlerta)}{" "}
                                  {inventario.unidadMedida}
                                </strong>
                              </td>
                              <td>
                                <div>
                                  <span
                                    className={`${ComponenteStyle.badge} ${estadoStock.color === "excelente" ? ComponenteStyle.bgTeal : `bg-${estadoStock.color}`} text-white fw-bold`}
                                  >
                                    {estadoStock.texto}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div
                                  className="progress mt-1"
                                  style={{ height: "6px" }}
                                >
                                  <div
                                    className={`progress-bar ${estadoStock.color === "excelente" ? ComponenteStyle.bgTeal : `bg-${estadoStock.color}`}`}
                                    style={{
                                      width: `${Math.min(
                                        porcentajeDelMinimo,
                                        100,
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <small className="text-muted">
                                  {porcentajeDelMinimo.toFixed(1)}% del nivel
                                  mínimo
                                </small>
                              </td>
                              <td className="text-center">
                                {formatDate(
                                  inventario.fechaUltimaActualizacion,
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <div className={TablaStyle.pagination}>
                  <button
                    className={TablaStyle.paginationBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div className={TablaStyle.paginationInfo}>
                    Página {currentPage} de {totalPages}
                  </div>
                  <button
                    className={TablaStyle.paginationBtn}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-lg-3 ml-lg-4">
          {/* Accordion de Estadísticas */}
          <div className="accordion ms-2" id="accordionEstadisticas">
            {" "}
            {/* Corregido ml-2 a ms-2 */}
            <div className="accordion-item shadow-sm">
              {" "}
              {/* shadow-sm le da profundidad visual */}
              <h2 className="accordion-header" id="headingEst">
                <button
                  className="accordion-button fw-bold text-secondary"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseEst"
                  aria-expanded="true"
                  aria-controls="collapseEst"
                >
                  <i className="fas fa-chart-pie me-2 text-primary"></i>
                  Estadísticas
                </button>
              </h2>
              <div
                id="collapseEst"
                className="accordion-collapse collapse show" /* Se añade 'show' para que por defecto empiece abierto */
                aria-labelledby="headingEst"
                data-bs-parent="#accordionEstadisticas"
              >
                <div className="accordion-body p-2">
                  {" "}
                  {/* p-2 optimiza el espacio de las tarjetas internas */}
                  {/* Total Insumos */}
                  <div className="d-flex align-items-center border rounded p-2 mb-2 bg-light">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <i className="fas fa-boxes"></i>
                    </div>
                    <div>
                      <p className="text-muted small mb-0 fw-medium">
                        Total Insumos
                      </p>
                      <h5 className="mb-0 fw-bold">{inventarios.length}</h5>
                    </div>
                  </div>
                  {/* Stock Crítico */}
                  <div
                    className="d-flex align-items-center border border-danger-subtle rounded p-2 mb-2 bg-danger- Hail-subtle"
                    style={{ backgroundColor: "#fff5f5" }}
                  >
                    <div
                      className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center me-3"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <p className="text-danger small mb-0 fw-medium">
                        Stock Crítico
                      </p>
                      <h5 className="mb-0 fw-bold text-danger">
                        {
                          alertasInventario.filter((a) => a.tipo === "critico")
                            .length
                        }
                      </h5>
                    </div>
                  </div>
                  {/* Stock Bajo */}
                  <div
                    className="d-flex align-items-center border border-warning-subtle rounded p-2 mb-2"
                    style={{ backgroundColor: "#fffdf5" }}
                  >
                    <div
                      className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center me-3"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <i className="fas fa-minus-circle"></i>
                    </div>
                    <div>
                      <p className="text-warning-emphasis small mb-0 fw-medium">
                        Stock Bajo
                      </p>
                      <h5 className="mb-0 fw-bold text-warning-emphasis">
                        {
                          alertasInventario.filter((a) => a.tipo === "bajo")
                            .length
                        }
                      </h5>
                    </div>
                  </div>
                  {/* Categorías */}
                  <div className="d-flex align-items-center border rounded p-2 bg-light">
                    <div
                      className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-3"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <i className="fas fa-tags"></i>
                    </div>
                    <div>
                      <p className="text-muted small mb-0 fw-medium">
                        Categorías
                      </p>
                      <h5 className="mb-0 fw-bold">{categorias.length}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="accordion ms-2 mt-3" id="accordionMovimientos">
            {" "}
            {/* Corregido ml-2 a ms-2 */}
            <div className="accordion-item shadow-sm">
              <h2 className="accordion-header" id="headingMov">
                <button
                  className="accordion-button fw-bold text-secondary"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseMov"
                  aria-expanded="true"
                  aria-controls="collapseMov"
                >
                  <i className="fas fa-history me-2 text-success"></i>
                  Últimos Movimientos
                </button>
              </h2>

              <div
                id="collapseMov"
                className="accordion-collapse collapse show" /* Empezar abierto */
                aria-labelledby="headingMov"
                data-bs-parent="#accordionMovimientos"
              >
                <div className="accordion-body p-3">
                  {ultimosMovimientos.length === 0 ? (
                    <p className="text-muted text-center small my-3">
                      No hay movimientos recientes
                    </p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {ultimosMovimientos.map((mov, index) => {
                        const insumo = inventarios.find(
                          (inv) =>
                            inv.id_insumo === mov.idInsumo ||
                            inv.id_insumo === mov.id_insumo,
                        );

                        return (
                          <div
                            key={index}
                            className={`pb-2 ${index !== ultimosMovimientos.length - 1 ? "border-bottom" : ""}`}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span
                                className={`${ComponenteStyle.badge} bg-${
                                  mov.tipoMovimiento === "Entrada"
                                    ? "success"
                                    : mov.tipoMovimiento === "Salida"
                                      ? "danger"
                                      : "warning"
                                } text-white`}
                                style={{ fontSize: "0.75rem" }}
                              >
                                {mov.tipoMovimiento === "Entrada"
                                  ? "↗️ Entrada"
                                  : mov.tipoMovimiento === "Salida"
                                    ? "↙️ Salida"
                                    : "🗑️ Merma"}
                              </span>
                              <small
                                className="text-muted"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {formatDate(mov.fechaHora)}
                              </small>
                            </div>
                            <div className="ps-1">
                              <div className="fw-semibold text-dark small">
                                {insumo?.nombreInsumo || "Insumo desconocido"}
                              </div>
                              <span className="text-muted small">
                                {formatNumeroAR(mov.cantidadMovimiento)}{" "}
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
        </div>
      </div>

      {/* Modal de nuevo movimiento */}
      {modalMovimiento &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    Registrar Movimiento de Inventario
                  </h5>
                  <button
                    type="button"
                    className={FormularioStyle.modalClose}
                    onClick={() => setModalMovimiento(false)}
                  ></button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  {/* Debug info */}
                  <div
                    className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} mb-3`}
                  >
                    <small>
                      <strong>Debug:</strong> Inventarios: {inventarios.length},
                      Opciones: {opcionesInsumos.length}, Tipos de merma:{" "}
                      {tiposMerma.length}
                      <br />
                      Estado loading: {loading ? "Sí" : "No"}
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className={ComponenteStyle.formLabel}>
                      Insumo *
                    </label>
                    {opcionesInsumos.length === 0 && (
                      <div
                        className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo}`}
                      >
                        🔄 Cargando inventario... ({inventarios.length} items
                        disponibles)
                      </div>
                    )}
                    <Select
                      options={opcionesInsumos}
                      value={
                        opcionesInsumos.find(
                          (opt) => opt.value == nuevoMovimiento.id_insumo,
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
                          <div
                            style={{ fontSize: "0.875rem", color: "#6c757d" }}
                          >
                            Unidad: {option.data.unidadMedida} | Categoría:{" "}
                            {option.data.categoria || "Sin categoría"}
                            {option.data.inventario &&
                              ` | Stock: ${parseFloat(
                                option.data.inventario.cantidadActual || 0,
                              ).toFixed(3)}`}
                          </div>
                        </div>
                      )}
                      noOptionsMessage={() => "No se encontraron insumos"}
                      loadingMessage={() => "Cargando insumos..."}
                    />
                    {nuevoMovimiento.id_insumo && (
                      <small
                        className={`${ComponenteStyle.formText} text-muted`}
                      >
                        {(() => {
                          const inventarioSeleccionado = inventarios.find(
                            (inv) => inv.id_insumo == nuevoMovimiento.id_insumo,
                          );
                          if (inventarioSeleccionado) {
                            return `Stock actual: ${parseFloat(
                              inventarioSeleccionado.cantidadActual,
                            ).toFixed(3)} ${
                              inventarioSeleccionado.unidadMedida
                            } | Categoría: ${
                              inventarioSeleccionado.categoria ||
                              "Sin categoría"
                            }`;
                          }
                          return "";
                        })()}
                      </small>
                    )}
                  </div>{" "}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className={ComponenteStyle.formLabel}>
                        Tipo de movimiento
                      </label>
                      <Select
                        options={opcionesTiposMovimiento}
                        value={opcionesTiposMovimiento.find(
                          (opt) => opt.value === nuevoMovimiento.tipoMovimiento,
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
                      <label className={ComponenteStyle.formLabel}>
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        className={ComponenteStyle.formControl}
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
                      <label className={ComponenteStyle.formLabel}>
                        Tipo de Merma *
                      </label>
                      <Select
                        options={opcionesTiposMerma}
                        value={
                          opcionesTiposMerma.find(
                            (opt) => opt.value == nuevoMovimiento.id_tipoMerma,
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
                    <label className={ComponenteStyle.formLabel}>
                      {nuevoMovimiento.tipoMovimiento === "Entrada"
                        ? "Observaciones (proveedor, factura, etc.)"
                        : nuevoMovimiento.tipoMovimiento === "Salida"
                          ? "Observaciones (destino, receta, etc.)"
                          : "Descripción de la merma"}
                    </label>
                    <textarea
                      className={ComponenteStyle.formControl}
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
                <div className={ComponenteStyle.formActions}>
                  <button
                    type="button"
                    className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
                    onClick={() => setModalMovimiento(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
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
          </div>,
          document.body,
        )}

      {modalMovimiento &&
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

export default CocineraInventario;
