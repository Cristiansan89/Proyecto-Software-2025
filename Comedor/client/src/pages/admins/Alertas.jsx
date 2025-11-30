import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import "../../styles/Alertas.css";

const Alertas = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estados para las alertas
  const [alertas, setAlertas] = useState({
    // Habilitar/Deshabilitar alertas
    alertasInventarioHabilitadas: true,
    alertasAgotadoHabilitadas: true,
    alertasCriticoHabilitadas: true,
    alertasBajoHabilitadas: true,

    // Porcentajes
    porcentajeAlertaCritico: 2,
    porcentajeAlertaBajo: 10,

    // Telegram
    telegramHabilitado: true,
    cantidadReintentosTelegram: 3,
    intervaloReintentosTelegram: 10, // minutos

    // Email
    emailHabilitado: false,
    destinatarioEmail: "",

    // Notificaciones al usuario
    notificacionesUIHabilitadas: true,
  });

  const [mostrarDetalles, setMostrarDetalles] = useState({
    telegram: false,
    email: false,
    porcentajes: false,
  });

  useEffect(() => {
    cargarConfiguracionAlertas();
  }, []);

  const cargarConfiguracionAlertas = async () => {
    try {
      setLoading(true);
      const response = await API.get("/parametros-sistemas");
      const parametros = response.data || [];

      // Mapear parámetros a estados
      const configAlertas = { ...alertas };

      parametros.forEach((param) => {
        const { nombreParametro, valor } = param;

        // Convertir valores según el tipo
        let valorProcesado = valor;
        if (valor === "true") valorProcesado = true;
        else if (valor === "false") valorProcesado = false;
        else if (!isNaN(valor) && valor !== "")
          valorProcesado = parseFloat(valor);

        // Mapear a estado
        if (nombreParametro === "ALERTAS_INVENTARIO_HABILITADAS") {
          configAlertas.alertasInventarioHabilitadas = valorProcesado;
        } else if (nombreParametro === "ALERTAS_AGOTADO_HABILITADAS") {
          configAlertas.alertasAgotadoHabilitadas = valorProcesado;
        } else if (nombreParametro === "ALERTAS_CRITICO_HABILITADAS") {
          configAlertas.alertasCriticoHabilitadas = valorProcesado;
        } else if (nombreParametro === "ALERTAS_BAJO_HABILITADAS") {
          configAlertas.alertasBajoHabilitadas = valorProcesado;
        } else if (nombreParametro === "PORCENTAJE_ALERTA_CRITICO") {
          configAlertas.porcentajeAlertaCritico = valorProcesado;
        } else if (nombreParametro === "PORCENTAJE_ALERTA_BAJO") {
          configAlertas.porcentajeAlertaBajo = valorProcesado;
        } else if (nombreParametro === "TELEGRAM_HABILITADO") {
          configAlertas.telegramHabilitado = valorProcesado;
        } else if (nombreParametro === "CANTIDAD_REINTENTOS_TELEGRAM") {
          configAlertas.cantidadReintentosTelegram = valorProcesado;
        } else if (nombreParametro === "INTERVALO_REINTENTOS_TELEGRAM") {
          configAlertas.intervaloReintentosTelegram = valorProcesado;
        } else if (nombreParametro === "EMAIL_HABILITADO") {
          configAlertas.emailHabilitado = valorProcesado;
        } else if (nombreParametro === "DESTINATARIO_EMAIL") {
          configAlertas.destinatarioEmail = valorProcesado;
        } else if (nombreParametro === "NOTIFICACIONES_UI_HABILITADAS") {
          configAlertas.notificacionesUIHabilitadas = valorProcesado;
        }
      });

      setAlertas(configAlertas);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error al cargar la configuración de alertas",
      });
    } finally {
      setLoading(false);
    }
  };

  const crearOActualizarParametro = async (nombreParametro, valor) => {
    try {
      // Obtener todos los parámetros una sola vez
      const parametros = await API.get("/parametros-sistemas");
      const parametroExistente = parametros.data.find(
        (p) => p.nombreParametro === nombreParametro
      );

      const payload = {
        nombreParametro,
        valor: String(valor),
        tipoParametro: typeof valor === "number" ? "number" : "boolean",
        estado: "Activo",
      };

      if (parametroExistente) {
        // Actualizar usando PATCH
        await API.patch(
          `/parametros-sistemas/${parametroExistente.id_parametro}`,
          payload
        );
      } else {
        // Crear usando POST
        await API.post("/parametros-sistemas", payload);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Obtener todos los parámetros una sola vez
      const respuestaParametros = await API.get("/parametros-sistemas");
      const parametrosExistentes = respuestaParametros.data || [];

      // Preparar todas las operaciones
      const operaciones = [
        {
          nombreParametro: "ALERTAS_INVENTARIO_HABILITADAS",
          valor: alertas.alertasInventarioHabilitadas,
        },
        {
          nombreParametro: "ALERTAS_AGOTADO_HABILITADAS",
          valor: alertas.alertasAgotadoHabilitadas,
        },
        {
          nombreParametro: "ALERTAS_CRITICO_HABILITADAS",
          valor: alertas.alertasCriticoHabilitadas,
        },
        {
          nombreParametro: "ALERTAS_BAJO_HABILITADAS",
          valor: alertas.alertasBajoHabilitadas,
        },
        {
          nombreParametro: "PORCENTAJE_ALERTA_CRITICO",
          valor: alertas.porcentajeAlertaCritico,
        },
        {
          nombreParametro: "PORCENTAJE_ALERTA_BAJO",
          valor: alertas.porcentajeAlertaBajo,
        },
        {
          nombreParametro: "TELEGRAM_HABILITADO",
          valor: alertas.telegramHabilitado,
        },
        {
          nombreParametro: "CANTIDAD_REINTENTOS_TELEGRAM",
          valor: alertas.cantidadReintentosTelegram,
        },
        {
          nombreParametro: "INTERVALO_REINTENTOS_TELEGRAM",
          valor: alertas.intervaloReintentosTelegram,
        },
        {
          nombreParametro: "EMAIL_HABILITADO",
          valor: alertas.emailHabilitado,
        },
        {
          nombreParametro: "DESTINATARIO_EMAIL",
          valor: alertas.destinatarioEmail,
        },
        {
          nombreParametro: "NOTIFICACIONES_UI_HABILITADAS",
          valor: alertas.notificacionesUIHabilitadas,
        },
      ];

      // Ejecutar todas las operaciones en paralelo
      await Promise.all(
        operaciones.map(async (op) => {
          const parametroExistente = parametrosExistentes.find(
            (p) => p.nombreParametro === op.nombreParametro
          );

          // Determinar el tipo de parámetro correcto
          let tipoParametro;
          if (typeof op.valor === "number") {
            tipoParametro = "number";
          } else if (typeof op.valor === "boolean") {
            tipoParametro = "boolean";
          } else {
            tipoParametro = "string";
          }

          const payload = {
            nombreParametro: op.nombreParametro,
            valor: String(op.valor),
            tipoParametro,
            estado: "Activo",
          };

          if (parametroExistente) {
            // Actualizar
            await API.patch(
              `/parametros-sistemas/${parametroExistente.id_parametro}`,
              payload
            );
          } else {
            // Crear
            await API.post("/parametros-sistemas", payload);
          }
        })
      );

      setMensaje({
        tipo: "success",
        texto: "Configuración de alertas actualizada correctamente",
      });

      // Recargar configuración después de guardar
      await cargarConfiguracionAlertas();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.message ||
          "Error al guardar la configuración de alertas",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAlertas((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid alertas-container">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-bell"></i> Configuración de Alertas
          </h1>
          <p>
            Controla el comportamiento de las alertas de inventario en el
            sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardar}>
        {/* Sección: Alertas Generales */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-dark">
            <h5 className="mb-0">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Alertas Generales
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-check form-switch mx-5">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasInventario"
                    checked={alertas.alertasInventarioHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasInventarioHabilitadas",
                        e.target.checked
                      )
                    }
                  />
                  <label
                    className="form-check-label"
                    htmlFor="alertasInventario"
                  >
                    <strong>Habilitar Todas las Alertas de Inventario</strong>
                    <br />
                    <small className="text-muted">
                      Desactivar esto deshabilitará todas las alertas de stock
                    </small>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Alertas por Estado */}
        <div className="card mb-4">
          <div className="card-header bg-danger text-dark">
            <h5 className="mb-0">
              <i className="fas fa-binoculars me-2"></i>
              Alertas por Estado de Stock
            </h5>
          </div>
          <div className="card-body">
            <div className="row mx-5">
              <div className="col-md-6 mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasAgotado"
                    checked={alertas.alertasAgotadoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasAgotadoHabilitadas",
                        e.target.checked
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label className="form-check-label" htmlFor="alertasAgotado">
                    <strong>Alertas de Stock Agotado</strong>
                    <br />
                    <small className="text-muted">
                      Alertar cuando el stock es = 0
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasCritico"
                    checked={alertas.alertasCriticoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasCriticoHabilitadas",
                        e.target.checked
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label className="form-check-label" htmlFor="alertasCritico">
                    <strong>Alertas de Stock Crítico</strong>
                    <br />
                    <small className="text-muted">
                      Alertar cuando el stock ≤ nivel mínimo
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasBajo"
                    checked={alertas.alertasBajoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasBajoHabilitadas",
                        e.target.checked
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label className="form-check-label" htmlFor="alertasBajo">
                    <strong>Alertas de Stock Bajo</strong>
                    <br />
                    <small className="text-muted">
                      Notificación informativa de stock bajo
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="notificacionesUI"
                    checked={alertas.notificacionesUIHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "notificacionesUIHabilitadas",
                        e.target.checked
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="notificacionesUI"
                  >
                    <strong>Notificaciones en la UI</strong>
                    <br />
                    <small className="text-muted">
                      Mostrar alertas en la interfaz del usuario
                    </small>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Porcentajes de Alerta */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="fas fa-chart-pie me-2"></i>
              Porcentajes de Alerta
            </h5>
          </div>
          <div className="card-body mx-3">
            <p className="text-muted mb-3">
              Estos porcentajes se calculan como: (Stock Actual / Stock Máximo)
              × 100
            </p>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="porcentajeCritico" className="form-label">
                  <strong>
                    <i className="fas fa-exclamation-circle text-danger me-2"></i>
                    Porcentaje Crítico (%)
                  </strong>
                </label>
                <div className="input-group input-alerta">
                  <input
                    type="number"
                    className="form-control"
                    id="porcentajeCritico"
                    min="0"
                    max="100"
                    step="0.5"
                    value={alertas.porcentajeAlertaCritico}
                    onChange={(e) =>
                      handleInputChange(
                        "porcentajeAlertaCritico",
                        parseFloat(e.target.value)
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <span className="input-group-text">%</span>
                </div>

                <small className="form-text text-muted d-block mt-2">
                  Valores ≤ a este porcentaje se consideran Críticos
                  <br />
                  <strong>Actual: {alertas.porcentajeAlertaCritico}%</strong>
                </small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="porcentajeBajo" className="form-label">
                  <strong>
                    <i className="fas fa-arrow-down text-warning me-2"></i>
                    Porcentaje Bajo (%)
                  </strong>
                </label>
                <div className="input-group input-alerta">
                  <input
                    type="number"
                    className="form-control"
                    id="porcentajeBajo"
                    min="0"
                    max="100"
                    step="0.5"
                    value={alertas.porcentajeAlertaBajo}
                    onChange={(e) =>
                      handleInputChange(
                        "porcentajeAlertaBajo",
                        parseFloat(e.target.value)
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <span className="input-group-text">%</span>
                </div>
                <small className="form-text text-muted d-block mt-2">
                  Valores entre Crítico y este porcentaje se consideran Bajos
                  <br />
                  <strong>Actual: {alertas.porcentajeAlertaBajo}%</strong>
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Telegram */}
        <div className="card mb-4">
          <div className="card-header bg-info text-dark">
            <h5 className="mb-0">
              <i className="fab fa-telegram me-2"></i>
              Configuración de Telegram
            </h5>
          </div>
          <div className="card-body mx-5">
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="telegramHabilitado"
                checked={alertas.telegramHabilitado}
                onChange={(e) =>
                  handleInputChange("telegramHabilitado", e.target.checked)
                }
                disabled={!alertas.alertasInventarioHabilitadas}
              />
              <label className="form-check-label" htmlFor="telegramHabilitado">
                <strong>Habilitar Notificaciones por Telegram</strong>
                <br />
                <small className="text-muted">
                  Enviar alertas a través de Telegram
                </small>
              </label>
            </div>

            {alertas.telegramHabilitado && (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="cantidadReintentos" className="form-label">
                    <strong>Cantidad de Reintentos</strong>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="cantidadReintentos"
                    min="1"
                    max="10"
                    value={alertas.cantidadReintentosTelegram}
                    onChange={(e) =>
                      handleInputChange(
                        "cantidadReintentosTelegram",
                        parseInt(e.target.value)
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <small className="form-text text-muted">
                    Número de veces que se reintentará enviar la alerta
                  </small>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="intervaloReintentos" className="form-label">
                    <strong>Intervalo entre Reintentos (minutos)</strong>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="intervaloReintentos"
                    min="1"
                    max="60"
                    value={alertas.intervaloReintentosTelegram}
                    onChange={(e) =>
                      handleInputChange(
                        "intervaloReintentosTelegram",
                        parseInt(e.target.value)
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <small className="form-text text-muted">
                    Minutos de espera entre cada reintento
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Email */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-dark">
            <h5 className="mb-0">
              <i className="fas fa-envelope me-2"></i>
              Configuración de Email
            </h5>
          </div>
          <div className="card-body mx-5">
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailHabilitado"
                checked={alertas.emailHabilitado}
                onChange={(e) =>
                  handleInputChange("emailHabilitado", e.target.checked)
                }
                disabled={!alertas.alertasInventarioHabilitadas}
              />
              <label className="form-check-label" htmlFor="emailHabilitado">
                <strong>Habilitar Notificaciones por Email</strong>
                <br />
                <small className="text-muted">
                  Enviar alertas a través de correo electrónico
                </small>
              </label>
            </div>

            {alertas.emailHabilitado && (
              <div className="mb-3">
                <label htmlFor="destinatarioEmail" className="form-label">
                  <strong>Correo Electrónico de Destinatario</strong>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="destinatarioEmail"
                  value={alertas.destinatarioEmail}
                  onChange={(e) =>
                    handleInputChange("destinatarioEmail", e.target.value)
                  }
                  placeholder="admin@comedor.com"
                  disabled={!alertas.alertasInventarioHabilitadas}
                />
                <small className="form-text text-muted">
                  Dirección de correo donde se enviarán las alertas
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Visual */}
        <div className="card mb-4 bg-light">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="fas fa-info-circle me-2"></i>
              Resumen de Configuración
            </h5>
          </div>
          <div className="card-body mx-4">
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Estado General:</strong>
                  <br />
                  <span
                    className={`badge ${
                      alertas.alertasInventarioHabilitadas
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {alertas.alertasInventarioHabilitadas
                      ? "Alertas Habilitadas"
                      : "Alertas Deshabilitadas"}
                  </span>
                </p>

                <p className="mb-2">
                  <strong>Canales Activos:</strong>
                  <br />
                  {alertas.telegramHabilitado && (
                    <span className="badge bg-info me-2">
                      <i className="fab fa-telegram me-1"></i>Telegram
                    </span>
                  )}
                  {alertas.emailHabilitado && (
                    <span className="badge bg-secondary me-2">
                      <i className="fas fa-envelope me-1"></i>Email
                    </span>
                  )}
                  {alertas.notificacionesUIHabilitadas && (
                    <span className="badge bg-primary me-2">
                      <i className="fas fa-bell me-1"></i>UI
                    </span>
                  )}
                  {!alertas.telegramHabilitado &&
                    !alertas.emailHabilitado &&
                    !alertas.notificacionesUIHabilitadas && (
                      <span className="text-muted">Ninguno habilitado</span>
                    )}
                </p>
              </div>

              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Umbrales de Alerta:</strong>
                  <br />
                  <i className="fas fa-exclamation-circle text-danger me-2"></i>
                  Crítico: ≤ {alertas.porcentajeAlertaCritico}%
                  <br />
                  <i className="fas fa-arrow-down text-warning me-2"></i>
                  Bajo: ≤ {alertas.porcentajeAlertaBajo}%
                </p>

                {alertas.telegramHabilitado && (
                  <p className="mb-0">
                    <strong>Telegram:</strong>{" "}
                    {alertas.cantidadReintentosTelegram} reintentos cada{" "}
                    {alertas.intervaloReintentosTelegram} min
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={saving}
          >
            <i className="fas fa-save"></i>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            className="btn btn-warning me-2"
            onClick={() => cargarConfiguracionAlertas()}
            disabled={saving}
          >
            <i className="fas fa-redo"></i>
            Recargar
          </button>
        </div>
      </form>
      {mensaje && (
        <div
          className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}
          role="alert"
        >
          {mensaje.texto}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMensaje(null)}
          ></button>
        </div>
      )}
    </div>
  );
};

export default Alertas;
