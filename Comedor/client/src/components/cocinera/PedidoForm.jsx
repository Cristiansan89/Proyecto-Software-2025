import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import pedidoService from "../../services/pedidoService";
import insumoService from "../../services/insumoService";
import proveedorService from "../../services/proveedorService";

const PedidoForm = ({ onClose, onSuccess, pedidoEditado = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);
  const [formData, setFormData] = useState({
    fechaEntregaEsperada: "",
    observaciones: "",
    tipoPedido: "manual", // manual o automatico
  });

  // Estado para manejar el modal de selección de insumos
  const [modalInsumos, setModalInsumos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [categorias] = useState([
    "Carnes y proteínas",
    "Condimentos",
    "Cereales",
    "Enlatados",
    "Limpieza",
    "Bebidas",
    "Verduras",
    "Frutas",
    "Descartables",
    "Legumbres",
    "Lacteos",
    "Otros"
  ]);

  useEffect(() => {
    cargarDatos();
    if (pedidoEditado) {
      // Cargar datos del pedido a editar
      setFormData({
        fechaEntregaEsperada: pedidoEditado.fechaEntregaEsperada || "",
        observaciones: pedidoEditado.observaciones || "",
        tipoPedido: pedidoEditado.origen === "Manual" ? "manual" : "automatico",
      });
    }
  }, [pedidoEditado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [insumosData, proveedoresData] = await Promise.all([
        insumoService.getActivos(),
        proveedorService.getActivos(),
      ]);
      setInsumos(insumosData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const agregarInsumo = (insumo) => {
    const existe = insumosSeleccionados.find(
      (item) => item.id_insumo === insumo.id_insumo
    );
    if (!existe) {
      setInsumosSeleccionados((prev) => [
        ...prev,
        {
          id_insumo: insumo.id_insumo,
          nombreInsumo: insumo.nombreInsumo,
          unidadMedida: insumo.unidadMedida,
          categoria: insumo.categoria,
          stockActual: insumo.stockActual,
          cantidad: 1,
          id_proveedor: "",
          nombreProveedor: "",
        },
      ]);
      setModalInsumos(false);
    } else {
      alert("Este insumo ya está agregado al pedido");
    }
  };

  const quitarInsumo = (idInsumo) => {
    setInsumosSeleccionados((prev) =>
      prev.filter((item) => item.id_insumo !== idInsumo)
    );
  };

  const actualizarCantidad = (idInsumo, cantidad) => {
    if (cantidad <= 0) return;
    setInsumosSeleccionados((prev) =>
      prev.map((item) =>
        item.id_insumo === idInsumo
          ? { ...item, cantidad: Number(cantidad) }
          : item
      )
    );
  };

  const actualizarProveedor = async (idInsumo, idProveedor) => {
    const proveedor = proveedores.find((p) => p.idProveedor === idProveedor);
    setInsumosSeleccionados((prev) =>
      prev.map((item) =>
        item.id_insumo === idInsumo
          ? {
              ...item,
              id_proveedor: idProveedor,
              nombreProveedor: proveedor?.razonSocial || "",
            }
          : item
      )
    );
  };

  const buscarMejoresProveedores = async (idInsumo) => {
    try {
      const mejoresProveedores = await proveedorService.getMejoresProveedores(
        idInsumo
      );
      if (mejoresProveedores.length > 0) {
        // Auto-seleccionar el mejor proveedor
        actualizarProveedor(idInsumo, mejoresProveedores[0].id_proveedor);
        alert(
          `Auto-seleccionado: ${mejoresProveedores[0].razonSocial} (${mejoresProveedores[0].calificacion})`
        );
      } else {
        alert("No se encontraron proveedores para este insumo");
      }
    } catch (error) {
      console.error("Error al buscar proveedores:", error);
      alert("Error al buscar proveedores: " + error.message);
    }
  };

  const validarFormulario = () => {
    if (insumosSeleccionados.length === 0) {
      alert("Debe agregar al menos un insumo al pedido");
      return false;
    }

    // Validar que todos los insumos tengan proveedor y cantidad
    const insumosSinProveedor = insumosSeleccionados.filter(
      (item) => !item.id_proveedor
    );
    if (insumosSinProveedor.length > 0) {
      alert(
        `Los siguientes insumos no tienen proveedor asignado: ${insumosSinProveedor
          .map((i) => i.nombreInsumo)
          .join(", ")}`
      );
      return false;
    }

    const insumosConCantidadInvalida = insumosSeleccionados.filter(
      (item) => !item.cantidad || item.cantidad <= 0
    );
    if (insumosConCantidadInvalida.length > 0) {
      alert("Todos los insumos deben tener una cantidad válida mayor a 0");
      return false;
    }

    return true;
  };

  const crearPedido = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const datosPedido = {
        insumos: insumosSeleccionados.map((item) => ({
          id_insumo: item.id_insumo,
          id_proveedor: item.id_proveedor,
          cantidad: item.cantidad,
        })),
        fechaEntregaEsperada: formData.fechaEntregaEsperada || null,
        observaciones: formData.observaciones || null,
        id_usuario: user?.idUsuario || user?.id_usuario,
      };

      const pedidosCreados = await pedidoService.crearPedidoManual(datosPedido);

      alert(
        `Pedido creado exitosamente. Se generaron ${pedidosCreados.length} pedido(s) por proveedor.`
      );
      if (onSuccess) onSuccess(pedidosCreados);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al crear pedido:", error);
      alert("Error al crear el pedido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const insumosFiltrados = insumos.filter((insumo) => {
    const cumpleFiltroCategoria =
      !filtroCategoria || insumo.categoria === filtroCategoria;
    const cumpleBusqueda =
      !busquedaInsumo ||
      insumo.nombreInsumo.toLowerCase().includes(busquedaInsumo.toLowerCase());
    return cumpleFiltroCategoria && cumpleBusqueda;
  });

  if (loading && insumos.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="pedido-form">
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">
            <i className="fas fa-shopping-cart me-2"></i>
            {pedidoEditado ? "Editar Pedido" : "Nuevo Pedido Manual"}
          </h4>
        </div>
        <div className="card-body">
          {/* Información básica del pedido */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">
                <i className="fas fa-calendar-alt me-1"></i>
                Fecha de Entrega Esperada
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.fechaEntregaEsperada}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fechaEntregaEsperada: e.target.value,
                  })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                <i className="fas fa-info-circle me-1"></i>
                Tipo de Pedido
              </label>
              <select
                className="form-select"
                value={formData.tipoPedido}
                onChange={(e) =>
                  setFormData({ ...formData, tipoPedido: e.target.value })
                }
                disabled={pedidoEditado} // No permitir cambiar en edición
              >
                <option value="manual">Manual</option>
                <option value="automatico">Automático</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">
              <i className="fas fa-comment me-1"></i>
              Observaciones
            </label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Observaciones adicionales (opcional)"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              maxLength={255}
            />
            <div className="form-text">
              {formData.observaciones.length}/255 caracteres
            </div>
          </div>

          {/* Lista de insumos seleccionados */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Insumos del Pedido ({insumosSeleccionados.length})
              </h5>
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={() => setModalInsumos(true)}
              >
                <i className="fas fa-plus me-1"></i>
                Agregar Insumo
              </button>
            </div>

            {insumosSeleccionados.length === 0 ? (
              <div className="alert alert-info text-center">
                <i className="fas fa-info-circle me-2"></i>
                No hay insumos agregados. Haga clic en "Agregar Insumo" para
                comenzar.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Stock Actual</th>
                      <th>Cantidad</th>
                      <th>Proveedor</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosSeleccionados.map((item) => (
                      <tr key={item.id_insumo}>
                        <td>
                          <div>
                            <strong>{item.nombreInsumo}</strong>
                            <br />
                            <small className="text-muted">
                              {item.categoria} - {item.unidadMedida}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.stockActual <= 5
                                ? "bg-danger"
                                : item.stockActual <= 20
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                          >
                            {item.stockActual} {item.unidadMedida}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: "100px" }}
                            min="1"
                            step="0.01"
                            value={item.cantidad}
                            onChange={(e) =>
                              actualizarCantidad(item.id_insumo, e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <select
                              className="form-select"
                              value={item.id_proveedor}
                              onChange={(e) =>
                                actualizarProveedor(
                                  item.id_insumo,
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Seleccionar proveedor...</option>
                              {proveedores.map((proveedor) => (
                                <option value={proveedor.idProveedor}>
                                  {proveedor.razonSocial}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline-info btn-sm"
                              title="Buscar mejores proveedores"
                              onClick={() =>
                                buscarMejoresProveedores(item.id_insumo)
                              }
                            >
                              <i className="fas fa-search"></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => quitarInsumo(item.id_insumo)}
                            title="Quitar insumo"
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

          {/* Resumen del pedido */}
          {insumosSeleccionados.length > 0 && (
            <div className="alert alert-light">
              <h6>
                <i className="fas fa-chart-pie me-2"></i>Resumen del Pedido
              </h6>
              <div className="row">
                <div className="col-md-4">
                  <strong>Total de Insumos:</strong>{" "}
                  {insumosSeleccionados.length}
                </div>
                <div className="col-md-4">
                  <strong>Proveedores Involucrados:</strong>{" "}
                  {
                    new Set(
                      insumosSeleccionados
                        .map((i) => i.id_proveedor)
                        .filter(Boolean)
                    ).size
                  }
                </div>
                <div className="col-md-4">
                  <strong>Fecha de Pedido:</strong>{" "}
                  {new Date().toLocaleDateString("es-ES")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="card-footer d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={crearPedido}
            disabled={loading || insumosSeleccionados.length === 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creando...
              </>
            ) : (
              <>
                <i className="fas fa-check me-1"></i>
                {pedidoEditado ? "Actualizar Pedido" : "Crear Pedido"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal para seleccionar insumos */}
      {modalInsumos && (
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
              maxWidth: "800px",
              width: "90%",
              maxHeight: "80vh",
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-search me-2"></i>
                Seleccionar Insumos
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalInsumos(false)}
              ></button>
            </div>
            <div className="modal-body">
              {/* Filtros */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Filtrar por categoría:</label>
                  <select
                    className="form-select"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Buscar insumo:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escriba el nombre del insumo..."
                    value={busquedaInsumo}
                    onChange={(e) => setBusquedaInsumo(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de insumos */}
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {insumosFiltrados.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <p>No se encontraron insumos con los filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Insumo</th>
                          <th>Categoría</th>
                          <th>Stock Actual</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumosFiltrados.map((insumo) => {
                          const yaSeleccionado = insumosSeleccionados.some(
                            (item) => item.id_insumo === insumo.id_insumo
                          );
                          return (
                            <tr
                              key={insumo.id_insumo}
                              className={
                                yaSeleccionado ? "table-secondary" : ""
                              }
                            >
                              <td>
                                <div>
                                  <strong>{insumo.nombreInsumo}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {insumo.unidadMedida}
                                  </small>
                                  {insumo.descripcion && (
                                    <>
                                      <br />
                                      <small>{insumo.descripcion}</small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-secondary">
                                  {insumo.categoria}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    insumo.stockActual <= 5
                                      ? "bg-danger"
                                      : insumo.stockActual <= 20
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {insumo.stockActual} {insumo.unidadMedida}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className={`btn ${
                                    yaSeleccionado
                                      ? "btn-secondary"
                                      : "btn-outline-success"
                                  } btn-sm`}
                                  onClick={() => agregarInsumo(insumo)}
                                  disabled={yaSeleccionado}
                                >
                                  {yaSeleccionado ? (
                                    <>
                                      <i className="fas fa-check me-1"></i>
                                      Agregado
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-plus me-1"></i>
                                      Agregar
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalInsumos(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoForm;
