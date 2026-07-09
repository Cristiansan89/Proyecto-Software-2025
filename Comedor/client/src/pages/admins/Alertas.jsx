import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { showError } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import ParametroStyle from "../../styles/Parametros.module.css";

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
        (p) => p.nombreParametro === nombreParametro,
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
          payload,
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
          tipo: "Booleano",
        },
        {
          nombreParametro: "ALERTAS_AGOTADO_HABILITADAS",
          valor: alertas.alertasAgotadoHabilitadas,
          tipo: "Booleano",
        },
        {
          nombreParametro: "ALERTAS_CRITICO_HABILITADAS",
          valor: alertas.alertasCriticoHabilitadas,
          tipo: "Booleano",
        },
        {
          nombreParametro: "ALERTAS_BAJO_HABILITADAS",
          valor: alertas.alertasBajoHabilitadas,
          tipo: "Booleano",
        },
        {
          nombreParametro: "PORCENTAJE_ALERTA_CRITICO",
          valor: alertas.porcentajeAlertaCritico,
          tipo: "Numero",
        },
        {
          nombreParametro: "PORCENTAJE_ALERTA_BAJO",
          valor: alertas.porcentajeAlertaBajo,
          tipo: "Numero",
        },
        {
          nombreParametro: "TELEGRAM_HABILITADO",
          valor: alertas.telegramHabilitado,
          tipo: "Booleano",
        },
        {
          nombreParametro: "CANTIDAD_REINTENTOS_TELEGRAM",
          valor: alertas.cantidadReintentosTelegram,
          tipo: "Numero",
        },
        {
          nombreParametro: "INTERVALO_REINTENTOS_TELEGRAM",
          valor: alertas.intervaloReintentosTelegram,
          tipo: "Numero",
        },
        {
          nombreParametro: "EMAIL_HABILITADO",
          valor: alertas.emailHabilitado,
          tipo: "Booleano",
        },
        {
          nombreParametro: "DESTINATARIO_EMAIL",
          valor: alertas.destinatarioEmail,
          tipo: "Texto",
        },
        {
          nombreParametro: "NOTIFICACIONES_UI_HABILITADAS",
          valor: alertas.notificacionesUIHabilitadas,
          tipo: "Booleano",
        },
      ];

      // Ejecutar todas las operaciones en paralelo
      await Promise.all(
        operaciones.map(async (op) => {
          const parametroExistente = parametrosExistentes.find(
            (p) => p.nombreParametro === op.nombreParametro,
          );

          // Manejar caso especial de destinatarioEmail vacío
          if (op.nombreParametro === "DESTINATARIO_EMAIL" && !op.valor.trim()) {
            // Si el parámetro existe pero el valor está vacío, eliminarlo
            if (parametroExistente) {
              await API.delete(
                `/parametros-sistemas/${parametroExistente.id_parametro}`,
              );
            }
            // Si no existe y el valor está vacío, no hacer nada
            return;
          }

          const payload = {
            nombreParametro: op.nombreParametro,
            valor: String(op.valor),
            tipoParametro: op.tipo,
            estado: "Activo",
          };

          if (parametroExistente) {
            // Actualizar
            await API.patch(
              `/parametros-sistemas/${parametroExistente.id_parametro}`,
              payload,
            );
          } else {
            // Crear
            await API.post("/parametros-sistemas", payload);
          }
        }),
      );

      setMensaje({
        tipo: "success",
        texto: "✅ Configuración de alertas actualizada correctamente",
      });

      // Recargar configuración después de guardar
      await cargarConfiguracionAlertas();
    } catch (error) {
      //console.error("Error al guardar:", error);
      showError("Error al guardar la configuración de alertas.");
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.message ||
          "Error al guardar la configuración de alertas",
      });
    } finally {
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setMensaje(null), 5000);

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
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Configuración de Alertas...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>Configuración de Alertas</h2>
          <p className={ContenidoStyle.pageSubtitle}>
            Controla el comportamiento de las alertas de inventario en el
            sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardar}>
        {mensaje && (
          <div
            className={`${ParametroStyle.alert} ${
              ParametroStyle[
                `alert${mensaje.tipo.charAt(0).toUpperCase() + mensaje.tipo.slice(1).toLowerCase()}`
              ]
            } alert-dismissible fade show mb-3`}
            role="alert"
          >
            {mensaje.texto}
          </div>
        )}
        <div className={`${ParametroStyle.card} mb-4`}>
          <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
            <h5 className={ContenidoStyle.pageTitle}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Alertas Generales
            </h5>
          </div>
          <div className={ParametroStyle.cardBody}>
            <div className={ParametroStyle.row}>
              <div className="col-md-6 mx-3">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    id="alertasInventario"
                    className="form-check-input"
                    checked={alertas.alertasInventarioHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasInventarioHabilitadas",
                        e.target.checked,
                      )
                    }
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
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
        <div className={ParametroStyle.card}>
          <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
            <h5 className={ContenidoStyle.pageTitle}>
              <i className="fas fa-binoculars me-2"></i>
              Alertas por Estado de Stock
            </h5>
          </div>
          <div className={ParametroStyle.cardBody}>
            <div className={`${ParametroStyle.row}`}>
              <div className="col-md-5 mx-3">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="alertasAgotado"
                    checked={alertas.alertasAgotadoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasAgotadoHabilitadas",
                        e.target.checked,
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
                    htmlFor="alertasAgotado"
                  >
                    <strong>Alertas de Stock Agotado</strong>
                    <br />
                    <small className={ParametroStyle.textMuted}>
                      Alertar cuando el stock es = 0
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-5 mx-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasCritico"
                    checked={alertas.alertasCriticoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasCriticoHabilitadas",
                        e.target.checked,
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
                    htmlFor="alertasCritico"
                  >
                    <strong>Alertas de Stock Crítico</strong>
                    <br />
                    <small className="text-muted">
                      Alertar cuando el stock ≤ nivel mínimo
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-5 mx-3 mt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="alertasBajo"
                    checked={alertas.alertasBajoHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "alertasBajoHabilitadas",
                        e.target.checked,
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
                    htmlFor="alertasBajo"
                  >
                    <strong>Alertas de Stock Bajo</strong>
                    <br />
                    <small className="text-muted">
                      Notificación informativa de stock bajo
                    </small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mx-3 mt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="notificacionesUI"
                    checked={alertas.notificacionesUIHabilitadas}
                    onChange={(e) =>
                      handleInputChange(
                        "notificacionesUIHabilitadas",
                        e.target.checked,
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
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
        <div className={ParametroStyle.card}>
          <div className={`${ParametroStyle.cardHeader} bg-light}text-dark`}>
            <h5 className={ContenidoStyle.pageTitle}>
              <i className="fas fa-chart-pie me-2"></i>
              Porcentajes de Alerta
            </h5>
          </div>
          <div className={`${ParametroStyle.cardBody}`}>
            <p className="text-muted mb-3">
              Estos porcentajes se calculan como: (Stock Actual / Stock Máximo)
              × 100
            </p>
            <div className={ParametroStyle.row}>
              <div className="col-md-5 mx-3 mt-3">
                <label
                  htmlFor="porcentajeCritico"
                  className={ParametroStyle.formLabel}
                >
                  <strong>
                    <i className="fas fa-exclamation-circle text-danger me-2"></i>
                    Porcentaje Crítico (%)
                  </strong>
                </label>
                <div className={ParametroStyle.inputGroup}>
                  <input
                    type="number"
                    className={ParametroStyle.formControl}
                    id="porcentajeCritico"
                    min="1"
                    max="100"
                    step="0.5"
                    value={alertas.porcentajeAlertaCritico}
                    onChange={(e) =>
                      handleInputChange(
                        "porcentajeAlertaCritico",
                        parseFloat(e.target.value),
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <span className={ParametroStyle.inputGroupText}>%</span>
                </div>

                <small
                  className={`${ParametroStyle.formText} text-muted d-block mt-2`}
                >
                  Valores ≤ a este porcentaje se consideran Críticos
                  <br />
                  <strong>Actual: {alertas.porcentajeAlertaCritico}%</strong>
                </small>
              </div>

              <div className="col-md-5 mx-3 mt-3">
                <label
                  htmlFor="porcentajeBajo"
                  className={ParametroStyle.formLabel}
                >
                  <strong>
                    <i className="fas fa-arrow-down text-warning me-2"></i>
                    Porcentaje Bajo (%)
                  </strong>
                </label>
                <div className={ParametroStyle.inputGroup}>
                  <input
                    type="number"
                    className={ParametroStyle.formControl}
                    id="porcentajeBajo"
                    min="1"
                    max="100"
                    step="0.5"
                    value={alertas.porcentajeAlertaBajo}
                    onChange={(e) =>
                      handleInputChange(
                        "porcentajeAlertaBajo",
                        parseFloat(e.target.value),
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <span className={ParametroStyle.inputGroupText}>%</span>
                </div>
                <small
                  className={`${ParametroStyle.formText} text-muted d-block mt-2`}
                >
                  Valores entre Crítico y este porcentaje se consideran Bajos
                  <br />
                  <strong>Actual: {alertas.porcentajeAlertaBajo}%</strong>
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Telegram */}
        <div className={`${ParametroStyle.card} mb-4`}>
          <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
            <h5 className={ContenidoStyle.pageTitle}>
              Configuración de Telegram
            </h5>
          </div>
          <div className={`${ParametroStyle.cardBody}`}>
            <div className="form-check form-switch mx-3">
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
              <label
                className={ParametroStyle.formCheckLabel}
                htmlFor="telegramHabilitado"
              >
                <strong>Habilitar Notificaciones por Telegram</strong>
                <br />
                <small className="text-muted">
                  Enviar alertas a través de Telegram
                </small>
              </label>
            </div>

            {alertas.telegramHabilitado && (
              <div className={`${ParametroStyle.row}`}>
                <div className="col-md-5 mx-3 mt-3">
                  <label
                    htmlFor="cantidadReintentos"
                    className={ParametroStyle.formLabel}
                  >
                    <strong>Cantidad de Reintentos</strong>
                  </label>
                  <input
                    type="number"
                    className={ParametroStyle.formControl}
                    id="cantidadReintentos"
                    min="1"
                    max="10"
                    value={alertas.cantidadReintentosTelegram}
                    onChange={(e) =>
                      handleInputChange(
                        "cantidadReintentosTelegram",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <small className={`${ParametroStyle.formText} text-muted`}>
                    Número de veces que se reintentará enviar la alerta
                  </small>
                </div>

                <div className="col-md-5 mx-3 mt-3">
                  <label
                    htmlFor="intervaloReintentos"
                    className={`${ParametroStyle.formLabel}`}
                  >
                    <strong>Intervalo entre Reintentos (minutos)</strong>
                  </label>
                  <input
                    type="number"
                    className={ParametroStyle.formControl}
                    id="intervaloReintentos"
                    min="1"
                    max="60"
                    value={alertas.intervaloReintentosTelegram}
                    onChange={(e) =>
                      handleInputChange(
                        "intervaloReintentosTelegram",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={!alertas.alertasInventarioHabilitadas}
                  />
                  <small className={`${ParametroStyle.formText} text-muted`}>
                    Minutos de espera entre cada reintento
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Email */}
        <div className={`${ParametroStyle.card}`}>
          <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
            <h5 className={ContenidoStyle.pageTitle}>
              <i className="fas fa-envelope me-2"></i>
              Configuración de Email
            </h5>
          </div>
          <div className={`${ParametroStyle.cardBody}`}>
            <div className="form-check form-switch mx-3">
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
              <label
                className={ParametroStyle.formCheckLabel}
                htmlFor="emailHabilitado"
              >
                <strong>Habilitar Notificaciones por Email</strong>
                <br />
                <small className="text-muted">
                  Enviar alertas a través de correo electrónico
                </small>
              </label>
            </div>

            {alertas.emailHabilitado && (
              <div className="mb-3">
                <label
                  htmlFor="destinatarioEmail"
                  className={ParametroStyle.formLabel}
                >
                  <strong>Correo Electrónico de Destinatario</strong>
                </label>
                <input
                  type="email"
                  className={ParametroStyle.formControl}
                  id="destinatarioEmail"
                  value={alertas.destinatarioEmail}
                  onChange={(e) =>
                    handleInputChange("destinatarioEmail", e.target.value)
                  }
                  placeholder="admin@comedor.com"
                  disabled={!alertas.alertasInventarioHabilitadas}
                />
                <small className={`${ParametroStyle.formText} text-muted`}>
                  Dirección de correo donde se enviarán las alertas
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Visual */}
        <div className={`${ParametroStyle.card} bg-light text-dark`}>
          <div className={ParametroStyle.cardHeader}>
            <h5 className={ContenidoStyle.pageTitle}>
              <i className="fas fa-info-circle me-2"></i>
              Resumen de Configuración
            </h5>
          </div>
          <div className={ParametroStyle.cardBody}>
            <div className={ParametroStyle.row}>
              <div className="col-md-6">
                <p className="mx-2">
                  <strong>Estado General:</strong>

                  <span
                    className={`${ParametroStyle.badge} ${
                      alertas.alertasInventarioHabilitadas
                        ? ParametroStyle.bgSuccess
                        : ParametroStyle.bgDanger
                    }`}
                  >
                    {alertas.alertasInventarioHabilitadas
                      ? "Alertas Habilitadas"
                      : "Alertas Deshabilitadas"}
                  </span>
                </p>

                <p className="mx-2">
                  <strong>Canales Activos:</strong>

                  {alertas.telegramHabilitado && (
                    <span
                      className={`${ParametroStyle.badge} ${ParametroStyle.bgInfo} me-2`}
                    >
                      <i className="fab fa-telegram me-1"></i>Telegram
                    </span>
                  )}
                  {alertas.emailHabilitado && (
                    <span
                      className={`${ParametroStyle.badge} ${ParametroStyle.bgSecondary} me-2`}
                    >
                      <i className="fas fa-envelope me-1"></i>Email
                    </span>
                  )}
                  {alertas.notificacionesUIHabilitadas && (
                    <span
                      className={`${ParametroStyle.badge} ${ParametroStyle.bgPrimary} me-2`}
                    >
                      <i className="fas fa-bell me-1"></i>UI
                    </span>
                  )}
                  {!alertas.telegramHabilitado &&
                    !alertas.emailHabilitado &&
                    !alertas.notificacionesUIHabilitadas && (
                      <span className={ParametroStyle.textMuted}>
                        Ninguno habilitado
                      </span>
                    )}
                </p>

                {alertas.telegramHabilitado && (
                  <p className="ms-2">
                    <strong>Telegram:</strong>{" "}
                    {alertas.cantidadReintentosTelegram} reintentos cada{" "}
                    {alertas.intervaloReintentosTelegram} min
                  </p>
                )}
              </div>

              <div className="col-md-5">
                <p className="mx-2">
                  <strong>Umbrales de Alerta</strong>
                  <br />
                  <div className="ms-3">
                    <i className="fas fa-exclamation-circle text-danger me-2"></i>
                    Crítico: ≤ {alertas.porcentajeAlertaCritico}%
                    <br />
                    <i className="fas fa-arrow-down text-warning me-2"></i>
                    Bajo: ≤ {alertas.porcentajeAlertaBajo}%
                  </div>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className={ComponenteStyle.formActions}>
          <button
            type="button"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} `}
            onClick={() => cargarConfiguracionAlertas()}
            disabled={saving}
          >
            <i className="fas fa-redo"></i>
            Recargar
          </button>
          <button
            type="submit"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate} `}
            disabled={saving}
          >
            <i className="fas fa-save"></i>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Alertas;
