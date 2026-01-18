import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api.js";
import "./confirmacionProveedor.css";

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

      console.log("🔄 Iniciando carga de datos con token:", token);
      const response = await API.get(`/pedidos/confirmacion/${token}`);
      console.log("📥 Respuesta recibida:", response.data);

      const { tokenData, pedido, proveedor, insumos, estadoPedido } =
        response.data;

      console.log("📊 Datos extraídos:", {
        tokenData: tokenData,
        pedido: pedido,
        proveedor: proveedor,
        estadoPedido: estadoPedido,
        insumosCount: insumos?.length || 0,
        insumos: insumos,
      });

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

      console.log("✅ Datos cargados exitosamente");
      console.log(
        "📊 Debug - Confirmaciones iniciales:",
        confirmacionesIniciales,
      );
      console.log(
        "📊 Debug - Insumos del pedido:",
        insumos.map((i) => ({
          id: i.id_detallePedido,
          nombre: i.nombreInsumo,
          cantidad: i.cantidadSolicitada,
          unidad: i.unidadMedida,
        })),
      );
      console.log("📊 Debug - Total insumos:", insumos.length);
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
      <div className="proveedor-container">
        <div className="loading-proveedor">
          <div className="spinner-proveedor"></div>
          <p>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error && !datosPedido.insumos.length) {
    return (
      <div className="proveedor-container">
        <div className="error-proveedor">
          <div className="error-icon">⚠️</div>
          <h3>Error de Acceso</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={cargarDatosPedido}>
            Intentar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  // Validar si el pedido ya fue procesado
  if (datosPedido.estadoPedido === "Confirmado") {
    return (
      <div className="proveedor-container">
        <div className="error-proveedor">
          <div className="error-icon">✅</div>
          <h3>Pedido Procesado</h3>
          <p>Este pedido ya fue confirmado anteriormente.</p>
          <p className="info-procesado">
            No es necesario realizar una nueva confirmación.
          </p>
          <button className="btn-retry" onClick={() => window.close()}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  const conteos = contarConfirmaciones();
  const fechaFormateada = datosPedido.pedido?.fechaEmision
    ? new Date(datosPedido.pedido.fechaEmision).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
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
    <div className="proveedor-container">
      {/* Header */}
      <div className="header-proveedor ">
        <div className="header-content">
          <h1>📦 Confirmación de Pedido</h1>
          <div className="info-header">
            <div className="info-item">
              <strong className="mt-2">
                🏢 {datosPedido.proveedor?.razonSocial}
              </strong>
            </div>
            <div className="info-item">
              <strong className="mt-2">
                📋 Pedido: {datosPedido.pedido?.id_pedido?.slice(0, 8)}...
              </strong>
            </div>
            <div className="info-item">
              <strong className="mt-2">📅 {fechaFormateada}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-proveedor">
        <div className="stat-item stat-disponible">
          <span className="stat-number">{conteos.Disponible}</span>
          <span className="stat-label">Disponibles</span>
        </div>
        <div className="stat-item stat-nodisponible">
          <span className="stat-number">{conteos["No Disponible"]}</span>
          <span className="stat-label">No Disponibles</span>
        </div>
        <div className="stat-item stat-pendiente">
          <span className="stat-number">{conteos.Pendiente}</span>
          <span className="stat-label">Pendientes</span>
        </div>
      </div>

      {/* Lista de Insumos */}
      <div className="insumos-lista">
        {datosPedido.insumos.map((insumo) => (
          <div key={insumo.id_detallePedido} className="insumo-card">
            <div className="insumo-info">
              <h3>{insumo.nombreInsumo}</h3>
              <p className="insumo-codigo">
                Código: INS-{String(insumo.id_insumo).padStart(4, "0")}
              </p>
              <p className="insumo-cantidad">
                Solicitado:{" "}
                <strong>
                  {(() => {
                    const cantidad = Number(insumo.cantidadSolicitada);
                    const unidad = insumo.unidadMedida || "";

                    // Si es en Gramos o Mililitros Y la cantidad es mayor a 1000,
                    // entonces está en unidades menores (dividir por 1000)
                    if (
                      (unidad.includes("Gramo") ||
                        unidad.includes("Mililitro")) &&
                      cantidad > 1000
                    ) {
                      const cantidadConvertida = cantidad / 1000;
                      return Math.round(cantidadConvertida * 100) / 100;
                    }

                    return Math.round(cantidad * 100) / 100;
                  })()}{" "}
                  {insumo.unidadMedida}
                </strong>
              </p>
            </div>

            {/* Opciones de Estado */}
            <div className="opciones-estado">
              <button
                type="button"
                className={`opcion-btn opcion-disponible ${
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
                className={`opcion-btn opcion-nodisponible ${
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
        <div className="mensaje-error">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mensaje-success">
          <p>{success}</p>
        </div>
      )}

      {/* Botón de Confirmar */}
      <div className="footer-proveedor">
        <button
          className="btn-confirmar"
          onClick={guardarConfirmaciones}
          disabled={guardando || conteos.Pendiente > 0}
        >
          {guardando ? (
            <>
              <div className="spinner-btn"></div>
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
