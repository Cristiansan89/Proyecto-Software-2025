import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import ConfirmacionsStyle from "../../styles/Confirmaciones.module.css";

const ConfirmacionProveedor = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [datosPedido, setDatosPedido] = useState({
    tokenData: null,
    pedido: null,
    proveedor: null,
    insumos: [],
    estadoPedido: null,
  });

  const [confirmaciones, setConfirmaciones] = useState({});

  useEffect(() => {
    cargarDatosPedido();
  }, [token]);

  const cargarDatosPedido = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/pedidos/confirmacion/${token}`);

      const { tokenData, pedido, proveedor, insumos, estadoPedido } =
        response.data;

      setDatosPedido({ tokenData, pedido, proveedor, insumos, estadoPedido });

      // Inicializar confirmaciones
      // Cada insumo puede estar: "Disponible", "No Disponible"
      const confirmacionesIniciales = {};
      insumos.forEach((insumo) => {
        // Para nuevas confirmaciones, inicializar sin valor
        // El proveedor debe seleccionar explícitamente
        confirmacionesIniciales[insumo.id_detallePedido] = {
          estado: "", // Sin valor inicial
        };
      });
      setConfirmaciones(confirmacionesIniciales);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      console.error("🔍 Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        setError(
          "El enlace ha expirado o es inválido. Contacte al administrador.",
        );
      } else if (error.response?.status === 403) {
        setError(
          "No tiene pedidos asignados. El enlace que utilizó no es para usted.",
        );
      } else if (error.response?.status === 404) {
        setError("Pedido no encontrado o ya fue procesado.");
      } else {
        setError(
          `Error al cargar los datos: ${error.message}. Intente nuevamente.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmacionChange = (idDetalle, campo, valor) => {
    setConfirmaciones((prev) => ({
      ...prev,
      [idDetalle]: {
        ...prev[idDetalle],
        [campo]: valor,
      },
    }));
    setError("");
    setSuccess("");
  };

  const guardarConfirmaciones = async () => {
    try {
      setGuardando(true);
      setError("");
      setSuccess("");

      // Validar que todos los insumos tengan un estado definido
      const confirmacionesArray = Object.entries(confirmaciones);
      const sinConfirmar = confirmacionesArray.filter(
        ([_, conf]) => !conf.estado,
      );

      if (sinConfirmar.length > 0) {
        setError(
          `Debe confirmar el estado de todos los insumos. Faltan ${sinConfirmar.length} insumos por confirmar.`,
        );
        return;
      }

      const confirmacionesData = confirmacionesArray.map(
        ([idDetalle, conf]) => ({
          idDetallePedido: parseInt(idDetalle),
          estado: conf.estado,
        }),
      );

      const response = await API.post(`/pedidos/confirmacion/${token}`, {
        confirmaciones: confirmacionesData,
      });

      // Redirigir a pantalla de éxito
      navigate("/confirmacion-exitosa", {
        state: {
          mensaje: "Confirmación enviada correctamente.",
          confirmadas: response.data.confirmadas,
          rechazadas: response.data.rechazadas,
          proveedor: datosPedido.proveedor?.razonSocial || "",
          pedido: datosPedido.pedido?.id_pedido || "",
        },
      });
    } catch (error) {
      console.error("❌ Error al guardar confirmaciones:", error);

      if (error.response?.status === 401) {
        setError("El enlace ha expirado. Contacte al administrador.");
      } else if (error.response?.status === 409) {
        setError("Este pedido ya fue procesado anteriormente.");
      } else {
        setError(`Error al guardar: ${error.message}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  const contarConfirmaciones = () => {
    const conteos = {
      Disponible: 0,
      "No Disponible": 0,
      Pendiente: 0,
    };
    Object.values(confirmaciones).forEach((conf) => {
      if (conf.estado) {
        conteos[conf.estado]++;
      } else {
        conteos.Pendiente++;
      }
    });
    return conteos;
  };

  if (loading) {
    return (
      <div className={ConfirmacionesStyle.containerProveedor}>
        <div className={ConfirmacionesStyle.loadingProveedor}>
          <div className={ConfirmacionesStyle.spinnerProveedor}></div>
          <p>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error && !datosPedido.insumos.length) {
    return (
      <div className={ConfirmacionesStyle.containerProveedor}>
        <div className={ConfirmacionesStyle.errorProveedor}>
          <div className={ConfirmacionesStyle.errorIcon}>⚠️</div>
          <h3>Error de Acceso</h3>
          <p>{error}</p>
          <button
            className={ConfirmacionesStyle.btnRetry}
            onClick={cargarDatosPedido}
          >
            Intentar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  // Validar si el pedido ya fue procesado
  if (datosPedido.estadoPedido === "Confirmado") {
    return (
      <div className={ConfirmacionesStyle.containerProveedor}>
        <div className={ConfirmacionesStyle.errorProveedor}>
          <div className={ConfirmacionesStyle.errorIcon}>✅</div>
          <h3>Pedido Procesado</h3>
          <p>Este pedido ya fue confirmado anteriormente.</p>
          <p className={ConfirmacionesStyle.infoProcesado}>
            No es necesario realizar una nueva confirmación.
          </p>
          <button
            className={ConfirmacionesStyle.btnRetry}
            onClick={() => window.close()}
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  const conteos = contarConfirmaciones();
  const fechaFormateada = datosPedido.pedido?.fechaEmision
    ? (() => {
        const fecha = datosPedido.pedido.fechaEmision;
        // Parsear YYYY-MM-DD evitando problemas de zona horaria
        // Usar números en lugar de strings para evitar ambigüedad
        if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          const [año, mes, día] = fecha.split("-").map(Number);
          // Crear fecha local directamente sin conversión UTC
          const fechaLocal = new Date(año, mes - 1, día);
          return fechaLocal.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
        // Si es una fecha con hora, usar toLocaleDateString normalmente
        return new Date(fecha).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      })()
    : "Fecha no disponible";

  // Debug logs para renderizado
  console.log("🎨 Renderizando componente:", {
    loading,
    error,
    datosPedidoKeys: Object.keys(datosPedido),
    insumosLength: datosPedido.insumos?.length || 0,
    proveedorNombre: datosPedido.proveedor?.razonSocial,
    pedidoId: datosPedido.pedido?.id_pedido,
  });

  return (
    <div className={ConfirmacionesStyle.containerProveedor}>
      {/* Header */}
      <div className={ConfirmacionesStyle.headerProveedor}>
        <div className={ConfirmacionesStyle.headerContent}>
          <h1>📦 Confirmación de Pedido</h1>
          <div className={ConfirmacionesStyle.headerInfo}>
            <div className={ConfirmacionesStyle.itemInfo}>
              <strong className="mt-2">
                🏢 {datosPedido.proveedor?.razonSocial}
              </strong>
            </div>
            <div className={ConfirmacionesStyle.itemInfo}>
              <strong className="mt-2">
                📋 Pedido: {datosPedido.pedido?.id_pedido?.slice(0, 8)}...
              </strong>
            </div>
            <div className={ConfirmacionesStyle.itemInfo}>
              <strong className="mt-2">📅 {fechaFormateada}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={ConfirmacionesStyle.statsProveedor}>
        <div
          className={`${ConfirmacionesStyle.statItem} ${ConfirmacionesStyle.statDisponible}`}
        >
          <span className={ConfirmacionesStyle.statNumber}>
            {conteos.Disponible}
          </span>
          <span className={ConfirmacionesStyle.statLabel}>Disponibles</span>
        </div>
        <div
          className={`${ConfirmacionesStyle.statItem} ${ConfirmacionesStyle.statNoDisponible}`}
        >
          <span className={ConfirmacionesStyle.statNumber}>
            {conteos["No Disponible"]}
          </span>
          <span className={ConfirmacionesStyle.statLabel}>No Disponibles</span>
        </div>
        <div
          className={`${ConfirmacionesStyle.statItem} ${ConfirmacionesStyle.statPendiente}`}
        >
          <span className={ConfirmacionesStyle.statNumber}>
            {conteos.Pendiente}
          </span>
          <span className={ConfirmacionesStyle.statLabel}>Pendientes</span>
        </div>
      </div>

      {/* Lista de Insumos */}
      <div className={ConfirmacionesStyle.listaInsumos}>
        {datosPedido.insumos.map((insumo) => (
          <div
            key={insumo.id_detallePedido}
            className={ConfirmacionesStyle.cardInsumo}
          >
            <div className={ConfirmacionesStyle.infoInsumo}>
              <h3>{insumo.nombreInsumo}</h3>
              <p className={ConfirmacionesStyle.codeInsumo}>
                Código: INS-{String(insumo.id_insumo).padStart(4, "0")}
              </p>
              <p className={ConfirmacionesStyle.insumoCantidad}>
                Solicitado:{" "}
                <strong>
                  {(() => {
                    const cantidad = Number(insumo.cantidadSolicitada);
                    // Mostrar la cantidad tal cual está almacenada
                    return Math.round(cantidad * 100) / 100;
                  })()}{" "}
                  {insumo.unidadMedida}
                </strong>
              </p>
            </div>

            {/* Opciones de Estado */}
            <div className={ConfirmacionesStyle.opcionesEstado}>
              <button
                type="button"
                className={`${ConfirmacionesStyle.btnOpcion} ${ConfirmacionesStyle.opcionDisponible} ${
                  confirmaciones[insumo.id_detallePedido]?.estado ===
                  "Disponible"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleConfirmacionChange(
                    insumo.id_detallePedido,
                    "estado",
                    "Disponible",
                  )
                }
              >
                ✅ Disponible
              </button>
              <button
                type="button"
                className={`${ConfirmacionesStyle.btnOpcion} ${ConfirmacionesStyle.opcionNoDisponible} ${
                  confirmaciones[insumo.id_detallePedido]?.estado ===
                  "No Disponible"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleConfirmacionChange(
                    insumo.id_detallePedido,
                    "estado",
                    "No Disponible",
                  )
                }
              >
                ❌ No Disponible
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mensajes */}
      {error && (
        <div className={ConfirmacionesStyle.mensajeError}>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className={ConfirmacionesStyle.mensajeSuccess}>
          <p>{success}</p>
        </div>
      )}

      {/* Botón de Confirmar */}
      <div className={`${ConfirmacionesStyle.footerProveedor} mt-4`}>
        <button
          className={ConfirmacionesStyle.btnConfirmar}
          onClick={guardarConfirmaciones}
          disabled={guardando || conteos.Pendiente > 0}
        >
          {guardando ? (
            <>
              <div className={ConfirmacionesStyle.btnSpinner}></div>
              Enviando confirmación...
            </>
          ) : conteos.Pendiente > 0 ? (
            <>🔄 Confirmar todos los insumos ({conteos.Pendiente} pendientes)</>
          ) : (
            <>📨 Enviar Confirmación</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmacionProveedor;
