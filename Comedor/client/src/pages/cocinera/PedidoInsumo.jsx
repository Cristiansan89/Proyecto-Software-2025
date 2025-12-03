import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PedidoFormSimple from "../../components/cocinera/PedidoFormSimple";
import PedidoAutomaticoForm from "../../components/cocinera/PedidoAutomaticoForm";
import pedidoService from "../../services/pedidoService";
import estadoPedidoService from "../../services/estadoPedidoService";
import insumoService from "../../services/insumoService";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const PedidoInsumo = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista', 'crear', 'automatico'
  const [pedidos, setPedidos] = useState([]);
  const [estadosPedido, setEstadosPedido] = useState([]);
  const [insumosBajoStock, setInsumosBajoStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: "",
    fechaInicio: "",
    fechaFin: "",
    proveedor: "",
    usuario: "",
    origen: "",
  });
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [usuariosUnicos, setUsuariosUnicos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [mostrarDetallesPedido, setMostrarDetallesPedido] = useState(null);
  const [mostrarAutomatico, setMostrarAutomatico] = useState(false);

  // Función para calcular fecha de entrega desde fecha de aprobación
  const calcularFechaEntrega = (fechaAprobacion) => {
    if (!fechaAprobacion) return null;

    const fecha = new Date(fechaAprobacion);
    // Agregar 1 día a la fecha de aprobación
    fecha.setDate(fecha.getDate() + 1);

    // Si cae en sábado (6), mover al lunes
    if (fecha.getDay() === 6) {
      fecha.setDate(fecha.getDate() + 2);
    }
    // Si cae en domingo (0), mover al lunes
    else if (fecha.getDay() === 0) {
      fecha.setDate(fecha.getDate() + 1);
    }

    return fecha;
  };

  // Función para verificar si hay filtros aplicados
  const hayFiltrosAplicados = () => {
    return (
      filtros.estado ||
      filtros.proveedor ||
      filtros.usuario ||
      filtros.origen ||
      filtros.fechaInicio ||
      filtros.fechaFin
    );
  };

  useEffect(() => {
    cargarDatos();
    cargarInsumosBajoStock();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [pedidos, filtros]);

  const aplicarFiltros = () => {
    let pedidosTemp = [...pedidos];

    // Filtrar por estado
    if (filtros.estado) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.id_estadoPedido.toString() === filtros.estado
      );
    }

    // Filtrar por proveedor
    if (filtros.proveedor) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreProveedor
          .toLowerCase()
          .includes(filtros.proveedor.toLowerCase())
      );
    }

    // Filtrar por usuario
    if (filtros.usuario) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreUsuario
          .toLowerCase()
          .includes(filtros.usuario.toLowerCase())
      );
    }

    // Filtrar por origen
    if (filtros.origen) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.origen === filtros.origen
      );
    }

    // Filtrar por fechas
    if (filtros.fechaInicio) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) =>
          new Date(pedido.fechaEmision) >= new Date(filtros.fechaInicio)
      );
    }

    if (filtros.fechaFin) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => new Date(pedido.fechaEmision) <= new Date(filtros.fechaFin)
      );
    }

    setPedidosFiltrados(pedidosTemp);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosData, estadosData] = await Promise.all([
        pedidoService.getAll(),
        estadoPedidoService.getAll(),
      ]);

      setPedidos(pedidosData);
      setEstadosPedido(estadosData);

      // Extraer proveedores y usuarios únicos para los filtros
      const proveedores = [
        ...new Set(pedidosData.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(pedidosData.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const cargarPedidos = async () => {
    try {
      const data = await pedidoService.getAll();
      setPedidos(data);

      // Actualizar listas únicas - filtrar valores vacíos/nulos
      const proveedores = [
        ...new Set(data.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(data.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  };

  const cargarInsumosBajoStock = async () => {
    try {
      const data = await insumoService.getBajoStock();
      setInsumosBajoStock(data);
    } catch (error) {
      console.error("Error al cargar insumos bajo stock:", error);
    }
  };

  const aprobarPedido = async (id) => {
    if (
      !confirm(
        "¿Está seguro de que desea aprobar este pedido?\n\nEsto generará un PDF y lo enviará automáticamente al proveedor por email."
      )
    )
      return;

    try {
      const response = await pedidoService.aprobar(id);
      alert(
        `✅ Pedido aprobado exitosamente.\n📧 Email enviado al proveedor: ${
          response.pedido?.nombreProveedor || "Proveedor"
        }`
      );
      cargarPedidos();
    } catch (error) {
      console.error("Error al aprobar pedido:", error);
      alert(
        "❌ Error al aprobar pedido: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const cancelarPedido = async (id) => {
    const motivo = prompt("Ingrese el motivo de cancelación:");
    if (!motivo) return;

    try {
      await pedidoService.cancelar(id, motivo);
      alert("Pedido cancelado exitosamente");
      cargarPedidos();
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      alert("Error al cancelar pedido: " + error.message);
    }
  };

  // Funciones para generación automática
  const abrirGeneracionAutomatica = () => {
    setMostrarAutomatico(true);
  };

  const cerrarGeneracionAutomatica = () => {
    setMostrarAutomatico(false);
  };

  const onGeneracionAutomaticaExitosa = (resultado) => {
    console.log("✅ Generación automática exitosa:", resultado);

    // Mostrar mensaje de éxito
    alert(
      `¡Éxito! ${resultado.message}\n\nTotal pedidos creados: ${resultado.totalPedidosCreados}`
    );

    // Recargar datos
    cargarPedidos();

    // No cerrar el modal inmediatamente para que el usuario vea los resultados
  };

  const onGeneracionAutomaticaError = (error) => {
    console.error("❌ Error en generación automática:", error);
    alert(`Error: ${error}`);
  };

  const verDetallesPedido = async (pedido) => {
    try {
      setLoading(true);
      const pedidoCompleto = await pedidoService.getPedidoCompleto(
        pedido.id_pedido
      );
      setMostrarDetallesPedido(pedidoCompleto);
    } catch (error) {
      console.error("Error al cargar detalles del pedido:", error);
      alert("Error al cargar detalles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPedido = async (id) => {
    if (!confirm("¿Está seguro de que desea eliminar este pedido?")) return;

    try {
      await pedidoService.delete(id);
      alert("Pedido eliminado exitosamente");
      cargarPedidos();
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("Error al eliminar pedido: " + error.message);
    }
  };

  const onSuccessForm = (pedidosCreados) => {
    cargarPedidos();
    setVistaActual("lista");
    setPedidoEditando(null);
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "bg-warning";
      case "Aprobado":
        return "bg-success";
      case "Enviado":
        return "bg-info";
      case "Recibido":
        return "bg-primary";
      case "Cancelado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const exportarPDFPedidos = () => {
    console.log("Botón PDF clickeado, pedidos:", pedidos); // Debug
    // Filtrar solo pedidos aprobados
    const pedidosAprobados = pedidos.filter(
      (p) => p.estadoPedido === "Aprobado"
    );

    if (pedidosAprobados.length === 0) {
      alert("No hay pedidos aprobados para exportar");
      return;
    }

    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text("Reporte de Pedidos Aprobados", 14, 22);

      // Información
      doc.setFontSize(11);
      const nombreUsuario = user
        ? `${user.nombre} ${user.apellido}`
        : "Sistema";
      doc.text(`Generado por: ${nombreUsuario}`, 14, 32);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        14,
        40
      );
      doc.text(
        `Total de pedidos aprobados: ${pedidosAprobados.length}`,
        14,
        48
      );

      // Preparar datos para tabla
      const tableData = pedidosAprobados.map((pedido) => [
        new Date(pedido.fechaEmision).toLocaleDateString("es-ES"),
        pedido.nombreProveedor,
        pedido.nombreUsuario,
        pedido.estadoPedido,
        pedido.fechaAprobacion
          ? new Date(pedido.fechaAprobacion).toLocaleDateString("es-ES")
          : "-",
      ]);

      // Tabla
      autoTable(doc, {
        startY: 60,
        head: [
          [
            "Fecha Emisión",
            "Proveedor",
            "Usuario",
            "Estado",
            "Fecha Aprobación",
          ],
        ],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`pedidos_aprobados_${new Date().getTime()}.pdf`);
      alert("✅ Reporte PDF de pedidos aprobados generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("❌ Error al generar el reporte PDF");
    }
  };

  // Vista de creación de pedido
  if (vistaActual === "crear") {
    return (
      <div className="page-content">
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Crear Nuevo Pedido</h1>
            <p>Complete el formulario para crear un pedido manual</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setVistaActual("lista")}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver a la Lista
            </button>
          </div>
        </div>

        <PedidoFormSimple
          onClose={() => setVistaActual("lista")}
          onSuccess={onSuccessForm}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            {" "}
            <i className="fas fa-boxes-packing me-2"></i> Gestión de Pedidos
          </h1>
          <p>Administre los pedidos de insumos manual y automáticamente</p>
        </div>
        <div className="header-actions">
          <div className="btn-group">
            <button
              className="btn btn-success"
              onClick={() => {
                setPedidoEditando(null);
                setVistaActual("crear");
              }}
            >
              <i className="fas fa-plus me-1"></i>
              Nuevo Pedido Manual
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {insumosBajoStock.length > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
            <div>
              <h5 className="alert-heading mb-1">
                ¡Atención! Insumos con Stock Bajo
              </h5>
              <p className="mb-1">
                Hay {insumosBajoStock.length} insumo(s) con stock crítico o
                agotado.
              </p>
              <small>
                <strong>Insumos afectados:</strong>{" "}
                {insumosBajoStock
                  .slice(0, 3)
                  .map((i) => i.nombreInsumo)
                  .join(", ")}
                {insumosBajoStock.length > 3 &&
                  ` y ${insumosBajoStock.length - 3} más...`}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header text-dark">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Estado:</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
              >
                <option value="">Todos</option>
                {estadosPedido.map((estado, index) => (
                  <option
                    key={estado.id_estadoPedido || `estado-${index}`}
                    value={estado.id_estadoPedido}
                  >
                    {estado.nombreEstado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Proveedor:</label>
              <select
                className="form-select"
                value={filtros.proveedor}
                onChange={(e) =>
                  setFiltros({ ...filtros, proveedor: e.target.value })
                }
              >
                <option value="">Todos</option>
                {proveedoresUnicos.map((proveedor, index) => (
                  <option key={`proveedor-${index}`} value={proveedor}>
                    {proveedor}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Usuario:</label>
              <select
                className="form-select"
                value={filtros.usuario}
                onChange={(e) =>
                  setFiltros({ ...filtros, usuario: e.target.value })
                }
              >
                <option value="">Todos</option>
                {usuariosUnicos.map((usuario, index) => (
                  <option key={`usuario-${index}`} value={usuario}>
                    {usuario}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Origen:</label>
              <select
                className="form-select"
                value={filtros.origen}
                onChange={(e) =>
                  setFiltros({ ...filtros, origen: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="Manual">Manual</option>
                <option value="Generado">Automático</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Desde:</label>
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
              <label className="form-label">Hasta:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="row align-items-center">
            <div className="col-auto mt-3">
              <button
                className="btn btn-danger"
                onClick={exportarPDFPedidos}
                disabled={
                  pedidos.filter((p) => p.estadoPedido === "Aprobado")
                    .length === 0
                }
                title="Exportar solo pedidos aprobados"
              >
                <i className="fas fa-file-pdf me-1"></i>
                Exportar PDF
              </button>
            </div>

            {hayFiltrosAplicados() && (
              <div className="col-auto mt-3">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setFiltros({
                      estado: "",
                      fechaInicio: "",
                      fechaFin: "",
                      proveedor: "",
                      usuario: "",
                      origen: "",
                    })
                  }
                >
                  <i className="fas fa-times me-1"></i>
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center text-dark">
            <h5 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Lista de Pedidos ({pedidosFiltrados.length})
            </h5>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={cargarPedidos}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              Actualizar
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando pedidos...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No se encontraron pedidos</h5>
              <p className="text-muted">
                {pedidos.length === 0
                  ? "No hay pedidos registrados. Cree el primer pedido haciendo clic en 'Nuevo Pedido Manual'"
                  : "No hay pedidos que coincidan con los filtros aplicados. Intente modificar los criterios de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha Emisión</th>
                    <th>Proveedor</th>
                    <th>Usuario</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Fecha Aprobación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido, index) => (
                    <tr key={pedido.id_pedido || `pedido-${index}`}>
                      <td>
                        <strong>{index + 1}</strong>
                      </td>
                      <td>
                        {new Date(pedido.fechaEmision).toLocaleDateString(
                          "es-ES"
                        )}
                      </td>
                      <td>
                        <strong>{pedido.nombreProveedor}</strong>
                      </td>
                      <td>{pedido.nombreUsuario}</td>
                      <td>
                        <span
                          className={`badge ${
                            pedido.origen === "Manual"
                              ? "bg-primary"
                              : "bg-success"
                          }`}
                          title={
                            pedido.origen === "Generado"
                              ? "Pedido generado automáticamente por el sistema"
                              : "Pedido creado manualmente"
                          }
                        >
                          {pedido.origen === "Generado"
                            ? "🤖 Automático"
                            : "👤 Manual"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getEstadoBadgeClass(
                            pedido.estadoPedido
                          )}`}
                        >
                          {pedido.estadoPedido}
                        </span>
                      </td>
                      <td>
                        {pedido.fechaAprobacion ? (
                          <div className="d-flex flex-column">
                            <span className="text-success">
                              {calcularFechaEntrega(
                                pedido.fechaAprobacion
                              ).toLocaleDateString("es-ES")}
                            </span>
                            <small className="text-muted">
                              (Aprobado:{" "}
                              {new Date(
                                pedido.fechaAprobacion
                              ).toLocaleDateString("es-ES")}
                              )
                            </small>
                          </div>
                        ) : pedido.estadoPedido === "Pendiente" ? (
                          <span className="text-warning">
                            <i className="fas fa-clock me-1"></i>
                            Pendiente de aprobación
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <div className="btn-group-sm">
                          <button
                            className="btn btn-outline-info btn-sm me-1"
                            onClick={() => verDetallesPedido(pedido)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {pedido.estadoPedido === "Pendiente" && (
                            <>
                              <button
                                className="btn btn-outline-success btn-sm me-1"
                                onClick={() => aprobarPedido(pedido.id_pedido)}
                                title="Aprobar pedido"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-outline-warning btn-sm me-1"
                                onClick={() => {
                                  setPedidoEditando(pedido);
                                  setVistaActual("crear");
                                }}
                                title="Editar pedido"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </>
                          )}

                          {pedido.estadoPedido !== "Cancelado" && (
                            <button
                              className="btn btn-outline-danger btn-sm me-1"
                              onClick={() => cancelarPedido(pedido.id_pedido)}
                              title="Cancelar pedido"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarPedido(pedido.id_pedido)}
                            title="Eliminar pedido"
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
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {mostrarDetallesPedido && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "0",
              maxWidth: "900px",
              width: "90%",
              maxHeight: "80vh",
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-info-circle me-2"></i>
                Detalles del Pedido
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setMostrarDetallesPedido(null)}
              ></button>
            </div>
            <div
              className="modal-body"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Proveedor:</strong>{" "}
                  {mostrarDetallesPedido.nombreProveedor}
                </div>
                <div className="col-md-6">
                  <strong>Fecha de Emisión:</strong>{" "}
                  {new Date(
                    mostrarDetallesPedido.fechaEmision
                  ).toLocaleDateString("es-ES")}
                </div>
                <div className="col-md-6">
                  <strong>Usuario:</strong>{" "}
                  {mostrarDetallesPedido.nombreUsuario}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong>
                  <span
                    className={`badge ms-2 ${getEstadoBadgeClass(
                      mostrarDetallesPedido.estadoPedido
                    )}`}
                  >
                    {mostrarDetallesPedido.estadoPedido}
                  </span>
                </div>
              </div>

              {mostrarDetallesPedido.observaciones && (
                <div className="mb-3">
                  <strong>Observaciones:</strong>
                  <p className="mt-1">{mostrarDetallesPedido.observaciones}</p>
                </div>
              )}

              <h6>
                <i className="fas fa-list me-2"></i>Insumos del Pedido
              </h6>
              {mostrarDetallesPedido.detalles &&
              mostrarDetallesPedido.detalles.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Unidad</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostrarDetallesPedido.detalles.map((detalle, index) => (
                        <tr
                          key={detalle.id_detallePedido || `detalle-${index}`}
                        >
                          <td>{detalle.nombreInsumo}</td>
                          <td>{detalle.unidadMedida}</td>
                          <td>
                            {detalle.cantidad || detalle.cantidadSolicitada}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">
                  No hay detalles disponibles para este pedido.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMostrarDetallesPedido(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Generación Automática */}
      <PedidoAutomaticoForm
        isVisible={mostrarAutomatico}
        onClose={cerrarGeneracionAutomatica}
        onSuccess={onGeneracionAutomaticaExitosa}
        onError={onGeneracionAutomaticaError}
      />
    </div>
  );
};

export default PedidoInsumo;
