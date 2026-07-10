import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import CocineraTelegran from "../../styles/CocineraTelegram.module.css";

// Función para formatear números con localización española (coma decimal, punto separador de miles)
const formatearNumero = (numero, decimales = 2) => {
  return parseFloat(numero).toLocaleString("es-ES", {
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
          setError(
            response.data.message ||
              "No hay insumos que requieran pedido esta semana.",
          );
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
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    const diaActual = diasSemana[diaSemana];

    if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
      setError(
        `❌ No se pueden crear pedidos el ${diaActual}. Acciones disponibles: lunes a jueves.`,
      );
      return;
    }

    try {
      setCreandoPedido(true);
      setError(null);

      const idsInsumos = insumos.map((i) => i.id_insumo).join(",");

      const response = await api.post(
        "/alertas-inventario/web/realizar-pedido-automatico",
        { idsInsumos, origen_pedido: "Automático" },
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
    <div className={CocineraTelegran.containerTelegram}>
      <div className={CocineraTelegran.contentTelegram}>
        <div className={CocineraTelegran.header}>
          <h1>🚨 ALERTA DE INSUMOS FALTANTES</h1>
          <p>Se detectaron insumos con stock crítico</p>
        </div>

        {error && (
          <div
            className={`${CocineraTelegran.mensaje} ${error.includes("✅") ? CocineraTelegran.mensajeExito : CocineraTelegran.mensajeError}`}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className={CocineraTelegran.cargando}>
            <div className={CocineraTelegran.spinner}></div>
            <p>Cargando insumos faltantes...</p>
          </div>
        )}

        {!loading && insumos.length > 0 && (
          <div className={CocineraTelegran.insumosLista}>
            <h2>Insumos que requieren pedido:</h2>
            {hayPlanificacion && diasRestantes.length > 0 && (
              <div className={CocineraTelegran.infoDemanda}>
                📅 Basado en la demanda planificada para:{" "}
                <strong>{diasRestantes.join(", ")}</strong>
              </div>
            )}
            {insumos.map((insumo, index) => (
              <div
                key={insumo.id_insumo}
                className={`${CocineraTelegran.insumoCard} ${insumo.estado === "Agotado" ? "agotado" : "critico"}`}
              >
                <div className={CocineraTelegran.insumoHeader}>
                  <span className={CocineraTelegran.numero}>{index + 1}</span>
                  <h3 className={CocineraTelegran.nombre}>
                    {insumo.nombreInsumo}
                  </h3>
                  <span
                    className={`${CocineraTelegran.estadoBadge} ${insumo.estado.toLowerCase()}`}
                  >
                    {insumo.estado === "Agotado" ? "🔴 Agotado" : "🟡 Crítico"}
                  </span>
                </div>
                <div className={CocineraTelegran.insumoDetalles}>
                  <div className={CocineraTelegran.detalle}>
                    <span className={CocineraTelegran.label}>
                      Stock Actual:
                    </span>
                    <span className={CocineraTelegran.valor}>
                      {formatearNumero(insumo.cantidadActual)}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                  <div className={CocineraTelegran.detalle}>
                    <span className={CocineraTelegran.label}>
                      {insumo.criterio === "demanda_semanal"
                        ? "Necesario esta semana:"
                        : "Stock Mínimo:"}
                    </span>
                    <span
                      className={`${CocineraTelegran.valor} ${CocineraTelegran.necesario}`}
                    >
                      {formatearNumero(insumo.totalNecesario)}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                  <div className={CocineraTelegran.detalle}>
                    <span className={CocineraTelegran.label}>Faltante:</span>
                    <span
                      className={`${CocineraTelegran.valor} ${CocineraTelegran.faltante}`}
                    >
                      {formatearNumero(
                        parseFloat(insumo.totalNecesario) -
                          parseFloat(insumo.cantidadActual),
                      )}{" "}
                      {insumo.unidadMedida}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className={CocineraTelegran.infoBox}>
              <p>
                <strong>Total de insumos en alerta:</strong> {insumos.length}
              </p>
              <p
                className={`${CocineraTelegran.nota} ${CocineraTelegran.infoDias}`}
              >
                📝 El sistema generará un pedido automático a los proveedores de
                estos insumos.
              </p>
              <p
                className={`${CocineraTelegran.nota} ${CocineraTelegran.infoDias}`}
              >
                📅 <strong>Días de actividad:</strong> Lunes a Jueves (Viernes
                no permite crear pedidos)
              </p>
            </div>
            <button
              className={CocineraTelegran.btnRealizarPedido}
              onClick={handleRealizarPedido}
              disabled={creandoPedido}
            >
              {creandoPedido ? (
                <>
                  <span className={CocineraTelegran.btnSpinner}></span>{" "}
                  Generando pedido...
                </>
              ) : (
                <>📦 Realizar Pedido</>
              )}
            </button>
          </div>
        )}

        {!loading && insumos.length === 0 && !error && (
          <div className={CocineraTelegran.sinInsumos}>
            <div className={CocineraTelegran.icono}>✅</div>
            <h2>¡Todo en orden!</h2>
            <p>No hay insumos con stock crítico en este momento.</p>
            <button className={CocineraTelegran.btnSalir} onClick={handleSalir}>
              🔚 Salir
            </button>
          </div>
        )}

        <div className={CocineraTelegran.footer}>
          <p className={CocineraTelegran.timestamp}>
            Última actualización: {new Date().toLocaleTimeString("es-ES")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CocineraTelegram;
