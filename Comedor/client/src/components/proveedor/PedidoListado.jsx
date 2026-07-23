import PedidoStyle from "../../styles/Pedido.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const PedidoListado = ({ pedido, onClose }) => {
  const convertirCantidad = (cantidad) => {
    const cantidadNum = Number(cantidad) || 0;
    return Math.round(cantidadNum * 100) / 100;
  };

  const transformarEstado = (estado) => {
    if (estado === "Recibido") return "Entregado";
    return estado;
  };

  if (!pedido) {
    return null;
  }

  const getEstadoBadgeClass = (estado) => {
    if (estado === "Disponible") return PedidoStyle.disponible;
    if (estado === "No Disponible") return PedidoStyle.noDisponible;
    return PedidoStyle.pendiente;
  };

  return (
    <div>
      <div className="card mb-4 border-0 shadow-sm">
        <div className={PedidoStyle.infoPedido}>
          <div className={PedidoStyle.infoFila}>
            <span className={PedidoStyle.infoLabel}>Número de Pedido:</span>
            <span className={PedidoStyle.infoValor}>{pedido.numeroPedido}</span>
          </div>
          <div className={PedidoStyle.infoFila}>
            <span className={PedidoStyle.infoLabel}>Fecha de Solicitud:</span>
            <span className={PedidoStyle.infoValor}>
              {new Date(pedido.fechaSolicitud).toLocaleDateString("es-ES")}
            </span>
          </div>
          <div className={PedidoStyle.infoFila}>
            <span className={PedidoStyle.infoLabel}>Fecha de Entrega:</span>
            <span className={PedidoStyle.infoValor}>
              {new Date(pedido.fechaEntregaSolicitada).toLocaleDateString(
                "es-ES",
              )}
            </span>
          </div>
          <div className={PedidoStyle.infoFila}>
            <span className={PedidoStyle.infoLabel}>Estado:</span>
            <span className={PedidoStyle.infoValor}>
              {transformarEstado(pedido.estado)}
            </span>
          </div>
        </div>
      </div>

      <div className={PedidoStyle.tablaInsumos}>
        <h3 className={PedidoStyle.pageTitle}>Insumos del pedido</h3>

        {pedido.detalles && pedido.detalles.length > 0 ? (
          <table className={PedidoStyle.tablaDetalles}>
            <thead>
              <tr>
                <th className="fw-bold">#</th>
                <th className="fw-bold">Nombre</th>
                <th className="fw-bold">Cantidad</th>
                <th className="fw-bold">Unidad de Medida</th>
                <th className="fw-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((detalle, index) => (
                <tr key={`${detalle.nombreInsumo}-${index}`}>
                  <td className="fw-bold">{index + 1}</td>
                  <td className={PedidoStyle.nameInsumo}>
                    {detalle.nombreInsumo}
                  </td>
                  <td className={PedidoStyle.cantidadValor}>
                    {convertirCantidad(detalle.cantidadSolicitada)}
                  </td>
                  <td>{detalle.unidadMedida}</td>
                  <td>
                    <span
                      className={`${PedidoStyle.estadoInsumo} ${getEstadoBadgeClass(detalle.estado || pedido.estado)}`}
                    >
                      {transformarEstado(detalle.estado || pedido.estado)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={PedidoStyle.sinDetalles}>
            No hay insumos asociados a este pedido.
          </p>
        )}
      </div>

      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} me-2`}
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PedidoListado;
