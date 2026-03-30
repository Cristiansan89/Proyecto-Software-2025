import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { proveedorInsumoService } from "../../services/proveedorInsumoService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
} from "../../utils/alertService";
import formatCantidad from "../../utils/formatCantidad";
import { parsearDecimalAR, sanitizarInputDecimal } from "../../utils/formatNumero";

const ESTADO_RECIBIDO_ID = 6;

const OPCIONES_CALIFICACION = [
  { value: "Excelente", label: "⭐⭐⭐⭐⭐ Excelente" },
  { value: "Bueno", label: "⭐⭐⭐⭐ Bueno" },
  { value: "Regular", label: "⭐⭐⭐ Regular" },
  { value: "Malo", label: "⭐⭐ Malo" },
];

const RecepcionInsumo = ({ isOpen, onClose, onRecepcionRegistrada }) => {
  const { user } = useAuth();

  // --- Estado de búsqueda ---
  const [numeroPedido, setNumeroPedido] = useState("");
  const [buscando, setBuscando] = useState(false);

  // --- Estado del pedido encontrado ---
  const [pedidoEncontrado, setPedidoEncontrado] = useState(null);
  const [filas, setFilas] = useState([]);
  const [pedidoYaRecibido, setPedidoYaRecibido] = useState(false);

  // --- Estado de envío ---
  const [guardando, setGuardando] = useState(false);

  // Limpiar todo al cerrar
  useEffect(() => {
    if (!isOpen) {
      setNumeroPedido("");
      setPedidoEncontrado(null);
      setFilas([]);
      setPedidoYaRecibido(false);
    }
  }, [isOpen]);

  // --- Búsqueda del pedido ---
  const buscarPedido = async () => {
    const termino = numeroPedido.trim();
    if (!termino) {
      showInfo("Ingrese un número de pedido para buscar");
      return;
    }

    setBuscando(true);
    setPedidoEncontrado(null);
    setFilas([]);
    setPedidoYaRecibido(false);

    try {
      // 1. Traer lista de pedidos confirmados
      const { data: confirmados } = await API.get("/pedidos/confirmados");

      // 2. Buscar coincidencia por prefijo UUID (primeros 8 chars) o UUID completo
      const terminoUpper = termino.toUpperCase();
      const pedido = confirmados.find(
        (p) =>
          p.id_pedido_uuid?.toUpperCase() === terminoUpper ||
          p.id_pedido_uuid?.substring(0, 8).toUpperCase() === terminoUpper,
      );

      if (!pedido) {
        // Buscar en todos los pedidos para detectar si ya fue recibido
        try {
          const { data: todosPedidos } = await API.get("/pedidos");
          const pedidoGeneral = Array.isArray(todosPedidos)
            ? todosPedidos.find(
                (p) =>
                  p.id_pedido_uuid?.toUpperCase() === terminoUpper ||
                  p.id_pedido_uuid?.substring(0, 8).toUpperCase() === terminoUpper,
              )
            : null;
          if (pedidoGeneral?.estadoPedido === "Recibido") {
            showWarning(
              "Recepción ya registrada",
              "Este pedido ya fue recibido y registrado anteriormente. No es posible volver a registrar la recepción.",
            );
            return;
          }
        } catch (_) {
          // Si falla la búsqueda general, mostrar mensaje genérico
        }
        showWarning(
          "Pedido no encontrado",
          "No se encontró un pedido confirmado con ese número. Verifique que el proveedor ya haya confirmado la disponibilidad.",
        );
        return;
      }

      // 3. Verificar que el pedido no esté ya "Recibido"
      if (pedido.estadoPedido === "Recibido") {
        // Mostrar advertencia pero permitir visualizar el pedido
        setPedidoYaRecibido(true);
        setPedidoEncontrado(pedido);
        setFilas([]); // No mostrar formulario de entrada
        showWarning(
          "Recepción ya registrada",
          "Este pedido ya fue recibido y registrado anteriormente. No es posible volver a registrar la recepción.",
        );
        return;
      }

      // 4. Cargar detalles del pedido (con estadoConfirmacion e id_insumo)
      const { data: detalles } = await API.get(
        `/pedidos/confirmados/${pedido.id_pedido_uuid}`,
      );

      // 5. Filtrar solo los disponibles (ignorar rechazados)
      const disponibles = detalles.filter(
        (d) => d.estadoConfirmacion === "Disponible",
      );

      if (disponibles.length === 0) {
        showWarning(
          "Sin insumos disponibles",
          "El proveedor no marcó ningún insumo como Disponible en este pedido.",
        );
        return;
      }

      // 6. Construir filas con cantidadRecibida = cantidadSolicitada por defecto
      const filasIniciales = disponibles.map((d) => ({
        id_insumo: d.id_insumo,
        nombreInsumo: d.nombreInsumo,
        unidadMedida: d.unidadMedida,
        cantidadConfirmada: Number(d.cantidadSolicitada),
        cantidadRecibida: Number(d.cantidadSolicitada),
        calificacion: "",
        id_proveedor: pedido.id_proveedor_uuid,
      }));

      setPedidoEncontrado(pedido);
      setFilas(filasIniciales);
    } catch (error) {
      showError(
        "Error al buscar pedido",
        error.response?.data?.message || error.message,
      );
    } finally {
      setBuscando(false);
    }
  };

  // --- Actualizar una fila ---
  const actualizarFila = (index, campo, valor) => {
    setFilas((prev) =>
      prev.map((fila, i) => {
        if (i !== index) return fila;
        return { ...fila, [campo]: valor };
      }),
    );
  };

  // --- Validación de cantidad ---
  const handleCantidadRecibida = (index, valor) => {
    // Sanitizar: solo dígitos y un separador decimal (coma o punto)
    const valorSanitizado = sanitizarInputDecimal(valor);
    const num = parsearDecimalAR(valorSanitizado);
    const max = filas[index].cantidadConfirmada;

    if (valorSanitizado !== "" && (isNaN(num) || num < 0)) return;
    if (!isNaN(num) && num > max) {
      showWarning(
        "Cantidad excedida",
        `La cantidad recibida no puede ser mayor a la confirmada (${max} ${filas[index].unidadMedida}).`,
      );
      actualizarFila(index, "cantidadRecibida", max);
      return;
    }
    actualizarFila(index, "cantidadRecibida", valorSanitizado === "" ? "" : valorSanitizado);
  };

  // --- Guardar recepción ---
  const guardarRecepcion = async () => {
    // Validaciones previas al envío
    const filasSinCantidad = filas.filter(
      (f) => f.cantidadRecibida === "" || parsearDecimalAR(f.cantidadRecibida) <= 0,
    );
    if (filasSinCantidad.length > 0) {
      showWarning(
        "Cantidad inválida",
        `Ingrese una cantidad recibida mayor a 0 para todos los insumos.`,
      );
      return;
    }

    const filasSinCalificacion = filas.filter((f) => !f.calificacion);
    if (filasSinCalificacion.length > 0) {
      const nombres = filasSinCalificacion.map((f) => f.nombreInsumo).join(", ");
      showWarning(
        "Calificación requerida",
        `Seleccione una calificación para: ${nombres}`,
      );
      return;
    }

    const confirmado = await showConfirm(
      "¿Confirmar recepción?",
      `Se registrarán ${filas.length} entrada(s) de insumos y el pedido será marcado como Recibido.`,
    );
    if (!confirmado) return;

    setGuardando(true);
    const errores = [];

    try {
      const idUsuario = user?.idUsuario || user?.id_usuario;
      const idPedido = pedidoEncontrado.id_pedido_uuid;

      // 1. Registrar movimiento de entrada por cada insumo
      for (const fila of filas) {
        try {
          await API.post("/movimientos-inventarios", {
            id_insumo: fila.id_insumo,
            tipoMovimiento: "Entrada",
            cantidadMovimiento: parsearDecimalAR(fila.cantidadRecibida),
            comentarioMovimiento: `Recepción pedido ${idPedido.substring(0, 8).toUpperCase()}`,
            id_usuario: idUsuario,
            id_tipoMerma: null,
          });
        } catch (err) {
          errores.push(
            `Movimiento de ${fila.nombreInsumo}: ${err.response?.data?.message || err.message}`,
          );
        }

        // 2. Actualizar calificación en proveedor-insumo
        try {
          await proveedorInsumoService.update(
            fila.id_proveedor,
            fila.id_insumo,
            { calificacion: fila.calificacion },
          );
        } catch (err) {
          // No bloquear si falla la calificación
          console.warn(
            `[RecepcionInsumo] No se actualizó calificación de ${fila.nombreInsumo}:`,
            err.message,
          );
        }
      }

      // 3. Cambiar estado del pedido a Recibido (ID 6)
      try {
        await API.patch(`/pedidos/${idPedido}/estado`, {
          estado: ESTADO_RECIBIDO_ID,
        });
      } catch (err) {
        errores.push(
          `Cambio de estado del pedido: ${err.response?.data?.message || err.message}`,
        );
      }

      if (errores.length > 0) {
        showWarning(
          "Recepción parcial",
          `Se completó con advertencias:<br/>• ${errores.join("<br/>• ")}`,
        );
      } else {
        showSuccess(
          "Recepción registrada",
          "Las entradas de insumos fueron cargadas y el pedido fue marcado como Recibido.",
        );
      }

      if (onRecepcionRegistrada) onRecepcionRegistrada();
      onClose();
    } catch (error) {
      showError(
        "Error al guardar",
        error.response?.data?.message || error.message,
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Buscador */}
      <div className="mb-4">
        <label className="form-label fw-semibold">
          <i className="fas fa-search me-2"></i>
          Número de Pedido
        </label>
        <div className="d-flex align-items-start gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Ej: A1B2C3D4 (primeros 8 caracteres del UUID)"
            value={numeroPedido}
            onChange={(e) => setNumeroPedido(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarPedido()}
            disabled={buscando || guardando}
            style={{width: "500px"}}
          />
          <button
            className="btn btn-primary"
            onClick={buscarPedido}
            disabled={buscando || guardando}
          >
            {buscando ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Buscando...
              </>
            ) : (
              <>
                <i className="fas fa-search me-1"></i>
                Buscar
              </>
            )}
          </button>
        </div>
        <div className="form-text">
          Ingrese los primeros 8 caracteres del UUID del pedido o el UUID completo.
        </div>
      </div>

      {/* Info del pedido encontrado */}
      {pedidoEncontrado && (
        <>
          {pedidoYaRecibido && (
            <div className="alert alert-warning mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-2" style={{fontSize: "1.2rem"}}></i>
                <div>
                  <strong>Recepción ya registrada</strong>
                  <br />
                  <small>Este pedido ya fue recibido y registrado anteriormente. No es posible volver a registrar la recepción ni calificar.</small>
                </div>
              </div>
            </div>
          )}
          <div className="alert alert-info py-2 mb-3">
            <div className="row">
              <div className="col-md-6">
                <strong>
                  <i className="fas fa-truck me-1"></i>
                  Proveedor:
                </strong>{" "}
                {pedidoEncontrado.razonSocial}
              </div>
              <div className="col-md-6">
                <strong>
                  <i className="fas fa-calendar-alt me-1"></i>
                  Fecha Emisión:
                </strong>{" "}
                {pedidoEncontrado.fechaEmision}
              </div>
              <div className="col-md-6 mt-1">
                <strong>
                  <i className="fas fa-hashtag me-1"></i>
                  Pedido:
                </strong>{" "}
                <span className="badge bg-secondary">
                  {pedidoEncontrado.id_pedido_uuid?.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="col-md-6 mt-1">
                <strong>
                  <i className="fas fa-check me-1"></i>
                  Estado:
                </strong>{" "}
                <span className="badge bg-success">
                  {pedidoEncontrado.estadoPedido}
                </span>
                {" "}
                <small className="text-muted">
                  ({filas.length} insumo(s) disponibles)
                </small>
              </div>
            </div>
          </div>

          {/* Tabla de recepción */}
          {!pedidoYaRecibido ? (
            <div className="table-responsive mb-3">
              <table className={`table table-bordered table-hover align-middle ${pedidoYaRecibido ? "table-secondary" : ""}`}>
                <thead className="table-primary">
                  <tr>
                    <th>Insumo</th>
                    <th className="text-center" style={{ width: "150px" }}>
                      Cant. Confirmada
                    </th>
                    <th className="text-center" style={{ width: "160px" }}>
                      Cant. Recibida <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "220px" }}>
                      Calificación <span className="text-danger">*</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, index) => (
                    <tr key={`${fila.id_insumo}-${index}`}>
                      {/* Insumo */}
                      <td>
                        <strong>{fila.nombreInsumo}</strong>
                        <br />
                        <small className="text-muted">{fila.unidadMedida}</small>
                      </td>

                      {/* Cantidad Confirmada (no editable) */}
                      <td className="text-center">
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                          {formatCantidad(fila.cantidadConfirmada, fila.unidadMedida)} {fila.unidadMedida}
                        </span>
                      </td>

                      {/* Cantidad Recibida (editable) */}
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="form-control text-center"
                          value={fila.cantidadRecibida}
                          onChange={(e) =>
                            handleCantidadRecibida(index, e.target.value)
                          }
                          placeholder="0,000"
                          disabled={guardando || pedidoYaRecibido}
                        />
                      </td>

                      {/* Calificación */}
                      <td>
                        <select
                          className={`form-select ${!fila.calificacion ? "border-warning" : "border-success"}`}
                          value={fila.calificacion}
                          onChange={(e) =>
                            actualizarFila(index, "calificacion", e.target.value)
                          }
                          disabled={guardando || pedidoYaRecibido}
                        >
                          <option value="">-- Seleccionar --</option>
                          {OPCIONES_CALIFICACION.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info mb-3">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Pedido ya recibido</strong>
              <br />
              La recepción de este pedido ya fue registrada. Para consultar los detalles o realizar cambios, contacte al administrador.
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={guardando}
            >
              <i className="fas fa-times me-1"></i>
              Cancelar
            </button>
            <button
              className="btn btn-success"
              onClick={guardarRecepcion}
              disabled={guardando || pedidoYaRecibido}
              title={pedidoYaRecibido ? "Este pedido ya fue recibido" : ""}
            >
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle me-1"></i>
                  Confirmar Recepción
                </>
              )}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default RecepcionInsumo;
