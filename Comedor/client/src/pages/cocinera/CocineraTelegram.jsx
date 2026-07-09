import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import "../../styles/CocineraTelegram.css";

// Función para formatear números con localización española (coma decimal, punto separador de miles)
const formatearNumero = (numero, decimales = 2) => {
  return parseFloat(numero).toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

const CocineraTelegram = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creandoPedido, setCreandoPedido] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState([]);
  const [hayPlanificacion, setHayPlanificacion] = useState(false);

  // Obtener insumos faltantes al cargar la página
  useEffect(() => {
    cargarInsumosFaltantes();
  }, []);

  const cargarInsumosFaltantes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        "/alertas-inventario/web/insumos-faltantes",
      );
      if (response.data.success) {
        setInsumos(response.data.insumos || []);
        setDiasRestantes(response.data.diasRestantes || []);
        setHayPlanificacion(response.data.hayPlanificacion || false);
        if (!response.data.insumos || response.data.insumos.length === 0) {
          setError(response.data.message || "No hay insumos que requieran pedido esta semana.");
        }
      } else {
        setError(response.data.message || "Error al obtener insumos");
      }
    } catch (err) {
      console.error("Error al cargar insumos:", err);
      setError(err.response?.data?.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRealizarPedido = async () => {
    // 1. Bloqueo inmediato para evitar clics dobles
    if (creandoPedido) return;

    console.log("🔴 Botón presionado - Iniciando pedido automático");

    if (insumos.length === 0) {
      setError("No hay insumos para realizar pedido");
      return;
    }

    // Validación de días (se mantiene igual)
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const diaActual = diasSemana[diaSemana];

    if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      setError(`❌ No se pueden crear pedidos el ${diaActual}. Acciones disponibles: lunes a jueves.`);
      return;
    }

    try {
      setCreandoPedido(true);
      setError(null);

      const idsInsumos = insumos.map((i) => i.id_insumo).join(",");

      const response = await api.post(
        "/alertas-inventario/web/realizar-pedido-automatico",
        { idsInsumos, origen_pedido: 'Automático' },
      );

      if (response.data && response.data.success === true) {
        console.log("🎉 ¡ÉXITO! Limpiando estado y redirigiendo...");

        // --- AQUÍ ES DONDE SE APLICA LA MAGIA ---
        // 2. Limpiamos el estado local inmediatamente. 
        // Si Telegram tarda en redirigir, la interfaz ya mostrará "¡Todo en orden!" 
        // porque el array estará vacío, impidiendo que el botón aparezca de nuevo.
        setInsumos([]); 

        const pedidosNum = response.data.pedidos?.length || 1;

        sessionStorage.setItem(
          "pedidoExitoso",
          JSON.stringify({
            pedidosCreados: pedidosNum,
            mensaje: "¡Pedido Registrado Exitosamente!",
          }),
        );

        // 3. Redirección definitiva
        window.location.href = "/cocinera-telegram-exitoso";
      } else {
        // Si el backend dice que no fue exitoso, rehabilitamos el botón
        setError(response.data?.message || "Error al crear pedido");
        setCreandoPedido(false);
      }
    } catch (err) {
      console.error("❌ Error al crear pedido:", err.message);
      setError(err.response?.data?.message || "Error al crear pedido");
      // Importante: rehabilitar en caso de error de red
      setCreandoPedido(false); 
    }
  };

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
      <div className="cocinera-telegram-content">
        <div className="header">
          <h1>🚨 ALERTA DE INSUMOS FALTANTES</h1>
          <p>Se detectaron insumos con stock crítico</p>
        </div>

        {error && (
          <div
            className={`mensaje ${error.includes("✅") ? "exito" : "error"}`}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="cargando">
            <div className="spinner"></div>
            <p>Cargando insumos faltantes...</p>
          </div>
        )}

        {!loading && insumos.length > 0 && (
          <div className="insumos-lista">
            <h2>Insumos que requieren pedido:</h2>
            {hayPlanificacion && diasRestantes.length > 0 && (
              <div className="info-demanda">
                📅 Basado en la demanda planificada para: <strong>{diasRestantes.join(', ')}</strong>
              </div>
            )}
            {insumos.map((insumo, index) => (
              <div
                key={insumo.id_insumo}
                className={`insumo-card ${insumo.estado === "Agotado" ? "agotado" : "critico"}`}
              >
                <div className="insumo-header">
                  <span className="numero">{index + 1}</span>
                  <h3 className="nombre">{insumo.nombreInsumo}</h3>
                  <span
                    className={`estado-badge ${insumo.estado.toLowerCase()}`}
                  >
                    {insumo.estado === "Agotado" ? "🔴 Agotado" : "🟡 Crítico"}
                  </span>
                </div>
                <div className="insumo-detalles">
                  <div className="detalle">
                    <span className="label">Stock Actual:</span>
                    <span className="valor">
                      {formatearNumero(insumo.cantidadActual)}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                  <div className="detalle">
                    <span className="label">
                      {insumo.criterio === "demanda_semanal" ? "Necesario esta semana:" : "Stock Mínimo:"}
                    </span>
                    <span className="valor necesario">
                      {formatearNumero(insumo.totalNecesario)}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                  <div className="detalle">
                    <span className="label">Faltante:</span>
                    <span className="valor faltante">
                      {formatearNumero(parseFloat(insumo.totalNecesario) - parseFloat(insumo.cantidadActual))}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="info-box">
              <p>
                <strong>Total de insumos en alerta:</strong> {insumos.length}
              </p>
              <p className="nota">
                📝 El sistema generará un pedido automático a los proveedores de
                estos insumos.
              </p>
              <p className="nota info-dias">
                📅 <strong>Días de actividad:</strong> Lunes a Jueves (Viernes
                no permite crear pedidos)
              </p>
            </div>
            <button
              className="btn-realizar-pedido"
              onClick={handleRealizarPedido}
              disabled={creandoPedido}
            >
              {creandoPedido ? (
                <>
                  <span className="spinner-btn"></span> Generando pedido...
                </>
              ) : (
                <>📦 Realizar Pedido</>
              )}
            </button>
          </div>
        )}

        {!loading && insumos.length === 0 && !error && (
          <div className="sin-insumos">
            <div className="icono">✅</div>
            <h2>¡Todo en orden!</h2>
            <p>No hay insumos con stock crítico en este momento.</p>
            <button className="btn-salir" onClick={handleSalir}>🔚 Salir</button>
          </div>
        )}

        <div className="footer">
          <p className="timestamp">
            Última actualización: {new Date().toLocaleTimeString("es-ES")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocineraTelegram;
