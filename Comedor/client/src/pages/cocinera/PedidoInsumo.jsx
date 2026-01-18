import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import PedidoFormSimple from "../../components/cocinera/PedidoFormSimple";
import PedidoAutomaticoForm from "../../components/cocinera/PedidoAutomaticoForm";
import pedidoService from "../../services/pedidoService";
import estadoPedidoService from "../../services/estadoPedidoService";
import insumoService from "../../services/insumoService";
import auditoriaService from "../../services/auditoriaService";
import API from "../../services/api.js";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
  showCancelar,
} from "../../utils/alertService";

const PedidoInsumo = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista', 'crear', 'automatico'
  const [pedidos, setPedidos] = useState([]);
  const [estadosPedido, setEstadosPedido] = useState([]);
  const [insumosBajoStock, setInsumosBajoStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: "",
    fechaInicio: "",
    fechaFin: "",
    proveedor: "",
    usuario: "",
    origen: "",
  });
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [usuariosUnicos, setUsuariosUnicos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [mostrarDetallesPedido, setMostrarDetallesPedido] = useState(null);
  const [mostrarAutomatico, setMostrarAutomatico] = useState(false);

  // Función auxiliar para parsear fechas de manera consistente
  const parsearFecha = (fechaString) => {
    if (!fechaString) return null;

    try {
      let fecha;

      // Si ya tiene formato de fecha completa (con hora)
      if (fechaString.includes("T") || fechaString.includes(":")) {
        fecha = new Date(fechaString);
      } else {
        // Si es solo fecha (YYYY-MM-DD), agregar hora para evitar problemas de zona horaria
        fecha = new Date(fechaString + "T12:00:00");
      }

      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        return null;
      }

      return fecha;
    } catch (error) {
      return null;
    }
  };

  // Función para formatear fechas evitando problemas de zona horaria
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";

    try {
      const fecha = parsearFecha(fechaString);
      if (!fecha) {
        console.error("Fecha inválida:", fechaString);
        return "-";
      }

      return fecha.toLocaleDateString("es-ES");
    } catch (error) {
      console.error("Error al formatear fecha:", fechaString, error);
      return "-";
    }
  };

  // Función para calcular fecha de entrega desde fecha de aprobación
  const calcularFechaEntrega = (fechaAprobacion) => {
    if (!fechaAprobacion) return null;

    try {
      const fecha = parsearFecha(fechaAprobacion);
      if (!fecha) {
        console.error("Fecha de aprobación inválida:", fechaAprobacion);
        return null;
      }

      // Agregar 1 día a la fecha de aprobación
      fecha.setDate(fecha.getDate() + 1);

      // Si cae en sábado (6), mover al lunes
      if (fecha.getDay() === 6) {
        fecha.setDate(fecha.getDate() + 2);
      }
      // Si cae en domingo (0), mover al lunes
      else if (fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }

      return fecha;
    } catch (error) {
      console.error(
        "Error al calcular fecha de entrega:",
        fechaAprobacion,
        error,
      );
      return null;
    }
  };

  // Función para verificar si hay filtros aplicados
  const hayFiltrosAplicados = () => {
    return (
      filtros.estado ||
      filtros.proveedor ||
      filtros.usuario ||
      filtros.origen ||
      filtros.fechaInicio ||
      filtros.fechaFin
    );
  };

  useEffect(() => {
    cargarDatos();
    cargarInsumosBajoStock();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [pedidos, filtros]);

  useEffect(() => {
    // Bloquear scroll del body cuando se abre el modal de detalles
    if (mostrarDetallesPedido) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mostrarDetallesPedido]);

  const aplicarFiltros = () => {
    let pedidosTemp = [...pedidos];

    // Filtrar por estado
    if (filtros.estado) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.id_estadoPedido.toString() === filtros.estado,
      );
    }

    // Filtrar por proveedor
    if (filtros.proveedor) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreProveedor
          .toLowerCase()
          .includes(filtros.proveedor.toLowerCase()),
      );
    }

    // Filtrar por usuario
    if (filtros.usuario) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreUsuario
          .toLowerCase()
          .includes(filtros.usuario.toLowerCase()),
      );
    }

    // Filtrar por origen
    if (filtros.origen) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.origen === filtros.origen,
      );
    }

    // Filtrar por fechas
    if (filtros.fechaInicio) {
      pedidosTemp = pedidosTemp.filter((pedido) => {
        const fechaPedido = parsearFecha(pedido.fechaEmision);
        const fechaFiltro = parsearFecha(filtros.fechaInicio);
        return fechaPedido && fechaFiltro && fechaPedido >= fechaFiltro;
      });
    }

    if (filtros.fechaFin) {
      pedidosTemp = pedidosTemp.filter((pedido) => {
        const fechaPedido = parsearFecha(pedido.fechaEmision);
        const fechaFiltro = parsearFecha(filtros.fechaFin);
        return fechaPedido && fechaFiltro && fechaPedido <= fechaFiltro;
      });
    }

    setPedidosFiltrados(pedidosTemp);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosData, estadosData] = await Promise.all([
        pedidoService.getAll(),
        estadoPedidoService.getAll(),
      ]);

      setPedidos(pedidosData);
      setEstadosPedido(estadosData);

      // Extraer proveedores y usuarios únicos para los filtros
      const proveedores = [
        ...new Set(pedidosData.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(pedidosData.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      //console.error("Error al cargar datos:", error);
      showError("Error", "Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const cargarPedidos = async () => {
    try {
      const data = await pedidoService.getAll();
      setPedidos(data);

      // Actualizar listas únicas - filtrar valores vacíos/nulos
      const proveedores = [
        ...new Set(data.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(data.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      //console.error("Error al cargar pedidos:", error);
      showError("Error", "Error al cargar pedidos: " + error.message);
    }
  };

  const cargarInsumosBajoStock = async () => {
    try {
      const data = await insumoService.getBajoStock();
      setInsumosBajoStock(data);
    } catch (error) {
      //console.error("Error al cargar insumos bajo stock:", error);
      showError(
        "Error",
        "Error al cargar insumos bajo stock: " + error.message,
      );
    }
  };
  const aprobarPedido = async (id) => {
    // 1. Confirmación asíncrona con advertencia de acción externa
    const confirmed = await showConfirm(
      "Aprobar Pedido",
      "¿Está seguro de que desea aprobar este pedido?. Se enviará automáticamente un email al proveedor con un enlace para confirmar la disponibilidad de los insumos.",
      "Sí, aprobar y enviar",
      "Cancelar",
    );

    if (!confirmed) return;

    try {
      // Debug: obtener información del pedido antes de aprobar
      const pedidoActual = pedidos.find((p) => p.id_pedido === id);
      console.log("📋 Información del pedido a aprobar:", {
        id_pedido: id,
        estadoPedido: pedidoActual?.estadoPedido,
        id_estadoPedido: pedidoActual?.id_estadoPedido,
        nombreProveedor: pedidoActual?.nombreProveedor,
      });

      // 2. Procesar aprobación en backend
      const response = await pedidoService.aprobar(id);

      // 3. Gestión de comunicación con proveedores
      await enviarEnlacesConfirmacion(id, response.pedido);

      // 4. Feedback de éxito detallado
      showSuccess(
        "Pedido Aprobado",
        "El pedido ha sido procesado correctamente y los enlaces de confirmación han sido enviados a los proveedores involucrados.",
      );

      // 5. Refrescar la lista de pedidos
      await cargarPedidos();
    } catch (error) {
      // 5. Manejo de errores profesional con información detallada
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Error al procesar la aprobación del pedido.";

      // Si hay información del estado actual, incluirla en el error
      if (error.response?.data?.estadoActual) {
        showError(
          "Error de Aprobación",
          `${msg}\n\nEstado actual del pedido: ${error.response.data.estadoActual}\nID de Estado: ${error.response.data.id_estadoPedido}`,
        );
      } else {
        showError("Error de Aprobación", msg);
      }

      console.error("❌ Detalles del error:", error.response?.data);
    }
  };

  const enviarEnlacesConfirmacion = async (idPedido, pedidoData) => {
    try {
      // Obtener detalles del pedido para identificar proveedores
      const detalles = await pedidoService.getDetalles(idPedido);

      // Agrupar por proveedor
      const proveedoresUnicos = [
        ...new Set(detalles.map((d) => d.id_proveedor)),
      ];

      console.log(
        `📧 Enviando enlaces de confirmación a ${proveedoresUnicos.length} proveedor(es)...`,
      );

      // Generar y enviar un enlace para cada proveedor
      const promesasEnvio = proveedoresUnicos.map(async (idProveedor) => {
        try {
          // 1. Generar token de confirmación
          const tokenResponse = await API.post(
            "/pedidos/generar-token-proveedor",
            {
              idPedido,
              idProveedor,
            },
          );
          const enlaceConfirmacion = tokenResponse.data.link;
          console.log(
            `🔗 Enlace generado para proveedor ${idProveedor}: ${enlaceConfirmacion}`,
          );

          // 2. Enviar email automáticamente al proveedor
          let emailEnviado = false;
          let emailError = null;
          try {
            const emailResponse = await API.post(
              "/pedidos/enviar-email-confirmacion",
              {
                idPedido,
                idProveedor,
                enlaceConfirmacion,
                datosAdicionales: {
                  nombreCocinera: user
                    ? `${user.nombre} ${user.apellido}`
                    : "Sistema",
                  fechaPedido:
                    pedidoData?.fechaEmision || new Date().toISOString(),
                },
              },
            );

            console.log(
              `✅ Email enviado exitosamente al proveedor ${idProveedor}`,
            );
            emailEnviado = true;
          } catch (err) {
            console.warn(
              `⚠️ Error al enviar email al proveedor ${idProveedor}:`,
              err,
            );
            emailError = err.message;
          }

          // 3. Enviar notificación por Telegram al proveedor (nuevo)
          let telegramEnviado = false;
          let telegramError = null;
          try {
            const telegramResponse = await API.post(
              "/pedidos/enviar-telegram-proveedor",
              {
                idPedido,
                idProveedor,
                enlaceConfirmacion,
              },
            );

            if (telegramResponse.data.telegramEnviado) {
              console.log(
                `✅ Mensaje Telegram enviado exitosamente al proveedor ${idProveedor}`,
              );
              telegramEnviado = true;
            } else {
              console.warn(
                `⚠️ Telegram no disponible para proveedor ${idProveedor}:`,
                telegramResponse.data.motivo,
              );
            }
          } catch (err) {
            console.warn(
              `⚠️ Error al enviar mensaje por Telegram al proveedor ${idProveedor}:`,
              err,
            );
            telegramError = err.message;
          }

          return {
            ...tokenResponse.data,
            emailEnviado,
            emailError,
            telegramEnviado,
            telegramError,
          };
        } catch (error) {
          console.warn(
            `⚠️ Error al generar enlace para proveedor ${idProveedor}:`,
            error,
          );
          return null;
        }
      });

      const resultados = await Promise.all(promesasEnvio);
      const exitosos = resultados.filter((r) => r !== null);
      const emailsEnviados = exitosos.filter((r) => r.emailEnviado);
      const emailsFallidos = exitosos.filter((r) => !r.emailEnviado);
      const telegramEnviados = exitosos.filter((r) => r.telegramEnviado);
      const telegramFallidos = exitosos.filter((r) => !r.telegramEnviado);

      // Mostrar resultado detallado
      if (exitosos.length > 0) {
        let mensaje = `Se generaron ${exitosos.length} enlaces de confirmación.`;

        if (emailsEnviados.length > 0) {
          mensaje += `\n📧 ${emailsEnviados.length} email(s) enviado(s) exitosamente.`;
        }

        if (emailsFallidos.length > 0) {
          mensaje += `\n⚠️ ${emailsFallidos.length} email(s) no pudieron ser enviados (pero los enlaces fueron generados).`;
        }

        if (telegramEnviados.length > 0) {
          mensaje += `\n📱 ${telegramEnviados.length} mensaje(s) de Telegram enviado(s) exitosamente.`;
        }

        if (telegramFallidos.length > 0) {
          mensaje += `\n⚠️ ${telegramFallidos.length} proveedor(es) sin notificaciones de Telegram configuradas.`;
        }

        // Mostrar enlaces manualmente para los que fallaron
        if (emailsFallidos.length > 0 || telegramFallidos.length > 0) {
          emailsFallidos.forEach((resultado) => {
            console.log(`🔗 Enlace manual para proveedor: ${resultado.link}`);
          });
          telegramFallidos.forEach((resultado) => {
            console.log(
              `🔗 Enlace manual para proveedor sin Telegram: ${resultado.link}`,
            );
          });
        }

        if (
          emailsEnviados.length === exitosos.length &&
          telegramEnviados.length === exitosos.length
        ) {
          showSuccess(
            "✅ Enlaces Enviados",
            mensaje +
              "\n\nTodos los proveedores fueron notificados por email y Telegram.",
          );
        } else if (emailsEnviados.length > 0 || telegramEnviados.length > 0) {
          showInfo("⚠️ Envío Parcial", mensaje);
        } else {
          showWarning(
            "⚠️ Enlaces Generados",
            mensaje +
              "\n\nVerifique la configuración de email y Telegram del sistema.",
          );
        }
      }
    } catch (error) {
      console.error("❌ Error al procesar enlaces de confirmación:", error);
      showError(
        "Error de Comunicación",
        "El pedido fue aprobado correctamente, pero hubo problemas al enviar los enlaces de confirmación a los proveedores. Contacte al administrador del sistema.",
      );
    }
  };

  const cancelarPedido = async (id) => {
    // 1. Solicitar el motivo de cancelación
    const motivo = await showCancelar(
      "Cancelar Pedido",
      "Escriba el motivo aquí...",
    );

    // 2. Si el usuario proporcionó un motivo
    if (motivo) {
      try {
        // 3. Llamada al servicio con el motivo
        await pedidoService.cancelar(id, motivo);

        showSuccess("Éxito", "El pedido ha sido cancelado correctamente.");

        // 4. Recarga de la lista
        await cargarPedidos();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "No se pudo cancelar el pedido.";
        showError("Error", errorMessage);
      }
    }
  };

  // Funciones para generación automática
  const abrirGeneracionAutomatica = () => {
    setMostrarAutomatico(true);
  };

  const cerrarGeneracionAutomatica = () => {
    setMostrarAutomatico(false);
  };

  const onGeneracionAutomaticaExitosa = (resultado) => {
    // console.log("✅ Generación automática exitosa:", resultado);

    // Mostrar mensaje de éxito
    showInfo(
      "Información",
      `¡Éxito! ${resultado.message}\n\nTotal pedidos creados: ${resultado.totalPedidosCreados}`,
    );

    // Recargar datos
    cargarPedidos();

    // No cerrar el modal inmediatamente para que el usuario vea los resultados
  };

  const onGeneracionAutomaticaError = (error) => {
    //console.error("❌ Error en generación automática:", error);
    showInfoError("Información", `Error: ${error}`);
  };

  const verDetallesPedido = async (pedido) => {
    try {
      setLoading(true);
      const pedidoCompleto = await pedidoService.getPedidoCompleto(
        pedido.id_pedido,
      );
      setMostrarDetallesPedido(pedidoCompleto);
    } catch (error) {
      //console.error("Error al cargar detalles del pedido:", error);
      showError("Error", "Error al cargar detalles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPedido = async (id) => {
    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Pedido",
      "¿Está seguro de que desea eliminar este pedido? Esta acción podría revertir movimientos de inventario pendientes.",
      "Sí, eliminar",
      "Cancelar",
    );

    if (!confirmed) return;

    try {
      // 2. Ejecución del servicio
      await pedidoService.delete(id);

      // 3. Notificación de éxito y actualización de la lista
      showSuccess("Éxito", "Pedido eliminado correctamente.");

      // Es recomendable usar await si cargarPedidos es asíncrono para asegurar orden
      await cargarPedidos();
    } catch (error) {
      // 4. Manejo de errores profesional
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error desconocido al eliminar el pedido.";

      // Usamos showError para fallos técnicos o showInfo si es una regla de negocio
      showError("Error al eliminar", errorMessage);
    }
  };

  const onSuccessForm = (pedidosCreados) => {
    cargarPedidos();
    setVistaActual("lista");
    setPedidoEditando(null);
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "bg-warning";
      case "Aprobado":
        return "bg-success";
      case "Enviado":
        return "bg-info";
      case "Recibido":
        return "bg-primary";
      case "Cancelado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const exportarPDFPedidos = async () => {
    //console.log("Botón PDF clickeado, pedidos:", pedidos); // Debug
    // Filtrar solo pedidos aprobados
    const pedidosAprobados = pedidos.filter(
      (p) => p.estadoPedido === "Aprobado",
    );

    if (pedidosAprobados.length === 0) {
      showInfo("No hay pedidos aprobados para exportar");
      return;
    }

    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text("Reporte de Pedidos Aprobados", 14, 22);

      // Información
      doc.setFontSize(11);
      const nombreUsuario = user
        ? `${user.nombre} ${user.apellido}`
        : "Sistema";
      doc.text(`Generado por: ${nombreUsuario}`, 14, 32);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        14,
        40,
      );
      doc.text(
        `Total de pedidos aprobados: ${pedidosAprobados.length}`,
        14,
        48,
      );

      // Preparar datos para tabla
      const tableData = pedidosAprobados.map((pedido) => [
        formatearFecha(pedido.fechaEmision),
        pedido.nombreProveedor,
        pedido.nombreUsuario,
        pedido.estadoPedido,
        formatearFecha(pedido.fechaAprobacion),
      ]);

      // Tabla
      autoTable(doc, {
        startY: 60,
        head: [
          [
            "Fecha Emisión",
            "Proveedor",
            "Usuario",
            "Estado",
            "Fecha Aprobación",
          ],
        ],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10,
        );
      }

      doc.save(`pedidos_aprobados_${new Date().getTime()}.pdf`);

      // Registrar la generación del PDF en auditoría
      await auditoriaService.registrarReportePDF({
        nombreReporte: "Reporte de Pedidos Aprobados",
        tipoReporte: "Pedidos",
        descripcion: "Reporte de pedidos aprobados para proveedores",
        detallesReporte: `Total de pedidos aprobados: ${pedidosAprobados.length}`,
      });

      showSuccess(
        "Éxito",
        "Reporte PDF de pedidos aprobados generado exitosamente",
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showError("Error", "Error al generar el reporte PDF");
    }
  };

  // Vista de creación/edición de pedido
  if (vistaActual === "crear") {
    return (
      <div>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">
              {pedidoEditando ? "Editar Pedido" : "Crear Nuevo Pedido"}
            </h1>
            <p>
              {pedidoEditando
                ? "Actualiza el pedido con los nuevos datos"
                : "Complete el formulario para crear un pedido manual"}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setVistaActual("lista");
                setPedidoEditando(null);
              }}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver a la Lista
            </button>
          </div>
        </div>

        <PedidoFormSimple
          onClose={() => {
            setVistaActual("lista");
            setPedidoEditando(null);
          }}
          onSuccess={onSuccessForm}
          pedidoEditando={pedidoEditando}
        />
      </div>
    );
  }

  return (
    <div className="content-page">
      {/* Encabezado */}
      <div className="page-header">
        <div className="header-left mx-3">
          <h1 className="page-title">Lista de Pedidos</h1>
        </div>
        <div className="header-actions">
          <div className="btn-group">
            <button
              className="btn btn-success"
              onClick={() => {
                setPedidoEditando(null);
                setVistaActual("crear");
              }}
            >
              <i className="fas fa-plus me-1"></i>
              Nuevo Pedido Manual
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {insumosBajoStock.length > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
            <div>
              <h5 className="alert-heading mb-1">
                ¡Atención! Insumos con Stock Bajo
              </h5>
              <p className="mb-1">
                Hay {insumosBajoStock.length} insumo(s) con stock crítico o
                agotado.
              </p>
              <small>
                <strong>Insumos afectados:</strong>{" "}
                {insumosBajoStock
                  .slice(0, 3)
                  .map((i) => i.nombreInsumo)
                  .join(", ")}
                {insumosBajoStock.length > 3 &&
                  ` y ${insumosBajoStock.length - 3} más...`}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header text-dark">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Estado:</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
              >
                <option value="">Todos</option>
                {estadosPedido.map((estado, index) => (
                  <option
                    key={estado.id_estadoPedido || `estado-${index}`}
                    value={estado.id_estadoPedido}
                  >
                    {estado.nombreEstado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Proveedor:</label>
              <select
                className="form-select"
                value={filtros.proveedor}
                onChange={(e) =>
                  setFiltros({ ...filtros, proveedor: e.target.value })
                }
              >
                <option value="">Todos</option>
                {proveedoresUnicos.map((proveedor, index) => (
                  <option key={`proveedor-${index}`} value={proveedor}>
                    {proveedor}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Usuario:</label>
              <select
                className="form-select"
                value={filtros.usuario}
                onChange={(e) =>
                  setFiltros({ ...filtros, usuario: e.target.value })
                }
              >
                <option value="">Todos</option>
                {usuariosUnicos.map((usuario, index) => (
                  <option key={`usuario-${index}`} value={usuario}>
                    {usuario}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Origen:</label>
              <select
                className="form-select"
                value={filtros.origen}
                onChange={(e) =>
                  setFiltros({ ...filtros, origen: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="Manual">Manual</option>
                <option value="Generado">Automático</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Desde:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Hasta:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="row align-items-center">
            <div className="col-auto mt-3">
              <button
                className="btn btn-danger"
                onClick={exportarPDFPedidos}
                disabled={
                  pedidos.filter((p) => p.estadoPedido === "Aprobado")
                    .length === 0
                }
                title="Exportar solo pedidos aprobados"
              >
                <i className="fas fa-file-pdf me-1"></i>
                Exportar PDF
              </button>
            </div>

            {hayFiltrosAplicados() && (
              <div className="col-auto mt-3">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setFiltros({
                      estado: "",
                      fechaInicio: "",
                      fechaFin: "",
                      proveedor: "",
                      usuario: "",
                      origen: "",
                    })
                  }
                >
                  <i className="fas fa-times me-1"></i>
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center text-dark">
            <h5 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Lista de Pedidos ({pedidosFiltrados.length})
            </h5>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={cargarPedidos}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              Actualizar
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando pedidos...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No se encontraron pedidos</h5>
              <p className="text-muted">
                {pedidos.length === 0
                  ? "No hay pedidos registrados. Cree el primer pedido haciendo clic en 'Nuevo Pedido Manual'"
                  : "No hay pedidos que coincidan con los filtros aplicados. Intente modificar los criterios de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha Emisión</th>
                    <th>Proveedor</th>
                    <th>Usuario</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Fecha Aprobación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido, index) => (
                    <tr key={pedido.id_pedido || `pedido-${index}`}>
                      <td>
                        <strong>{index + 1}</strong>
                      </td>
                      <td>{formatearFecha(pedido.fechaEmision)}</td>
                      <td>
                        <strong>{pedido.nombreProveedor}</strong>
                      </td>
                      <td>{pedido.nombreUsuario}</td>
                      <td>
                        <span
                          className={`badge ${
                            pedido.origen === "Manual"
                              ? "bg-primary"
                              : "bg-success"
                          }`}
                          title={
                            pedido.origen === "Generado"
                              ? "Pedido generado automáticamente por el sistema"
                              : "Pedido creado manualmente"
                          }
                        >
                          {pedido.origen === "Generado"
                            ? "🤖 Automático"
                            : "👤 Manual"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getEstadoBadgeClass(
                            pedido.estadoPedido,
                          )}`}
                        >
                          {pedido.estadoPedido}
                        </span>
                      </td>
                      <td>
                        {pedido.fechaAprobacion ? (
                          <div className="d-flex flex-column">
                            <span className="text-success">
                              {calcularFechaEntrega(
                                pedido.fechaAprobacion,
                              ).toLocaleDateString("es-ES")}
                            </span>
                            <small className="text-muted">
                              (Aprobado:{" "}
                              {formatearFecha(pedido.fechaAprobacion)})
                            </small>
                          </div>
                        ) : pedido.estadoPedido === "Pendiente" ? (
                          <span className="text-warning">
                            <i className="fas fa-clock me-1"></i>
                            Pendiente de aprobación
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <div className="btn-group-sm">
                          <button
                            className="btn btn-outline-info btn-sm me-1"
                            onClick={() => verDetallesPedido(pedido)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {pedido.estadoPedido === "Pendiente" && (
                            <>
                              <button
                                className="btn btn-outline-success btn-sm me-1"
                                onClick={() => aprobarPedido(pedido.id_pedido)}
                                title="Aprobar pedido"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-outline-warning btn-sm me-1"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const pedidoCompleto =
                                      await pedidoService.getPedidoCompleto(
                                        pedido.id_pedido,
                                      );
                                    setPedidoEditando(pedidoCompleto);
                                    setVistaActual("crear");
                                  } catch (error) {
                                    showError(
                                      "Error",
                                      "Error al cargar el pedido: " +
                                        error.message,
                                    );
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                title="Editar pedido"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </>
                          )}

                          {pedido.estadoPedido !== "Cancelado" && (
                            <button
                              className="btn btn-outline-danger btn-sm me-1"
                              onClick={() => cancelarPedido(pedido.id_pedido)}
                              title="Cancelar pedido"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarPedido(pedido.id_pedido)}
                            title="Eliminar pedido"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {mostrarDetallesPedido &&
        createPortal(
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "0",
                maxWidth: "900px",
                width: "90%",
                maxHeight: "80vh",
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-info-circle me-2"></i>
                  Detalles del Pedido
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarDetallesPedido(null)}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ maxHeight: "60vh", overflowY: "auto" }}
              >
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Proveedor:</strong>{" "}
                    {mostrarDetallesPedido.nombreProveedor}
                  </div>
                  <div className="col-md-6">
                    <strong>Fecha de Emisión:</strong>{" "}
                    {formatearFecha(mostrarDetallesPedido.fechaEmision)}
                  </div>
                  <div className="col-md-6">
                    <strong>Usuario:</strong>{" "}
                    {mostrarDetallesPedido.nombreUsuario}
                  </div>
                  <div className="col-md-6">
                    <strong>Estado:</strong>
                    <span
                      className={`badge ms-2 ${getEstadoBadgeClass(
                        mostrarDetallesPedido.estadoPedido,
                      )}`}
                    >
                      {mostrarDetallesPedido.estadoPedido}
                    </span>
                  </div>
                </div>

                {mostrarDetallesPedido.observaciones && (
                  <div className="mb-3">
                    <strong>Observaciones:</strong>
                    <p className="mt-1">
                      {mostrarDetallesPedido.observaciones}
                    </p>
                  </div>
                )}

                <h6>
                  <i className="fas fa-list me-2"></i>Insumos del Pedido
                </h6>
                {mostrarDetallesPedido.detalles &&
                mostrarDetallesPedido.detalles.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Insumo</th>
                          <th>Unidad</th>
                          <th>Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mostrarDetallesPedido.detalles.map(
                          (detalle, index) => (
                            <tr
                              key={
                                detalle.id_detallePedido || `detalle-${index}`
                              }
                            >
                              <td>{detalle.nombreInsumo}</td>
                              <td>{detalle.unidadMedida}</td>
                              <td>
                                {(() => {
                                  const cantidad = Number(
                                    detalle.cantidad ||
                                      detalle.cantidadSolicitada,
                                  );
                                  const unidad = detalle.unidadMedida || "";

                                  // Si es en Gramos o Mililitros Y la cantidad es mayor a 1000,
                                  // entonces está en unidades menores (dividir por 1000)
                                  if (
                                    (unidad.includes("Gramo") ||
                                      unidad.includes("Mililitro")) &&
                                    cantidad > 1000
                                  ) {
                                    const cantidadConvertida = cantidad / 1000;
                                    // Remover decimales innecesarios
                                    return (
                                      Math.round(cantidadConvertida * 100) / 100
                                    );
                                  }

                                  return Math.round(cantidad * 100) / 100;
                                })()}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">
                    No hay detalles disponibles para este pedido.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarDetallesPedido(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Generación Automática */}
      <PedidoAutomaticoForm
        isVisible={mostrarAutomatico}
        onClose={cerrarGeneracionAutomatica}
        onSuccess={onGeneracionAutomaticaExitosa}
        onError={onGeneracionAutomaticaError}
      />
    </div>
  );
};

export default PedidoInsumo;
