import PedidoStyle from "../../styles/Pedido.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const PedidoVista = ({ detallesPedido, onClose }) => {
  const convertirCantidad = (cantidad, unidad) => {
    const cantidadNum = Number(cantidad) || 0;
    // Mostrar la cantidad tal cual está almacenada
    return Math.round(cantidadNum * 100) / 100;
  };

  return (
    <div>
      <div>
        {/* Información del Pedido */}
        <div className="card mb-4">
          <div className={PedidoStyle.infoPedido}>
            <div className={PedidoStyle.infoFila}>
              <span className={PedidoStyle.infoLabel}>Proveedor:</span>
              <span className={PedidoStyle.infoValor}>
                {detallesPedido.razonSocial}
              </span>
            </div>
            <div className={PedidoStyle.infoFila}>
              <span className={PedidoStyle.infoLabel}>Email:</span>
              <span className={PedidoStyle.infoValor}>
                {detallesPedido.mail}
              </span>
            </div>
            <div className={PedidoStyle.infoFila}>
              <span className={PedidoStyle.infoLabel}>Teléfono:</span>
              <span className={PedidoStyle.infoValor}>
                {detallesPedido.telefono}
              </span>
            </div>
            <div className={PedidoStyle.infoFila}>
              <span className={PedidoStyle.infoLabel}>Pedido Nº:</span>
              <span className={PedidoStyle.infoValor}>
                {detallesPedido.id_pedido_uuid.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className={PedidoStyle.infoFila}>
              <span className={PedidoStyle.infoLabel}>Fecha Emisión:</span>
              <span className={PedidoStyle.infoValor}>
                {new Date(detallesPedido.fechaEmision).toLocaleDateString(
                  "es-ES",
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Insumos */}
        <div className={PedidoStyle.tablaInsumos}>
          <h3 className={PedidoStyle.pageTitle}>
            Insumos Confirmados/Rechazados
          </h3>
          {detallesPedido.detalles && detallesPedido.detalles.length > 0 ? (
            <table className={PedidoStyle.tablaDetalles}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                  <th>Fecha Confirmación</th>
                </tr>
              </thead>
              <tbody>
                {detallesPedido.detalles.map((detalle) => (
                  <tr
                    key={detalle.id_detallePedido_hex}
                    className={`fila-${detalle.estadoConfirmacion.toLowerCase()}`}
                  >
                    <td className={PedidoStyle.nameInsumo}>
                      {detalle.nombreInsumo}
                    </td>
                    <td className={PedidoStyle.cantidadValor}>
                      {convertirCantidad(
                        detalle.cantidadSolicitada,
                        detalle.unidadMedida,
                      )}
                    </td>
                    <td>{detalle.unidadMedida}</td>
                    <td>
                      <span
                        className={`${PedidoStyle.estadoInsumo} ${
                          detalle.estadoConfirmacion === "Disponible"
                            ? PedidoStyle.disponible
                            : PedidoStyle.noDisponible
                        }`}
                      >
                        {detalle.estadoConfirmacion === "Disponible"
                          ? "✓ Disponible"
                          : "✗ No Disponible"}
                      </span>
                    </td>
                    <td className={PedidoStyle.fechaConfirmacion}>
                      {detalle.fechaConfirmacion
                        ? new Date(
                            detalle.fechaConfirmacion,
                          ).toLocaleDateString("es-ES")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={PedidoStyle.sinDetalles}>
              No hay detalles de confirmación
            </p>
          )}
        </div>

        {/* Resumen */}
        <div className={PedidoStyle.resumenConfirmacion}>
          <div className={PedidoStyle.itemResumen}>
            <span className={PedidoStyle.labelResumen}>Confirmados:</span>
            <span
              className={`${PedidoStyle.valorResumen} ${PedidoStyle.confirmado}`}
            >
              {detallesPedido.insumosConfirmados}
            </span>
          </div>
          <div className={PedidoStyle.itemResumen}>
            <span className={PedidoStyle.labelResumen}>Rechazados:</span>
            <span
              className={`${PedidoStyle.valorResumen} ${PedidoStyle.rechazado}`}
            >
              {detallesPedido.insumosRechazados}
            </span>
          </div>
          <div className={PedidoStyle.itemResumen}>
            <span className={PedidoStyle.labelResumen}>Pendientes:</span>
            <span
              className={`${PedidoStyle.valorResumen} ${PedidoStyle.pendiente}`}
            >
              {detallesPedido.insumosPendientes}
            </span>
          </div>
        </div>
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

export default PedidoVista;
