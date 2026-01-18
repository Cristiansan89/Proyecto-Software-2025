const PedidoVista = ({ detallesPedido, onClose }) => {
  const convertirCantidad = (cantidad, unidad) => {
    const cantidadNum = Number(cantidad) || 0;
    if (
      (unidad.includes("Gramo") || unidad.includes("Mililitro")) &&
      cantidadNum > 1000
    ) {
      return Math.round((cantidadNum / 1000) * 100) / 100;
    }
    return cantidadNum;
  };

  return (
    <div>
      <div>
        {/* Información del Pedido */}
        <div className="card mb-4">
          <div className="info-pedido">
            <div className="info-fila">
              <span className="info-label">Proveedor:</span>
              <span className="info-valor">{detallesPedido.razonSocial}</span>
            </div>
            <div className="info-fila">
              <span className="info-label">Email:</span>
              <span className="info-valor">{detallesPedido.mail}</span>
            </div>
            <div className="info-fila">
              <span className="info-label">Teléfono:</span>
              <span className="info-valor">{detallesPedido.telefono}</span>
            </div>
            <div className="info-fila">
              <span className="info-label">Pedido Nº:</span>
              <span className="info-valor">
                {detallesPedido.id_pedido_uuid.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="info-fila">
              <span className="info-label">Fecha Emisión:</span>
              <span className="info-valor">
                {new Date(detallesPedido.fechaEmision).toLocaleDateString(
                  "es-ES",
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Insumos */}
        <div className="tabla-insumos-detalles">
          <h3 className="page-title">Insumos Confirmados/Rechazados</h3>
          {detallesPedido.detalles && detallesPedido.detalles.length > 0 ? (
            <table className="tabla-detalles">
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
                    <td className="insumo-nombre">{detalle.nombreInsumo}</td>
                    <td className="cantidad-valor">
                      {convertirCantidad(
                        detalle.cantidadSolicitada,
                        detalle.unidadMedida,
                      )}
                    </td>
                    <td>{detalle.unidadMedida}</td>
                    <td>
                      <span
                        className={`estado-insumo ${
                          detalle.estadoConfirmacion === "Disponible"
                            ? "disponible"
                            : "no-disponible"
                        }`}
                      >
                        {detalle.estadoConfirmacion === "Disponible"
                          ? "✓ Disponible"
                          : "✗ No Disponible"}
                      </span>
                    </td>
                    <td className="fecha-confirmacion">
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
            <p className="sin-detalles">No hay detalles de confirmación</p>
          )}
        </div>

        {/* Resumen */}
        <div className="resumen-confirmacion">
          <div className="resumen-item">
            <span className="resumen-label">Confirmados:</span>
            <span className="resumen-valor confirmado">
              {detallesPedido.insumosConfirmados}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Rechazados:</span>
            <span className="resumen-valor rechazado">
              {detallesPedido.insumosRechazados}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Pendientes:</span>
            <span className="resumen-valor pendiente">
              {detallesPedido.insumosPendientes}
            </span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary me-2"
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
