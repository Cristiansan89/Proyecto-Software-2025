import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import planificacionMenuService from "../../services/planificacionMenuService";
import generacionAutomaticaService from "../../services/generacionAutomaticaService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

const InsumosSemanal = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [menusSemanales, setMenusSemanales] = useState([]);
  const [insumosRequeridos, setInsumosRequeridos] = useState({});
  const [loading, setLoading] = useState(false);
  const [estadoPlanificacion, setEstadoPlanificacion] = useState(null);
  const [comensalesData, setComensalesData] = useState({});
  const [generandoPedidos, setGenerandoPedidos] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [detallesCalculo, setDetallesCalculo] = useState({});

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  // Verificación de autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      //console.log("❌ Usuario no autenticado, redirigiendo al login");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Si no está autenticado, no renderizar el componente
  if (!isAuthenticated) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Conversiones estándar de unidades
  const CONVERSIONES = {
    Gramo: { Kilogramo: 0.001, Kilogramos: 0.001, Gramo: 1, Gramos: 1 },
    Kilogramo: { Gramo: 1000, Gramos: 1000, Kilogramo: 1, Kilogramos: 1 },
    Mililitro: {
      Litro: 0.001,
      Litros: 0.001,
      Mililitro: 1,
      Mililitros: 1,
    },
    Litro: {
      Mililitro: 1000,
      Mililitros: 1000,
      Litro: 1,
      Litros: 1,
    },
    Unidad: { Unidad: 1, Unidades: 1 },
    Taza: { Taza: 1 },
    Cucharadita: { Cucharadita: 1 },
    Cucharada: { Cucharada: 1 },
    Pizca: { Pizca: 1 },
  };

  const obtenerSemanaActual = () => {
    const inicio = new Date(semanaActual);
    const dia = inicio.getDay();
    const dif = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
    inicio.setDate(dif);

    const semana = [];
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      semana.push(fecha);
    }
    return semana;
  };

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(semanaActual.getDate() + direccion * 7);
    setSemanaActual(nuevaSemana);
  };

  const irAPlanificacionMenus = () => {
    // Navegar usando React Router
    navigate("/planificacion-menus");
  };

  const cargarDatosSemanales = async () => {
    setLoading(true);
    try {
      const semana = obtenerSemanaActual();
      const fechaInicio = semana[0].toISOString().split("T")[0];
      const fechaFin = semana[4].toISOString().split("T")[0];

      /*console.log(
        `📋 Cargando datos para la semana ${fechaInicio} a ${fechaFin}`
      );*/

      // 1. Obtener menús asignados
      const response = await planificacionMenuService.getMenusSemana(
        fechaInicio,
        fechaFin,
      );

      // Guardar el estado de la planificación y las fechas exactas del primer menú
      let fechaInicioReal = fechaInicio;
      let fechaFinReal = fechaFin;

      if (response && response.length > 0) {
        setEstadoPlanificacion(response[0]?.estado || null);
        // Usar las fechas exactas de la planificación para las solicitudes posteriores
        fechaInicioReal = response[0]?.fechaInicio || fechaInicio;
        fechaFinReal = response[0]?.fechaFin || fechaFin;
      }

      setMenusSemanales(response || []);

      // 2. Obtener datos de comensales por fecha
      const comensalesMap = {};
      for (const fecha of semana) {
        const fechaStr = fecha.toISOString().split("T")[0];
        try {
          const datosComensales =
            await planificacionMenuService.calcularComensalesPorFecha(fechaStr);
          comensalesMap[fechaStr] = datosComensales;
        } catch (err) {
          //console.warn(`Error al cargar comensales para ${fechaStr}:`, err);
          // Ignorar errores silenciosamente para no interrumpir el flujo
          comensalesMap[fechaStr] = {
            servicios: [],
            resumen: { totalDia: 0 },
          };
        }
      }
      setComensalesData(comensalesMap);

      // 3. Procesar menús y calcular insumos
      // Calcular insumos con las fechas exactas de la planificación
      await calcularInsumosSemanales(
        response || [],
        comensalesMap,
        fechaInicioReal,
        fechaFinReal,
      );
    } catch (error) {
      //console.error("❌ Error al cargar datos semanales:", error);
      setMensaje({
        tipo: "error",
        texto:
          "❌ Ocurrió un error al cargar los datos semanales. Por favor, intente nuevamente más tarde.",
      });
      setMenusSemanales([]);
      setInsumosRequeridos({});
    } finally {
      setLoading(false);
    }
  };

  const calcularInsumosSemanales = async (
    menus,
    comensalesMap,
    fechaInicio,
    fechaFin,
  ) => {
    try {
      const response =
        await generacionAutomaticaService.obtenerInsumosSemanales(
          fechaInicio,
          fechaFin,
        );

      // Guardar el estado de la planificación si viene en la respuesta
      if (response.estado) {
        setEstadoPlanificacion(response.estado);
      }

      // Si está en estado Programado, mostrar mensaje y no cargar insumos
      if (response.estado === "Programado") {
        setMensaje({
          tipo: "warning",
          texto:
            "⏳ La planificación de esta semana está en estado Programado. Los insumos se mostrarán cuando cambie a estado Activo.",
        });
        setInsumosRequeridos({});
        return;
      }

      if (!response || !response.insumos || response.insumos.length === 0) {
        setMensaje({
          tipo: "info",
          texto:
            "ℹ️ No hay una planificación activa para esta semana. Cree una en la sección 'Planificación de Menús'.",
        });
        setInsumosRequeridos({});
        return;
      }

      // Convertir array a map con nombre como clave
      const insumosMap = {};
      let insumosDesconocidosEncontrados = false;

      for (const insumo of response.insumos) {
        // Filtrar insumos desconocidos (sin nombre válido)
        if (insumo.nombre === "Insumo desconocido" || !insumo.nombre) {
          console.warn(
            "⚠️ Se detectó un insumo sin nombre válido (id_insumo: null)",
          );
          insumosDesconocidosEncontrados = true;
          continue; // Saltar este insumo
        }

        insumosMap[insumo.nombre] = {
          id_insumo: insumo.id_insumo,
          cantidad: insumo.cantidad,
          unidad: insumo.unidad,
          cantidad_disponible: insumo.cantidad_disponible || 0,
          unidad_inventario: insumo.unidad_inventario || insumo.unidad,
          stockMaximo: insumo.stockMaximo || 0,
          enPedido: insumo.enPedido || false,
        };
      }

      setInsumosRequeridos(insumosMap);

      // Guardar detalles de cálculo para descarga de auditoría
      if (response.detallesCalculo) {
        setDetallesCalculo(response.detallesCalculo);
      }
    } catch (error) {
      console.error("❌ Error en catch:", error);
      console.error("Error response data:", error.response?.data);

      setDetallesCalculo({});

      // Capturar estado si viene en la respuesta de error
      if (error.response?.data?.estado) {
        setEstadoPlanificacion(error.response.data.estado);
      }

      // Manejar error de autenticación
      if (error.response?.status === 401) {
        setMensaje({
          tipo: "error",
          texto: "Sesión expirada. Por favor, inicia sesión nuevamente.",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      // Otros errores
      if (error.response?.status === 400) {
        setMensaje({
          tipo: "warning",
          texto:
            error.response?.data?.mensaje ||
            "No hay planificación activa para esta semana. Por favor, cree una planificación primero en la sección 'Planificación de Menús'.",
        });
      } else {
        setMensaje({
          tipo: "error",
          texto: `Error al cargar insumos: ${
            error.message || "Error de conexión"
          }`,
        });
      }
      setInsumosRequeridos({});
    }
  };

  const convertirUnidad = (cantidad, unidadOrigen, unidadDestino) => {
    if (unidadOrigen === unidadDestino) return cantidad;

    const conversiones = CONVERSIONES[unidadOrigen];
    if (!conversiones || !conversiones[unidadDestino]) {
      return cantidad; // No se puede convertir
    }

    return cantidad * conversiones[unidadDestino];
  };

  // Formatea la cantidad visualmente: sin decimales para Kg/L/Unidades, con 3 decimales para g/mL
  const formatearCantidad = (cantidad, unidad) => {
    const sinDecimales = ["Kilogramos", "Litros", "Unidades"];
    if (sinDecimales.includes(unidad)) {
      return Number.isInteger(Number(cantidad))
        ? String(Math.round(cantidad))
        : parseFloat(Number(cantidad).toFixed(3))
            .toString()
            .replace(/\.?0+$/, "")
            .replace(".", ",");
    }
    return parseFloat(Number(cantidad).toFixed(3)).toString().replace(".", ",");
  };

  // Formatea un número con 3 decimales, coma decimal y punto de miles (ej: 14.000,520)
  const formatConComa = (numero) => {
    return Number(numero).toLocaleString("es-ES", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  const obtenerMejorUnidad = (cantidad, unidadOriginal) => {
    // Para gramos: si es >= 1000, convertir a kilogramos
    if (
      unidadOriginal === "Gramo" ||
      unidadOriginal === "Gramos" ||
      unidadOriginal === "gramo" ||
      unidadOriginal === "gramos"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Kilogramos",
        };
      }
      return { cantidad, unidad: "Gramos" };
    }

    // Para mililitros: si es >= 1000, convertir a litros
    if (
      unidadOriginal === "Mililitro" ||
      unidadOriginal === "Mililitros" ||
      unidadOriginal === "mililitro" ||
      unidadOriginal === "mililitros"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Litros",
        };
      }
      return { cantidad, unidad: "Mililitros" };
    }

    return { cantidad, unidad: unidadOriginal };
  };

  const convertirCantidadEntre = (cantidad, unidadOrigen, unidadDestino) => {
    if (unidadOrigen === unidadDestino) return cantidad;

    const CONVERSIONES = {
      Gramo: { Kilogramo: 0.001, Kilogramos: 0.001, Gramo: 1, Gramos: 1 },
      Gramos: { Kilogramo: 0.001, Kilogramos: 0.001, Gramo: 1, Gramos: 1 },
      Kilogramo: { Gramo: 1000, Gramos: 1000, Kilogramo: 1, Kilogramos: 1 },
      Kilogramos: { Gramo: 1000, Gramos: 1000, Kilogramo: 1, Kilogramos: 1 },
      Mililitro: { Litro: 0.001, Litros: 0.001, Mililitro: 1, Mililitros: 1 },
      Mililitros: { Litro: 0.001, Litros: 0.001, Mililitro: 1, Mililitros: 1 },
      Litro: { Mililitro: 1000, Mililitros: 1000, Litro: 1, Litros: 1 },
      Litros: { Mililitro: 1000, Mililitros: 1000, Litro: 1, Litros: 1 },
      Unidad: { Unidad: 1, Unidades: 1 },
      Unidades: { Unidad: 1, Unidades: 1 },
    };

    const conversiones = CONVERSIONES[unidadOrigen];
    if (!conversiones || !conversiones[unidadDestino]) {
      return cantidad; // No se puede convertir
    }

    return cantidad * conversiones[unidadDestino];
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    const semana = obtenerSemanaActual();

    // Configurar fuente y color
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41); // Color gris oscuro

    // Título
    doc.text("LISTA DE INSUMOS SEMANAL", 14, 15);

    // Información de la semana
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const fechaInicio = formatDate(semana[0]);
    const fechaFin = formatDate(semana[4]);
    doc.text(`Semana: ${fechaInicio} a ${fechaFin}`, 14, 25);
    doc.text(`Fecha de generación: ${formatDate(new Date())}`, 14, 32);

    // Preparar datos para la tabla
    const tableData = Object.entries(insumosRequeridos).map(
      ([nombreInsumo, datos]) => {
        const mejorUnidad = obtenerMejorUnidad(datos.cantidad, datos.unidad);
        const stockDisponible = datos.cantidad_disponible || 0;
        const diferencia = parseFloat(
          (stockDisponible - mejorUnidad.cantidad).toFixed(3),
        );

        return [
          nombreInsumo,
          `${datos.cantidad} ${datos.unidad}`,
          `${mejorUnidad.cantidad.toFixed(3)} ${mejorUnidad.unidad}`,
          `${stockDisponible} ${datos.unidad_inventario}`,
          `${diferencia.toFixed(3)} ${mejorUnidad.unidad}`,
        ];
      },
    );

    // Crear tabla
    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Insumo",
          "Cantidad Insumo",
          "Cantidad Convertida",
          "Stock Actual",
          "Stock Futuros",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [65, 105, 225], // Royal blue
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      bodyStyles: {
        textColor: [33, 37, 41],
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { halign: "left" },
      },
      margin: { top: 40, left: 14, right: 14 },
      didDrawPage: function (data) {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" },
        );
      },
    });

    // Descargar PDF
    const filename = `Insumos_Semanal_${fechaInicio.replace(/\//g, "-")}.pdf`;
    doc.save(filename);
  };

  const generarPedidosPorFaltantes = async () => {
    setGenerandoPedidos(true);
    try {
      const response =
        await generacionAutomaticaService.generarPedidosPorInsumosFaltantes();

      if (response.success) {
        setMensaje({
          tipo: "success",
          texto: `✅ SISTEMA: Se generaron ${response.totalPedidos} pedido(s) automático(s) por insumos faltantes`,
        });
      } else {
        setMensaje({
          tipo: "warning",
          texto: response.mensaje || "No se generaron pedidos",
        });
      }
    } catch (error) {
      //console.error("Error generando pedidos:", error);
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.message ||
          "Error al generar pedidos automáticos",
      });
    } finally {
      setGenerandoPedidos(false);
    }
  };

  useEffect(() => {
    // Limpiar estados cuando cambia la semana
    setMensaje(null);
    setEstadoPlanificacion(null);
    setMenusSemanales([]);
    setInsumosRequeridos({});
    cargarDatosSemanales();
  }, [semanaActual]);

  const semana = obtenerSemanaActual();

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Insumos Semanales...</p>
      </div>
    );
  }

  return (
    <div className={`${ContenidoStyle.card} shadow-sm`}>
      <div className={`${ContenidoStyle.cardHeader} bg-light text-dark`}>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Lista de Insumos Semanal
          </h4>
        </div>
      </div>

      <div className={ContenidoStyle.cardBody}>
        {/* Controles de navegación */}
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-primary btn-sm fw-bold"
            onClick={() => cambiarSemana(-1)}
          >
            <i className="fas fa-chevron-left"></i> Semana Anterior
          </button>

          <div className="text-center">
            <h5 className="mb-0">
              {semana[0].toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              a{" "}
              {semana[4].toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h5>
          </div>

          <button
            className="btn btn-outline-primary btn-sm fw-bold"
            onClick={() => cambiarSemana(1)}
          >
            Semana Siguiente <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {/* Para no planificado */}
        {!loading && menusSemanales.length === 0 && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning} d-flex align-items-center`}
            role="alert"
          >
            <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
            <div>
              <h6 className="alert-heading mb-2">
                No hay menús planificados para esta semana
              </h6>
              <p className="mb-2">
                Para generar insumos semanales, necesita crear una planificación
                de menús primero.
              </p>
            </div>
          </div>
        )}

        {/* Para Programado */}
        {!loading && estadoPlanificacion === "Programado" && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertSuccess} d-flex align-items-center`}
            role="alert"
          >
            <i className="fas fa-calendar-check me-3 fs-4"></i>
            <div>
              <h6 className="alert-heading mb-2">
                La planificación de menús ya está programada para esta semana
              </h6>
              <p className="mb-2">
                Se debería esperar a que se termine la planificación de la
                semana anterior. Y se Active esta.
              </p>
            </div>
          </div>
        )}

        {/* Para Finalizado */}
        {!loading && estadoPlanificacion === "Finalizado" && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDark} d-flex align-items-center`}
            role="alert"
          >
            <i className="fas fa-calendar-check me-3 fs-4"></i>
            <div>
              <h6 className="alert-heading mb-2">
                La planificación de menús de está semana ya fue finalizada.
              </h6>
              <p className="mb-2">Pase a la siguiente semana.</p>
            </div>
          </div>
        )}

        {/* Para activo */}

        {!loading &&
          estadoPlanificacion === "Activo" &&
          Object.keys(insumosRequeridos).length > 0 && (
            <>
              {/* Resumen de insumos */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2">
                  <i className="fas fa-boxes me-2"></i>
                  Insumos Requeridos para la Semana
                </h5>

                <div className={TablaStyle.tableContainer}>
                  <table
                    className={`${TablaStyle.tableData} table table-striped`}
                  >
                    <thead className={TablaStyle.tableHeaderFixed}>
                      <tr>
                        <th whidth="5%">#</th>
                        <th width="25%">Insumo</th>
                        <th width="25%">Cantidad Insumo</th>
                        <th width="25%">Stock Inicial</th>
                        <th width="20%">Stock Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(insumosRequeridos).map(
                        ([nombreInsumo, datos], index) => {
                          const mejorUnidad = obtenerMejorUnidad(
                            datos.cantidad,
                            datos.unidad,
                          );

                          // Convertir stock disponible a la mejorUnidad para comparación correcta
                          const stockDisponibleEnMejorUnidad =
                            convertirCantidadEntre(
                              datos.cantidad_disponible || 0,
                              datos.unidad_inventario,
                              mejorUnidad.unidad,
                            );

                          const cantidadNecesaria = mejorUnidad.cantidad;
                          const diferencia = parseFloat(
                            (
                              stockDisponibleEnMejorUnidad - cantidadNecesaria
                            ).toFixed(3),
                          );

                          const esFaltante = diferencia < 0;

                          // Clase para la fila: danger si es negativo
                          let classRow = "";
                          if (esFaltante) {
                            classRow = "table-danger"; // Rojo - negativo
                          }

                          return (
                            <tr key={nombreInsumo} className={classRow}>
                              <td className="text-center">
                                <strong>{index + 1}</strong>
                              </td>
                              <td width="30%">
                                <strong>{nombreInsumo}</strong>
                                {esFaltante && !datos.enPedido && (
                                  <div className="small text-danger">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Faltante
                                  </div>
                                )}
                                {datos.enPedido && (
                                  <div className="small text-info">
                                    <i className="fas fa-clock me-1"></i>
                                    En Pedido
                                  </div>
                                )}
                              </td>

                              <td width="25%">
                                <span
                                  className={`${ComponenteStyle.badge} bg-success text-white fw-fold`}
                                >
                                  {formatConComa(mejorUnidad.cantidad)}{" "}
                                  {mejorUnidad.unidad}
                                </span>
                              </td>
                              <td width="25%">
                                <span
                                  className={`${ComponenteStyle.badge} bg-info text-dark fw-bold`}
                                >
                                  {datos.cantidad_disponible
                                    ? formatConComa(datos.cantidad_disponible)
                                    : "0,000"}{" "}
                                  {datos.unidad_inventario}
                                </span>
                              </td>
                              <td width="20%">
                                <span
                                  className={`${ComponenteStyle.badge} ${esFaltante ? "bg-danger text-white fw-bold" : "bg-success text-white fw-bold"}`}
                                >
                                  {formatConComa(diferencia)}{" "}
                                  {mejorUnidad.unidad}
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de acción */}
              <div className={`${ComponenteStyle.formActions} mt-3`}>
                <button
                  className={`${ComponenteStyle.btn} ${ComponenteStyle.btnOutlinePrimary} fw-bold`}
                  onClick={generarPDF}
                >
                  <i className="fas fa-file-pdf me-1"></i>
                  Descargar PDF
                </button>
                <button
                  className={`${ComponenteStyle.btn} ${ComponenteStyle.btnOutlineSuccess} fw-bold`}
                  onClick={() => {
                    // Exportar a CSV
                    const csv = generarCSV();
                    descargarCSV(csv);
                  }}
                >
                  <i className="fas fa-download me-1"></i>
                  Descargar CSV
                </button>
                {Object.keys(detallesCalculo).length > 0 && (
                  <button
                    className="btn btn-outline-secondary fw-bold"
                    onClick={generarTXTCalculo}
                  >
                    <i className="fas fa-calculator me-1"></i>
                    Descargar Detalle de Cálculo (TXT)
                  </button>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );

  function generarTXTCalculo() {
    const semana = obtenerSemanaActual();
    const fechaInicio = formatDate(semana[0]);
    const fechaFin = formatDate(semana[4]);
    const ahora = formatDateTime(new Date());

    let txt = "=================================================\n";
    txt += "        DETALLE DE CÁLCULO DE INSUMOS SEMANAL\n";
    txt += "=================================================\n";
    txt += `Semana: ${fechaInicio} a ${fechaFin}\n`;
    txt += `Generado: ${ahora}\n`;
    txt += "=================================================\n\n";

    for (const [nombreInsumo, detalles] of Object.entries(detallesCalculo)) {
      const totalInsumo = detalles.reduce((sum, d) => sum + d.subtotal, 0);
      const unidadInsumo = detalles[0]?.unidad || "";

      txt += `INSUMO: ${nombreInsumo}\n`;
      txt += "-------------------------------------------------\n";

      for (const d of detalles) {
        txt += `  Día:      ${d.dia} (${d.fecha})\n`;
        txt += `  Servicio: ${d.servicio}\n`;
        txt += `  Receta:   ${d.receta}\n`;
        txt += `  Fuente comensales: ${d.fuenteComensales}\n`;
        txt += `  Cálculo: ${d.cantidadPorPorcion} ${d.unidad}/porción × ${d.comensalesUsados} personas = ${d.subtotal} ${d.unidad}\n`;
        txt += `  Acumulado: ${d.acumuladoTrasEsteItem} ${d.unidad}\n`;
        txt += "  . . . . . . . . . . . . . . . . . . . . . .\n";
      }

      txt += `  TOTAL SEMANA: ${totalInsumo.toFixed(3)} ${unidadInsumo}\n`;
      txt += "\n";
    }

    txt += "=================================================\n";
    txt += `Total de insumos distintos: ${Object.keys(detallesCalculo).length}\n`;
    txt += "=================================================\n";

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Detalle_Calculo_Insumos_${semana[0].toISOString().split("T")[0]}.txt`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function generarCSV() {
    let csv = "LISTA DE INSUMOS SEMANAL\n\n";
    csv += `Semana: ${formatDate(semana[0])} a ${formatDate(semana[4])}\n\n`;

    csv += "Insumo,Cantidad,Unidad,Cantidad Convertida,Unidad Convertida\n";

    Object.entries(insumosRequeridos).forEach(([nombreInsumo, datos]) => {
      const mejorUnidad = obtenerMejorUnidad(datos.cantidad, datos.unidad);
      csv += `"${nombreInsumo}",${parseFloat(datos.cantidad).toFixed(3)},${datos.unidad},${formatearCantidad(mejorUnidad.cantidad, mejorUnidad.unidad)},${mejorUnidad.unidad}\n`;
    });

    return csv;
  }

  function descargarCSV(csv) {
    const elemento = document.createElement("a");
    elemento.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    elemento.setAttribute(
      "download",
      `Insumos_Semanal_${semana[0].toISOString().split("T")[0]}.csv`,
    );
    elemento.style.display = "none";
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  }
};

export default InsumosSemanal;
