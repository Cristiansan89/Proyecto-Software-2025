import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { showWarning } from "../../utils/alertService";
import ConfirmacionesStyle from "../../styles/Confirmaciones.module.css";

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
    <div className={ConfirmacionesStyle.confirmacionExitosa}>
      {/* Header */}
      <div className={ConfirmacionesStyle.headerExitosa}>
        <div className={ConfirmacionesStyle.headerContent}>
          <h1>🎉 ¡Confirmación Exitosa!</h1>
          <p>Su confirmación fue procesada correctamente</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className={ConfirmacionesStyle.contenidoExitosa}>
        {/* Icono de éxito */}
        <div className={ConfirmacionesStyle.iconoSuccess}>
          <div className={ConfirmacionesStyle.checkmark}>✅</div>
        </div>

        {/* Información de la confirmación */}
        <div className={ConfirmacionesStyle.infoConfirmacion}>
          <h2>Resumen de la Confirmación</h2>

          {state.proveedor && (
            <div className={ConfirmacionesStyle.itemInfo}>
              <span className={ConfirmacionesStyle.label}>🏢 Proveedor:</span>
              <span className={ConfirmacionesStyle.valor}>
                {state.proveedor}
              </span>
            </div>
          )}

          {state.pedido && (
            <div className={ConfirmacionesStyle.itemInfo}>
              <span className={ConfirmacionesStyle.label}>
                📋 Número de Pedido:
              </span>
              <span className={ConfirmacionesStyle.valor}>
                {state.pedido.slice(0, 8)}...
              </span>
            </div>
          )}

          <div className={ConfirmacionesStyle.estadisticas}>
            <div
              className={`${ConfirmacionesStyle.statBox} ${ConfirmacionesStyle.statConfirmado}`}
            >
              <div className={ConfirmacionesStyle.statNumero}>
                {state.confirmadas || 0}
              </div>
              <div className={ConfirmacionesStyle.statTexto}>
                Insumos Disponibles
              </div>
            </div>

            <div
              className={`${ConfirmacionesStyle.statBox} ${ConfirmacionesStyle.statRechazado}`}
            >
              <div className={ConfirmacionesStyle.statNumero}>
                {state.rechazadas || 0}
              </div>
              <div className={ConfirmacionesStyle.statTexto}>
                No Disponibles
              </div>
            </div>
          </div>

          {state.mensaje && (
            <div className={ConfirmacionesStyle.mensajeConfirmacion}>
              <p>{state.mensaje}</p>
            </div>
          )}
        </div>

        {/* Instrucciones Finales */}
        <div className={ConfirmacionesStyle.instruccionesFinales}>
          <h3>¿Qué sucede ahora?</h3>
          <ul>
            <li>✅ Su confirmación ha sido registrada en el sistema</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div>
          <button
            className={ConfirmacionesStyle.btnCerrar}
            onClick={cerrarVentana}
          >
            🔒 Cerrar Sistema
          </button>
        </div>

        {/* Aviso de cierre automático */}
        <div className={ConfirmacionesStyle.avisoCierre}>
          <p>El sistema se cerrará automáticamente en</p>
          <strong>{segundosRestantes} segundos</strong>
        </div>
      </div>

      {/* Footer */}
      <div className={ConfirmacionesStyle.footerExitosa}>
        <p>Gracias por su colaboración en el Sistema de Gestión de Comedor</p>
        <p className={ConfirmacionesStyle.timestamp}>
          Confirmación procesada: {new Date().toLocaleString("es-ES")}
        </p>
      </div>

      {/* Footer con información de contacto */}
      <div className={ConfirmacionesStyle.footerContacto}>
        <p>
          Si tiene alguna consulta, puede contactarnos al <br />
          <a href="tel:+543764239133">+54 (376) 4239133</a> o{" "}
          <a href="mailto:crisanz89@gmail.com">crisanz89@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default ConfirmacionExitosa;
