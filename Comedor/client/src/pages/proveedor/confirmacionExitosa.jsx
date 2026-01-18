import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./confirmacionExitosa.css";

const ConfirmacionExitosa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mostrandoResumen, setMostrandoResumen] = useState(false);

  const {
    mensaje = "Confirmación exitosa",
    confirmadas = 0,
    rechazadas = 0,
    proveedor = "",
    pedido = "",
    nuevoPedidoCreado = false,
    nuevoPedidoId = "",
    insumosRedistribuidos = 0,
  } = location.state || {};

  useEffect(() => {
    // Mostrar resumen después de 1 segundo
    const timer = setTimeout(() => {
      setMostrandoResumen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCerrar = () => {
    navigate("/");
  };

  return (
    <div className="confirmacion-exitosa-container">
      <div className="confirmacion-exitosa-card">
        {/* Icono de éxito animado */}
        <div className="success-icon-container">
          <div className="success-icon">
            <div className="checkmark">✓</div>
          </div>
        </div>

        {/* Mensaje principal */}
        <h1 className="success-title">¡Confirmación Exitosa!</h1>
        <p className="success-message">{mensaje}</p>

        {/* Información del proveedor y pedido */}
        <div className="pedido-info">
          <div className="info-row">
            <span className="info-label">Proveedor:</span>
            <span className="info-value">{proveedor}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Pedido:</span>
            <span className="info-value">{pedido.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Resumen de confirmaciones */}
        {mostrandoResumen && (
          <div className="resumen-confirmaciones">
            <h3>Resumen de Confirmaciones</h3>

            <div className="stats-grid">
              <div className="stat-card stat-confirmadas">
                <div className="stat-number">{confirmadas}</div>
                <div className="stat-label">Confirmados</div>
                <div className="stat-icon">✅</div>
              </div>

              <div className="stat-card stat-rechazadas">
                <div className="stat-number">{rechazadas}</div>
                <div className="stat-label">No Disponibles</div>
                <div className="stat-icon">❌</div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de seguimiento */}
        <div className="seguimiento-mensaje">
          <p>
            <strong>🔔 Próximos pasos:</strong>
          </p>
          <ul>
            <li>Sus confirmaciones han sido registradas en el sistema</li>
            <li>La Cocinera será notificada automáticamente</li>
            {nuevoPedidoCreado && (
              <li>
                Los insumos no disponibles serán procesados automáticamente
              </li>
            )}
            <li>Recibirá confirmación de entrega por email</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="acciones-container">
          <button className="btn-cerrar" onClick={handleCerrar}>
            <span className="btn-icon">🏠</span>
            Finalizar
          </button>
        </div>

        {/* Footer con información de contacto */}
        <div className="footer-contacto">
          <p>
            Si tiene alguna consulta, puede contactarnos al{" "}
            <a href="tel:+3764239133">(376) 4239133</a> o{" "}
            <a href="mailto:crisanz89@gmail.com">crisanz89@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionExitosa;
