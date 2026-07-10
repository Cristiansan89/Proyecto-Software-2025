import { useEffect, useState } from "react";
import CocineraTelegran from "../../styles/CocineraTelegram.module.css";

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
    <div className={CocineraTelegran.containerTelegram}>
      <div className={CocineraTelegran.successOverlay}>
        <div className={CocineraTelegran.successCard}>
          <div className={CocineraTelegran.successIcon}>✅</div>
          <h1 className={CocineraTelegran.successTitle}>{mensaje}</h1>
          <p className={CocineraTelegran.successMessage}>
            Se ha generado el pedido automático de insumos faltantes
            correctamente.
          </p>

          <div className={CocineraTelegran.successDetails}>
            <div className={CocineraTelegran.detailItem}>
              <span className={CocineraTelegran.detailLabel}>
                Pedidos Creados:
              </span>
              <span className={CocineraTelegran.detailValue}>
                {pedidosCreados}
              </span>
            </div>
            <div className={CocineraTelegran.detailItem}>
              <span className={CocineraTelegran.detailLabel}>
                Fecha y Hora:
              </span>
              <span className={CocineraTelegran.detailValue}>
                {new Date().toLocaleString("es-ES")}
              </span>
            </div>
            <div className={CocineraTelegran.detailItem}>
              <span className={CocineraTelegran.detailLabel}>Estado:</span>
              <span className={CocineraTelegran.detailValue}>
                ✅ Completado
              </span>
            </div>
          </div>

          <button className={CocineraTelegran.btnSalir} onClick={handleSalir}>
            🔚 Salir del Sistema
          </button>

          <p className={CocineraTelegran.footerText}>
            Los proveedores recibirán la información del pedido automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocineraTelegramExitoso;
