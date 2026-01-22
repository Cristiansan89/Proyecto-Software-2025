import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import movimientoInventarioService from "../../services/movimientoInventarioService";
import inventarioService from "../../services/inventarioService";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import "../../styles/CocineraMovimiento.css";

const CocineraMovimiento = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: "",
    insumo: "",
    fechaInicio: "",
    fechaFin: "",
    usuario: "",
  });
  const [insumosLista, setInsumosLista] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "fechaHora",
    direction: "desc",
  });

  // Verificación de autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Si no está autenticado, no renderizar
  if (!isAuthenticated) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar movimientos
      const movimientosData =
        await movimientoInventarioService.obtenerMovimientos();
      //console.log("📊 Datos de movimientos recibidos:", movimientosData);
      setMovimientos(movimientosData || []);

      // 2. Cargar lista de insumos
      const insumosData = await inventarioService.obtenerInventarios();
      const insumosUnicos = [
        ...new Set(insumosData.map((i) => i.nombreInsumo)),
      ];
      setInsumosLista(insumosUnicos);

      // 3. Cargar usuarios únicos de los movimientos
      if (movimientosData && movimientosData.length > 0) {
        const usuariosUnicos = [
          ...new Set(movimientosData.map((m) => m.nombreUsuario || "Sistema")),
        ];
        setUsuariosLista(usuariosUnicos);
      }

      setMensaje({
        tipo: "success",
        texto: `✅ Cargados ${movimientosData?.length || 0} movimientos`,
      });
    } catch (error) {
      //console.error("Error al cargar movimientos:", error);
      showError("Error", "❌ Error al cargar movimientos");
      setMensaje({
        tipo: "error",
        texto: "Error al cargar movimientos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros
  const movimientosFiltrados = movimientos.filter((mov) => {
    if (filtros.tipo && mov.tipoMovimiento !== filtros.tipo) return false;
    if (
      filtros.insumo &&
      !mov.nombreInsumo?.toLowerCase().includes(filtros.insumo.toLowerCase())
    )
      return false;
    if (filtros.usuario && (mov.nombreUsuario || "Sistema") !== filtros.usuario)
      return false;

    if (filtros.fechaInicio) {
      const fechaMov = new Date(mov.fechaHora);
      const fechaInicio = new Date(filtros.fechaInicio);
      if (fechaMov < fechaInicio) return false;
    }

    if (filtros.fechaFin) {
      const fechaMov = new Date(mov.fechaHora);
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      if (fechaMov > fechaFin) return false;
    }

    return true;
  });

  // Ordenamiento
  const movimientosOrdenados = [...movimientosFiltrados].sort((a, b) => {
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    if (typeof valueA === "string") {
      const comparison = valueA.localeCompare(valueB);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    if (sortConfig.key === "fechaHora") {
      const dateA = new Date(valueA);
      const dateB = new Date(valueB);
      const comparison = dateA - dateB;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    const comparison = parseFloat(valueA) - parseFloat(valueB);
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  // Paginación
  const totalPages = Math.ceil(movimientosOrdenados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const movimientosPaginados = movimientosOrdenados.slice(startIndex, endIndex);

  const manejarOrdenamiento = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const obtenerBadgeColor = (tipo) => {
    switch (tipo) {
      case "Entrada":
        return "success";
      case "Salida":
        return "warning";
      case "Merma":
        return "danger";
      default:
        return "secondary";
    }
  };

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case "Entrada":
        return "fas fa-arrow-down text-success";
      case "Salida":
        return "fas fa-arrow-up text-warning";
      case "Merma":
        return "fas fa-trash text-danger";
      default:
        return "fas fa-exchange";
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: "",
      insumo: "",
      fechaInicio: "",
      fechaFin: "",
      usuario: "",
    });
    setCurrentPage(1);
  };

  const exportarCSV = () => {
    let csv = "MOVIMIENTOS DE INVENTARIO\n\n";
    csv += `Generado: ${new Date().toLocaleString("es-ES")}\n\n`;
    csv += "Fecha,Tipo,Insumo,Cantidad,Unidad,Usuario,Observaciones\n";

    movimientosOrdenados.forEach((mov) => {
      csv += `"${new Date(mov.fechaHora).toLocaleString("es-ES")}","${
        mov.tipoMovimiento
      }","${mov.nombreInsumo}","${mov.cantidadMovimiento}","${
        mov.unidadMedida
      }","${mov.nombreUsuario || "Sistema"}","${
        mov.comentarioMovimiento || ""
      }"\n`;
    });

    const elemento = document.createElement("a");
    elemento.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    elemento.setAttribute("download", `Movimientos_${Date.now()}.csv`);
    elemento.style.display = "none";
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  };

  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Movimientos de Inventario", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 28);

      const rows = movimientosOrdenados.map((m) => [
        new Date(m.fechaHora).toLocaleString("es-ES"),
        m.tipoMovimiento,
        m.nombreInsumo || "",
        Number(m.cantidadMovimiento),
        m.unidadMedida || "",
        m.nombreUsuario || "Sistema",
        m.comentarioMovimiento || "",
      ]);

      autoTable(doc, {
        startY: 36,
        head: [
          [
            "Fecha",
            "Tipo",
            "Insumo",
            "Cantidad",
            "Unidad",
            "Usuario",
            "Observaciones",
          ],
        ],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [240, 240, 240] },
        theme: "striped",
      });

      doc.save(`Movimientos_${Date.now()}.pdf`);
    } catch (err) {
      //console.error("Error generando PDF:", err);
      showError("Error", "❌ Error al generar PDF");
      setMensaje({ tipo: "error", texto: "Error al generar PDF" });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-exchange-alt me-2"></i>
            Movimientos de Inventario
          </h1>
          <p>Historial de entradas, salidas y merma de insumos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-2">
              <label className="form-label">Tipo de Movimiento</label>
              <select
                className="form-select"
                value={filtros.tipo}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipo: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="Entrada">↗ Entrada</option>
                <option value="Salida">↙ Salida</option>
                <option value="Merma">🗑 Merma</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Insumo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar insumo..."
                value={filtros.insumo}
                onChange={(e) =>
                  setFiltros({ ...filtros, insumo: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Usuario</label>
              <select
                className="form-select"
                value={filtros.usuario}
                onChange={(e) =>
                  setFiltros({ ...filtros, usuario: e.target.value })
                }
              >
                <option value="">Todos</option>
                {usuariosLista.map((usuario) => (
                  <option key={usuario} value={usuario}>
                    {usuario}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
              />
            </div>

            <div className="col-md-1" style={{ display: "none" }}>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={limpiarFiltros}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-danger me-2" onClick={generarPDF}>
              <i className="fas fa-file-pdf me-1"></i>
              Exportar PDF
            </button>
            <button className="btn btn-success" onClick={exportarCSV}>
              <i className="fas fa-download me-1"></i>
              Descargar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Movimientos
            </h5>
            <span className="badge bg-info">
              {movimientosFiltrados.length} movimientos
            </span>
          </div>
        </div>

        <div className="card-body">
          {/* Selector de tamaño de página */}
          <div className="page-size-selector d-flex align-items-center gap-2 mb-3">
            <label className="mb-0">
              <strong>Registros por página:</strong>
            </label>
            <select
              className="form-select"
              style={{ width: "70px" }}
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
            <span className="text-muted">
              Total: {movimientosFiltrados.length} registros
            </span>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
              <p className="text-muted">
                No hay movimientos con los filtros aplicados
              </p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table table-striped data-table">
                  <thead className="table-light">
                    <tr>
                      <th width="5%">#</th>
                      <th style={{ cursor: "pointer" }} width="15%">
                        <div
                          onClick={() => manejarOrdenamiento("fechaHora")}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fas fa-calendar-alt"></i>
                          Fecha
                          {sortConfig.key === "fechaHora" && (
                            <i
                              className={`fas fa-arrow-${
                                sortConfig.direction === "asc" ? "up" : "down"
                              }`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th style={{ cursor: "pointer" }} width="12%">
                        <div
                          onClick={() => manejarOrdenamiento("tipoMovimiento")}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fas fa-exchange-alt"></i>
                          Tipo
                          {sortConfig.key === "tipoMovimiento" && (
                            <i
                              className={`fas fa-arrow-${
                                sortConfig.direction === "asc" ? "up" : "down"
                              }`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th style={{ cursor: "pointer" }} width="20%">
                        <div
                          onClick={() => manejarOrdenamiento("nombreInsumo")}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fas fa-box"></i>
                          Insumo
                          {sortConfig.key === "nombreInsumo" && (
                            <i
                              className={`fas fa-arrow-${
                                sortConfig.direction === "asc" ? "up" : "down"
                              }`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th style={{ cursor: "pointer" }} width="12%">
                        <div
                          onClick={() => manejarOrdenamiento("cantidad")}
                          className="d-flex align-items-center gap-2"
                        >
                          <i className="fas fa-weight"></i>
                          Cantidad
                          {sortConfig.key === "cantidad" && (
                            <i
                              className={`fas fa-arrow-${
                                sortConfig.direction === "asc" ? "up" : "down"
                              }`}
                            ></i>
                          )}
                        </div>
                      </th>
                      <th width="12%">Unidad</th>
                      <th width="15%">Usuario</th>
                      <th width="14%">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosPaginados.map((mov, index) => (
                      <tr key={mov.id_movimiento}>
                        <td>
                          <strong>{index + 1}</strong>
                        </td>
                        <td>
                          <strong>
                            <small className="text-muted">
                              {new Date(mov.fechaHora).toLocaleDateString(
                                "es-ES",
                              )}
                            </small>
                            <br />
                            <small className="text-muted">
                              {new Date(mov.fechaHora).toLocaleTimeString(
                                "es-ES",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </small>
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${obtenerBadgeColor(
                              mov.tipoMovimiento,
                            )}`}
                          >
                            <span className="ms-1">{mov.tipoMovimiento}</span>
                          </span>
                        </td>
                        <td>
                          <strong>{mov.nombreInsumo || "N/A"}</strong>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {Number(mov.cantidadMovimiento)}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {mov.unidadMedida || "N/A"}
                          </small>
                        </td>
                        <td>
                          <small>
                            {mov.nombreUsuario ? (
                              <>
                                <i className="fas fa-user me-1"></i>
                                {mov.nombreUsuario}
                              </>
                            ) : (
                              <span className="text-muted">
                                <i className="fas fa-cogs me-1"></i>
                                Sistema
                              </span>
                            )}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {mov.comentarioMovimiento || "-"}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="table-footer">
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="pagination-info">
                      Página {currentPage} de {totalPages} (
                      {movimientosFiltrados.length} registros)
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
            </>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-arrow-down text-success fa-2x mb-2"></i>
              <h6 className="card-title">Total Entradas</h6>
              <h3 className="text-success">
                {
                  movimientosFiltrados.filter(
                    (m) => m.tipoMovimiento === "Entrada",
                  ).length
                }
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-arrow-up text-warning fa-2x mb-2"></i>
              <h6 className="card-title">Total Salidas</h6>
              <h3 className="text-warning">
                {
                  movimientosFiltrados.filter(
                    (m) => m.tipoMovimiento === "Salida",
                  ).length
                }
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-trash text-danger fa-2x mb-2"></i>
              <h6 className="card-title">Total Mermas</h6>
              <h3 className="text-danger">
                {
                  movimientosFiltrados.filter(
                    (m) => m.tipoMovimiento === "Merma",
                  ).length
                }
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-exchange-alt text-info fa-2x mb-2"></i>
              <h6 className="card-title">Total Movimientos</h6>
              <h3 className="text-info">{movimientosFiltrados.length}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CocineraMovimiento;
