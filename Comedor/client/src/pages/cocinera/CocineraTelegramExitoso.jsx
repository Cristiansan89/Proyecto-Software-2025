import { useEffect, useState } from "react";
import "../../styles/CocineraTelegram.css";

const CocineraTelegramExitoso = () => {
  const [pedidosCreados, setPedidosCreados] = useState(1);
  const [mensaje, setMensaje] = useState("¡Pedido Registrado Exitosamente!");

  useEffect(() => {
    // Obtener datos del sessionStorage
    const datosExitosos = sessionStorage.getItem("pedidoExitoso");
    if (datosExitosos) {
      try {
        const datos = JSON.parse(datosExitosos);
        setPedidosCreados(datos.pedidosCreados || 1);
        setMensaje(datos.mensaje || "¡Pedido Registrado Exitosamente!");
        console.log("✅ Datos del pedido exitoso cargados:", datos);
      } catch (error) {
        console.error("Error parsing pedidoExitoso:", error);
      }
    }
    
    // Limpiar sessionStorage cuando se carga esta página para evitar reutilización
    return () => {
      sessionStorage.removeItem("pedidoExitoso");
    };
  }, []);

  const handleSalir = () => {
    if (window.opener) {
      window.close();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="cocinera-telegram-container">
      <div className="success-overlay">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1 className="success-title">{mensaje}</h1>
          <p className="success-message">
            Se ha generado el pedido automático de insumos faltantes correctamente.
          </p>

          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Pedidos Creados:</span>
              <span className="detail-value">{pedidosCreados}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha y Hora:</span>
              <span className="detail-value">
                {new Date().toLocaleString("es-ES")}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className="detail-value">✅ Completado</span>
            </div>
          </div>

          <button className="btn-salir" onClick={handleSalir}>
            🔚 Salir del Sistema
          </button>

          <p className="footer-text">
            Los proveedores recibirán la información del pedido automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocineraTelegramExitoso;
