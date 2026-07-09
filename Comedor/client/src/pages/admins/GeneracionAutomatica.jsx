import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { showWarning } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ParametroStyle from "../../styles/Parametros.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const GeneracionAutomatica = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estados para configuración
  const [configuracion, setConfiguracion] = useState({
    // Insumos Semanales
    insumosSemanalesHabilitado: true,
    insumosSemanalesDia: "viernes", // lunes, martes, miércoles, jueves, viernes
    insumosSemanalesHora: "08:00",
    insumosSemanalesMinuto: "00",
    insumosSemanalesNotificacion: true,

    // Pedidos Automáticos
    pedidosAutomaticosHabilitado: true,
    pedidosAutomaticosDia: "viernes",
    pedidosAutomaticosHora: "09:00",
    pedidosAutomaticosMinuto: "00",
    pedidosAutomaticosNotificacion: true,

    // Configuración de reintentos
    cantidadReintentosPedidos: 3,
    intervaloReintentosPedidos: 5, // minutos

    // Finalización Automática
    finalizacionAutomaticaHabilitado: false,
    finalizacionAutomaticaHora: "20:00",
  });

  const diasSemana = [
    { valor: "lunes", label: "Lunes" },
    { valor: "martes", label: "Martes" },
    { valor: "miercoles", label: "Miércoles" },
    { valor: "jueves", label: "Jueves" },
    { valor: "viernes", label: "Viernes" },
    { valor: "sabado", label: "Sábado" },
    { valor: "domingo", label: "Domingo" },
  ];

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await API.get("/parametros-sistemas");
      const parametros = response.data || [];

      // Cargar los parámetros existentes
      const configMap = {};
      parametros.forEach((param) => {
        configMap[param.nombreParametro] = param.valor;
      });

      setConfiguracion((prev) => ({
        ...prev,
        insumosSemanalesHabilitado:
          configMap["INSUMOS_SEMANALES_HABILITADO"] === "true" || false,
        insumosSemanalesDia: configMap["INSUMOS_SEMANALES_DIA"] || "viernes",
        insumosSemanalesHora: configMap["INSUMOS_SEMANALES_HORA"] || "08:00",
        insumosSemanalesNotificacion:
          configMap["INSUMOS_SEMANALES_NOTIFICACION"] === "true" || false,

        pedidosAutomaticosHabilitado:
          configMap["PEDIDOS_AUTOMATICOS_HABILITADO"] === "true" || false,
        pedidosAutomaticosDia:
          configMap["PEDIDOS_AUTOMATICOS_DIA"] || "viernes",
        pedidosAutomaticosHora:
          configMap["PEDIDOS_AUTOMATICOS_HORA"] || "09:00",
        pedidosAutomaticosNotificacion:
          configMap["PEDIDOS_AUTOMATICOS_NOTIFICACION"] === "true" || false,

        cantidadReintentosPedidos:
          parseInt(configMap["CANTIDAD_REINTENTOS_PEDIDOS"]) || 3,
        intervaloReintentosPedidos:
          parseInt(configMap["INTERVALO_REINTENTOS_PEDIDOS"]) || 5,

        finalizacionAutomaticaHabilitado:
          configMap["FINALIZACION_AUTOMATICA_HABILITADO"] === "true" || false,
        finalizacionAutomaticaHora:
          configMap["FINALIZACION_AUTOMATICA_HORA"] || "20:00",
      }));
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error al cargar la configuración",
      });
    } finally {
      setLoading(false);
    }
  };

  const crearOActualizarParametro = async (nombreParametro, valor) => {
    try {
      const response = await API.get("/parametros-sistemas");
      const parametros = response.data || [];
      const existente = parametros.find(
        (p) => p.nombreParametro === nombreParametro,
      );

      if (existente) {
        await API.patch(`/parametros-sistemas/${existente.id_parametro}`, {
          nombreParametro,
          valor: String(valor),
          tipoParametro: "Texto",
          estado: "Activo",
        });
      } else {
        await API.post("/parametros-sistemas", {
          nombreParametro,
          valor: String(valor),
          tipoParametro: "Texto",
          estado: "Activo",
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Guardar parámetros de insumos semanales
      await crearOActualizarParametro(
        "INSUMOS_SEMANALES_HABILITADO",
        String(configuracion.insumosSemanalesHabilitado),
      );
      await crearOActualizarParametro(
        "INSUMOS_SEMANALES_DIA",
        configuracion.insumosSemanalesDia,
      );
      await crearOActualizarParametro(
        "INSUMOS_SEMANALES_HORA",
        configuracion.insumosSemanalesHora,
      );
      await crearOActualizarParametro(
        "INSUMOS_SEMANALES_NOTIFICACION",
        String(configuracion.insumosSemanalesNotificacion),
      );

      // Guardar parámetros de pedidos automáticos
      await crearOActualizarParametro(
        "PEDIDOS_AUTOMATICOS_HABILITADO",
        String(configuracion.pedidosAutomaticosHabilitado),
      );
      await crearOActualizarParametro(
        "PEDIDOS_AUTOMATICOS_DIA",
        configuracion.pedidosAutomaticosDia,
      );
      await crearOActualizarParametro(
        "PEDIDOS_AUTOMATICOS_HORA",
        configuracion.pedidosAutomaticosHora,
      );
      await crearOActualizarParametro(
        "PEDIDOS_AUTOMATICOS_NOTIFICACION",
        String(configuracion.pedidosAutomaticosNotificacion),
      );

      // Guardar parámetros de reintentos
      await crearOActualizarParametro(
        "CANTIDAD_REINTENTOS_PEDIDOS",
        String(configuracion.cantidadReintentosPedidos),
      );
      await crearOActualizarParametro(
        "INTERVALO_REINTENTOS_PEDIDOS",
        String(configuracion.intervaloReintentosPedidos),
      );

      // Guardar parámetros de finalización automática
      await crearOActualizarParametro(
        "FINALIZACION_AUTOMATICA_HABILITADO",
        String(configuracion.finalizacionAutomaticaHabilitado),
      );
      await crearOActualizarParametro(
        "FINALIZACION_AUTOMATICA_HORA",
        configuracion.finalizacionAutomaticaHora,
      );

      setMensaje({
        tipo: "Success",
        texto: "Configuración de generación automática guardada correctamente",
      });

      // Recargar la configuración
      await cargarConfiguracion();

      // Recargar el scheduler del backend
      try {
        await API.post("/generacion-automatica/recargar-scheduler", {});
        //console.log("Scheduler recargado exitosamente");
      } catch (error) {
        //console.warn("Aviso: No se pudo recargar el scheduler", error);
        showWarning("Aviso", "No se pudo recargar el scheduler del backend.");
      }
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error al guardar la configuración",
      });
    } finally {
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setMensaje(null), 5000);
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfiguracion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const ejecutarGeneracionInsumos = async () => {
    setSaving(true);
    try {
      const response = await API.post(
        "/generacion-automatica/generar-insumos-semanales",
        {},
      );
      setMensaje({
        tipo: "success",
        texto: `Insumos generados correctamente. ${
          response.data.insumos?.length || 0
        } insumos procesados.`,
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.mensaje || "Error al generar insumos",
      });
    } finally {
      setSaving(false);
    }
  };

  const ejecutarGeneracionPedidos = async () => {
    setSaving(true);
    try {
      const response = await API.post(
        "/generacion-automatica/generar-pedidos-automaticos",
        {},
      );
      setMensaje({
        tipo: "success",
        texto: `Pedidos generados correctamente. ${
          response.data.pedidosCreados?.length || 0
        } pedidos creados.`,
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.mensaje || "Error al generar pedidos",
      });
    } finally {
      setSaving(false);
    }
  };

  const obtenerHorasDisponibles = () => {
    const horas = [];
    for (let i = 8; i <= 22; i++) {
      horas.push({
        valor: String(i).padStart(2, "0"),
        label: String(i).padStart(2, "0"),
      });
    }
    return horas;
  };

  const obtenerHorasFinalizacion = () => {
    const horas = [];
    for (let i = 8; i <= 23; i++) {
      horas.push({
        valor: String(i).padStart(2, "0"),
        label: String(i).padStart(2, "0"),
      });
    }
    return horas;
  };

  const obtenerMinutosDisponibles = () => {
    const minutos = [];
    for (let i = 0; i < 60; i += 5) {
      const valor = String(i).padStart(2, "0");
      minutos.push({ valor, label: valor });
    }
    return minutos;
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Configuración Automática...</p>
      </div>
    );
  }
  return (
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
          {/* Si quieres agregar un icono dinámico según el tipo antes del texto */}
          <i
            className={`fas ${
              mensaje.tipo.toLowerCase() === "success"
                ? "fa-check-circle"
                : "fa-exclamation-circle"
            } me-2`}
          ></i>
          {mensaje.texto}
        </div>
      )}

      {/* Sección: Finalización Automática */}
      <div className={ParametroStyle.card}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-calendar-check me-2"></i>
            Finalización Automática de Planificaciones
          </h5>
        </div>
        <div className={ParametroStyle.cardBody}>
          <div className="col-md-6 mx-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="finalizacionAutomatica"
                checked={configuracion.finalizacionAutomaticaHabilitado}
                onChange={(e) =>
                  handleInputChange(
                    "finalizacionAutomaticaHabilitado",
                    e.target.checked,
                  )
                }
              />
              <label
                className={ParametroStyle.formCheckLabel}
                htmlFor="finalizacionAutomatica"
              >
                <strong>Habilitar finalización automática</strong>
              </label>
              <small className="text-muted d-block mt-2 mx-2">
                Cuando está habilitado, las planificaciones se finalizarán
                automáticamente en la fecha final a la hora configurada
              </small>
            </div>
          </div>

          {configuracion.finalizacionAutomaticaHabilitado && (
            <>
              <div
                className={`${ParametroStyle.row} ${ParametroStyle.automatica}`}
              >
                <div className="col-md-6 mx-3">
                  <label className={ParametroStyle.formCheckLabel}>
                    <strong>Hora de Finalización</strong>
                  </label>
                  <div className="d-flex gap-2 align-items-center mt-2 mb-2">
                    <select
                      className={ComponenteStyle.formSelect}
                      style={{ maxWidth: "80px" }}
                      value={
                        configuracion.finalizacionAutomaticaHora?.split(
                          ":",
                        )[0] || "20"
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "finalizacionAutomaticaHora",
                          `${e.target.value}:${
                            configuracion.finalizacionAutomaticaHora?.split(
                              ":",
                            )[1] || "00"
                          }`,
                        )
                      }
                    >
                      {obtenerHorasFinalizacion().map((hora) => (
                        <option key={hora.valor} value={hora.valor}>
                          {hora.label}
                        </option>
                      ))}
                    </select>
                    <span className="fw-bold">:</span>
                    <select
                      className={ComponenteStyle.formSelect}
                      style={{ maxWidth: "80px" }}
                      value={
                        configuracion.finalizacionAutomaticaHora?.split(
                          ":",
                        )[1] || "00"
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "finalizacionAutomaticaHora",
                          `${
                            configuracion.finalizacionAutomaticaHora?.split(
                              ":",
                            )[0] || "20"
                          }:${e.target.value}`,
                        )
                      }
                    >
                      {obtenerMinutosDisponibles().map((minuto) => (
                        <option key={minuto.valor} value={minuto.valor}>
                          {minuto.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <small className="text-muted">
                    Hora a la que se finalizarán las planificaciones
                  </small>
                </div>
              </div>

              <div
                className={`${ParametroStyle.alert} ${ParametroStyle.alertWarning} mt-3`}
              >
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Nota:</strong> La finalización se ejecutará diariamente
                a la hora configurada. Si hay una planificación activa cuya
                fecha final coincide con el día actual, será finalizada
                automáticamente.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección: Generación de Insumos Semanales */}
      <div className={`${ParametroStyle.card}`}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-boxes me-2"></i>
            Generación Automática de Insumos Semanales
          </h5>
        </div>
        <div className={`${ParametroStyle.cardBody}`}>
          <div className="form-check form-switch mx-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="insumosSemanalesHabilitado"
              checked={configuracion.insumosSemanalesHabilitado}
              onChange={(e) =>
                handleInputChange(
                  "insumosSemanalesHabilitado",
                  e.target.checked,
                )
              }
            />
            <label
              className={ParametroStyle.formCheckLabel}
              htmlFor="insumosSemanalesHabilitado"
            >
              <strong>Habilitar Generación Automática de Insumos</strong>
              <br />
              <small className="text-muted">
                Genera automáticamente la lista de insumos en el día y hora
                especificada
              </small>
            </label>
          </div>

          {configuracion.insumosSemanalesHabilitado && (
            <>
              <div
                className={`${ParametroStyle.row} ${ParametroStyle.automatica}`}
              >
                <div className="col-md-5 mx-3">
                  <label className={ParametroStyle.formCheckLabel}>
                    <strong>Día de la Semana</strong>
                  </label>
                  <div className="mx-2 mt-2">
                    <select
                      style={{ maxWidth: "130px" }}
                      className={ComponenteStyle.formSelect}
                      value={configuracion.insumosSemanalesDia}
                      onChange={(e) =>
                        handleInputChange("insumosSemanalesDia", e.target.value)
                      }
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.valor} value={dia.valor}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Día en que se generarán los insumos
                    </small>
                  </div>
                </div>

                <div className="col-md-5 mx-3">
                  <label className={ParametroStyle.formCheckLabel}>
                    <strong>Hora</strong>
                  </label>
                  <div className="mx-2 mt-2">
                    <div className="d-flex gap-2 align-items-center">
                      <select
                        className={ComponenteStyle.formSelect}
                        style={{ maxWidth: "80px" }}
                        value={
                          configuracion.insumosSemanalesHora?.split(":")[0] ||
                          "08"
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "insumosSemanalesHora",
                            `${e.target.value}:${
                              configuracion.insumosSemanalesHora?.split(
                                ":",
                              )[1] || "00"
                            }`,
                          )
                        }
                      >
                        {obtenerHorasDisponibles().map((hora) => (
                          <option key={hora.valor} value={hora.valor}>
                            {hora.label}
                          </option>
                        ))}
                      </select>

                      <span className="fw-bold">:</span>

                      <select
                        style={{ maxWidth: "80px" }}
                        className={ComponenteStyle.formSelect}
                        value={
                          configuracion.insumosSemanalesHora?.split(":")[1] ||
                          "00"
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "insumosSemanalesHora",
                            `${
                              configuracion.insumosSemanalesHora?.split(
                                ":",
                              )[0] || "08"
                            }:${e.target.value}`,
                          )
                        }
                      >
                        {obtenerMinutosDisponibles().map((minuto) => (
                          <option key={minuto.valor} value={minuto.valor}>
                            {minuto.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Hora en la que se ejecutará la generación (formato 24h)
                    </small>
                  </div>
                </div>
              </div>

              <div className="mb-3 mt-4 mx-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="insumosNotificacion"
                    checked={configuracion.insumosSemanalesNotificacion}
                    onChange={(e) =>
                      handleInputChange(
                        "insumosSemanalesNotificacion",
                        e.target.checked,
                      )
                    }
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
                    htmlFor="insumosNotificacion"
                  >
                    <strong>Enviar notificación</strong> cuando se generen los
                    insumos
                  </label>
                </div>
              </div>

              <div
                className={`${ParametroStyle.alert} ${ParametroStyle.alertInfo} mt-3`}
              >
                <i className="fas fa-info-circle me-2"></i>
                <strong>Próxima ejecución:</strong>{" "}
                {
                  diasSemana.find(
                    (d) => d.valor === configuracion.insumosSemanalesDia,
                  )?.label
                }{" "}
                a las {configuracion.insumosSemanalesHora}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección: Generación de Pedidos Automáticos */}
      <div className={`${ParametroStyle.card}`}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-shopping-cart me-2"></i>
            Generación Automática de Pedidos
          </h5>
        </div>
        <div className={`${ParametroStyle.cardBody}`}>
          <div className="form-check form-switch mx-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="pedidosAutomaticosHabilitado"
              checked={configuracion.pedidosAutomaticosHabilitado}
              onChange={(e) =>
                handleInputChange(
                  "pedidosAutomaticosHabilitado",
                  e.target.checked,
                )
              }
            />
            <label
              className={ParametroStyle.formCheckLabel}
              htmlFor="pedidosAutomaticosHabilitado"
            >
              <strong>Habilitar Generación Automática de Pedidos</strong>
              <br />
              <small className="text-muted">
                Genera automáticamente pedidos basados en los insumos requeridos
              </small>
            </label>
          </div>

          {configuracion.pedidosAutomaticosHabilitado && (
            <>
              <div
                className={`${ParametroStyle.row} ${ParametroStyle.automatica}`}
              >
                <div className="col-md-5 mx-3">
                  <label className={ParametroStyle.formCheckLabel}>
                    <strong>Día de la Semana</strong>
                  </label>
                  <div className="mx-2 mt-2">
                    <select
                      style={{ maxWidth: "130px" }}
                      className={ComponenteStyle.formSelect}
                      value={configuracion.pedidosAutomaticosDia}
                      onChange={(e) =>
                        handleInputChange(
                          "pedidosAutomaticosDia",
                          e.target.value,
                        )
                      }
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.valor} value={dia.valor}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>{" "}
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Día en que se generarán los pedidos
                    </small>
                  </div>
                </div>

                <div className="col-md-5 mx-3">
                  <label className={ParametroStyle.formCheckLabel}>
                    <strong>Hora</strong>
                  </label>
                  <div className="mt-2 mx-2">
                    <div className="d-flex gap-2 align-items-center">
                      <select
                        className={ComponenteStyle.formSelect}
                        style={{ maxWidth: "80px" }}
                        value={
                          configuracion.pedidosAutomaticosHora?.split(":")[0] ||
                          "09"
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "pedidosAutomaticosHora",
                            `${e.target.value}:${
                              configuracion.pedidosAutomaticosHora?.split(
                                ":",
                              )[1] || "00"
                            }`,
                          )
                        }
                      >
                        {obtenerHorasDisponibles().map((hora) => (
                          <option key={hora.valor} value={hora.valor}>
                            {hora.label}
                          </option>
                        ))}
                      </select>
                      <span className="fw-bold">:</span>
                      <select
                        className={ComponenteStyle.formSelect}
                        style={{ maxWidth: "80px" }}
                        value={
                          configuracion.pedidosAutomaticosHora?.split(":")[1] ||
                          "00"
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "pedidosAutomaticosHora",
                            `${
                              configuracion.pedidosAutomaticosHora?.split(
                                ":",
                              )[0] || "09"
                            }:${e.target.value}`,
                          )
                        }
                      >
                        {obtenerMinutosDisponibles().map((minuto) => (
                          <option key={minuto.valor} value={minuto.valor}>
                            {minuto.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Hora en la que se ejecutará la generación
                    </small>
                  </div>
                </div>
              </div>

              <div
                className={`${ParametroStyle.row} ${ParametroStyle.automatica}`}
              >
                <div className="col-md-5 mx-3">
                  <label
                    htmlFor="cantidadReintentos"
                    className={ParametroStyle.formCheckLabel}
                  >
                    <strong>Cantidad de Reintentos</strong>
                  </label>
                  <div className="mx-2 mt-2">
                    <input
                      type="number"
                      className={ParametroStyle.formControl}
                      id="cantidadReintentos"
                      min="1"
                      max="10"
                      value={configuracion.cantidadReintentosPedidos}
                      onChange={(e) =>
                        handleInputChange(
                          "cantidadReintentosPedidos",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>{" "}
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Número de veces que se reintentará si falla
                    </small>
                  </div>
                </div>

                <div className="col-md-5 mx-3">
                  <label
                    htmlFor="intervaloReintentos"
                    className={ParametroStyle.formCheckLabel}
                  >
                    <strong>Intervalo entre Reintentos (minutos)</strong>
                  </label>
                  <div className="mx-2 mt-2">
                    <input
                      type="number"
                      className={ParametroStyle.formControl}
                      id="intervaloReintentos"
                      min="1"
                      max="60"
                      value={configuracion.intervaloReintentosPedidos}
                      onChange={(e) =>
                        handleInputChange(
                          "intervaloReintentosPedidos",
                          parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="mx-2 mt-2">
                    <small className="text-muted">
                      Minutos de espera entre cada reintento
                    </small>
                  </div>
                </div>
              </div>

              <div className="mb-3 mt-4 mx-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pedidosNotificacion"
                    checked={configuracion.pedidosAutomaticosNotificacion}
                    onChange={(e) =>
                      handleInputChange(
                        "pedidosAutomaticosNotificacion",
                        e.target.checked,
                      )
                    }
                  />
                  <label
                    className={ParametroStyle.formCheckLabel}
                    htmlFor="pedidosNotificacion"
                  >
                    <strong>Enviar notificación</strong> cuando se generen los
                    pedidos
                  </label>
                </div>
              </div>

              <div
                className={`${ParametroStyle.alert} ${ParametroStyle.alertSuccess} mt-3`}
              >
                <i className="fas fa-info-circle me-2"></i>
                <strong>Próxima ejecución:</strong>{" "}
                {
                  diasSemana.find(
                    (d) => d.valor === configuracion.pedidosAutomaticosDia,
                  )?.label
                }{" "}
                a las {configuracion.pedidosAutomaticosHora}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`${ParametroStyle.card}`}>
        <div className={`${ParametroStyle.cardHeader} bg-light text-dark`}>
          <h5 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-list-check me-2"></i>
            Resumen de Configuración
          </h5>
        </div>
        <div className={`${ParametroStyle.cardBody}`}>
          <div className={`${ParametroStyle.row} ${ParametroStyle.automatica}`}>
            <div className="col-md-4">
              <div className="mb-2">
                <strong>Finalización Automática</strong>
                <div className="mt-3">
                  <span
                    className={`${ParametroStyle.badge} ${
                      configuracion.finalizacionAutomaticaHabilitado
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {configuracion.finalizacionAutomaticaHabilitado
                      ? "Habilitado"
                      : "Deshabilitado"}
                  </span>
                </div>
                {configuracion.finalizacionAutomaticaHabilitado && (
                  <div className="small mt-3">
                    🕐 {configuracion.finalizacionAutomaticaHora}
                    <br />
                    <span className="text-muted">
                      Diariamente en la hora indicada
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="mb-2">
                <strong>Insumos Semanales</strong>
                <div className="mt-3">
                  <span
                    className={`${ParametroStyle.badge} ${
                      configuracion.insumosSemanalesHabilitado
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {configuracion.insumosSemanalesHabilitado
                      ? "Habilitado"
                      : "Deshabilitado"}
                  </span>
                </div>
                {configuracion.insumosSemanalesHabilitado && (
                  <div className="small mt-3">
                    📅{" "}
                    {
                      diasSemana.find(
                        (d) => d.valor === configuracion.insumosSemanalesDia,
                      )?.label
                    }
                    <br />
                    🕐 {configuracion.insumosSemanalesHora}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="mb-2">
                <strong>Pedidos Automáticos</strong>
                <div className="mt-3">
                  <span
                    className={`${ParametroStyle.badge} ${
                      configuracion.pedidosAutomaticosHabilitado
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {configuracion.pedidosAutomaticosHabilitado
                      ? "Habilitado"
                      : "Deshabilitado"}
                  </span>
                </div>
                {configuracion.pedidosAutomaticosHabilitado && (
                  <div className="small mt-3">
                    📅{" "}
                    {
                      diasSemana.find(
                        (d) => d.valor === configuracion.pedidosAutomaticosDia,
                      )?.label
                    }
                    <br />
                    🕐 {configuracion.pedidosAutomaticosHora}
                    <br />
                    🔄 {configuracion.cantidadReintentosPedidos} reintentos cada{" "}
                    {configuracion.intervaloReintentosPedidos} min
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} `}
          onClick={() => cargarConfiguracion()}
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
  );
};

export default GeneracionAutomatica;
