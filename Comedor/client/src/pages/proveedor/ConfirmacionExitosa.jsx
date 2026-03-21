import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { showWarning } from "../../utils/alertService";
import "./confirmacionProveedor.css";

const ConfirmacionExitosa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const [segundosRestantes, setSegundosRestantes] = useState(10);

  useEffect(() => {
    // Actualizar contador cada segundo
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          cerrarVentana();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const cerrarVentana = () => {
    // Intentar cerrar con Telegram WebApp si está disponible
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      // Fallback: intentar cerrar la ventana del navegador
      try {
        window.close();
      } catch (err) {
        // Si no se puede cerrar, mostrar advertencia
        showWarning(
          "Aviso",
          "No se pudo cerrar la ventana automáticamente. Por favor, ciérrela manualmente.",
        );
      }
    }
  };

  return (
    <div className="confirmacion-exitosa-container">
      {/* Header */}
      <div className="header-exitosa">
        <div className="header-content">
          <h1>🎉 ¡Confirmación Exitosa!</h1>
          <p>Su confirmación fue procesada correctamente</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="contenido-exitosa">
        {/* Icono de éxito */}
        <div className="icono-success">
          <div className="checkmark">✅</div>
        </div>

        {/* Información de la confirmación */}
        <div className="info-confirmacion">
          <h2>Resumen de la Confirmación</h2>

          {state.proveedor && (
            <div className="info-item">
              <span className="label">🏢 Proveedor:</span>
              <span className="valor">{state.proveedor}</span>
            </div>
          )}

          {state.pedido && (
            <div className="info-item">
              <span className="label">📋 Número de Pedido:</span>
              <span className="valor">{state.pedido.slice(0, 8)}...</span>
            </div>
          )}

          <div className="estadisticas">
            <div className="stat-box stat-confirmado">
              <div className="stat-numero">{state.confirmadas || 0}</div>
              <div className="stat-texto">Insumos Disponibles</div>
            </div>

            <div className="stat-box stat-rechazado">
              <div className="stat-numero">{state.rechazadas || 0}</div>
              <div className="stat-texto">No Disponibles</div>
            </div>
          </div>

          {state.mensaje && (
            <div className="mensaje-confirmacion">
              <p>{state.mensaje}</p>
            </div>
          )}
        </div>

        {/* Instrucciones Finales */}
        <div className="instrucciones-finales">
          <h3>¿Qué sucede ahora?</h3>
          <ul>
            <li>✅ Su confirmación ha sido registrada en el sistema</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="botones-accion">
          <button className="btn-cerrar" onClick={cerrarVentana}>
            🔒 Cerrar Sistema
          </button>
        </div>

        {/* Aviso de cierre automático */}
        <div className="aviso-cierre">
          <p>El sistema se cerrará automáticamente en</p>
          <strong>{segundosRestantes} segundos</strong>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-exitosa">
        <p className="textcolor">Gracias por su colaboración en el Sistema de Gestión de Comedor</p>
        <p className="timestamp">
          Confirmación procesada: {new Date().toLocaleString("es-ES")}
        </p>
      </div>

      {/* Footer con información de contacto */}
      <div className="footer-contacto">
        <p className="textcolor">
          Si tiene alguna consulta, puede contactarnos al <br />
          <a href="tel:+543764239133">+54 (376) 4239133</a> o{" "}
          <a href="mailto:crisanz89@gmail.com">crisanz89@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default ConfirmacionExitosa;
