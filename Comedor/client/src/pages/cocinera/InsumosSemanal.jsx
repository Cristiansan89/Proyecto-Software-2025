import { useState, useEffect } from "react";
import planificacionMenuService from "../../services/planificacionMenuService";
import generacionAutomaticaService from "../../services/generacionAutomaticaService";
import "../../styles/InsumosSemanal.css";

const InsumosSemanal = () => {
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [menusSemanales, setMenusSemanales] = useState([]);
  const [insumosRequeridos, setInsumosRequeridos] = useState({});
  const [loading, setLoading] = useState(false);
  const [comensalesData, setComensalesData] = useState({});

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  // Conversiones estándar de unidades
  const CONVERSIONES = {
    Gramo: { Kilogramo: 1000, Kilogramos: 1000, Gramo: 1, Gramos: 1 },
    Kilogramo: { Gramo: 0.001, Gramos: 0.001, Kilogramo: 1, Kilogramos: 1 },
    Mililitro: {
      Litro: 1000,
      Litros: 1000,
      Mililitro: 1,
      Mililitros: 1,
    },
    Litro: {
      Mililitro: 0.001,
      Mililitros: 0.001,
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

  const cargarDatosSemanales = async () => {
    setLoading(true);
    try {
      const semana = obtenerSemanaActual();
      const fechaInicio = semana[0].toISOString().split("T")[0];
      const fechaFin = semana[4].toISOString().split("T")[0];

      console.log(
        `📋 Cargando datos para la semana ${fechaInicio} a ${fechaFin}`
      );

      // 1. Obtener menús asignados
      const response = await planificacionMenuService.getMenusSemana(
        fechaInicio,
        fechaFin
      );

      // 2. Obtener datos de comensales por fecha
      const comensalesMap = {};
      for (const fecha of semana) {
        const fechaStr = fecha.toISOString().split("T")[0];
        try {
          const datosComensales =
            await planificacionMenuService.calcularComensalesPorFecha(fechaStr);
          comensalesMap[fechaStr] = datosComensales;
        } catch (err) {
          console.warn(`Error al cargar comensales para ${fechaStr}:`, err);
          comensalesMap[fechaStr] = {
            servicios: [],
            resumen: { totalDia: 0 },
          };
        }
      }
      setComensalesData(comensalesMap);

      // 3. Procesar menús y calcular insumos
      console.log("📊 Menús obtenidos:", response);
      setMenusSemanales(response || []);

      // 4. Calcular insumos desde menús de la semana actual
      await calcularInsumosSemanales(response || [], comensalesMap);
    } catch (error) {
      console.error("❌ Error al cargar datos semanales:", error);
      setMenusSemanales([]);
      setInsumosRequeridos({});
    } finally {
      setLoading(false);
    }
  };

  const calcularInsumosSemanales = async (menus, comensalesMap) => {
    try {
      // Llamar al endpoint backend que calcula insumos correctamente
      console.log("📡 Obteniendo insumos desde backend...");
      const response =
        await generacionAutomaticaService.obtenerInsumosSemanales();

      if (!response || !response.insumos) {
        console.warn("⚠️ No se obtuvieron insumos del backend");
        setInsumosRequeridos({});
        return;
      }

      // Convertir array a map con nombre como clave
      const insumosMap = {};
      for (const insumo of response.insumos) {
        insumosMap[insumo.nombre] = {
          id_insumo: insumo.id_insumo,
          cantidad: insumo.cantidad,
          unidad: insumo.unidad,
        };
      }

      console.log("📦 Insumos calculados desde backend:", insumosMap);
      setInsumosRequeridos(insumosMap);
    } catch (error) {
      console.error("❌ Error al calcular insumos:", error);
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

  useEffect(() => {
    cargarDatosSemanales();
  }, [semanaActual]);

  const semana = obtenerSemanaActual();

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-light text-dark">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Lista de Insumos Semanal
            </h4>
          </div>
        </div>

        <div className="card-body">
          {/* Controles de navegación */}
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-primary btn-sm"
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
              className="btn btn-outline-primary btn-sm"
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

          {!loading && menusSemanales.length === 0 && (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No hay menús planificados para esta semana
            </div>
          )}

          {!loading &&
            Object.keys(insumosRequeridos).length > 0 &&
            menusSemanales.length > 0 && (
              <>
                {/* Resumen de insumos */}
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">
                    <i className="fas fa-boxes me-2"></i>
                    Insumos Requeridos para la Semana
                  </h5>

                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead className="table-light">
                        <tr>
                          <th width="30%">Insumo</th>
                          <th width="25%">Cantidad, Unidad</th>
                          <th width="25%">Cantidad Convertida, Unidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(insumosRequeridos).map(
                          ([nombreInsumo, datos]) => {
                            const mejorUnidad = obtenerMejorUnidad(
                              datos.cantidad,
                              datos.unidad
                            );

                            return (
                              <tr key={nombreInsumo}>
                                <td width="30%">
                                  <strong>{nombreInsumo}</strong>
                                </td>
                                <td width="25%">
                                  <span className="badge bg-primary">
                                    {datos.cantidad.toFixed(2)} {datos.unidad}
                                  </span>
                                </td>
                                <td width="25%">
                                  <span className="badge bg-success">
                                    {mejorUnidad.cantidad.toFixed(2)}{" "}
                                    {mejorUnidad.unidad}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-4 d-flex gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => window.print()}
                  >
                    <i className="fas fa-print me-1"></i>
                    Imprimir
                  </button>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => {
                      // Exportar a CSV
                      const csv = generarCSV();
                      descargarCSV(csv);
                    }}
                  >
                    <i className="fas fa-download me-1"></i>
                    Descargar CSV
                  </button>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );

  function generarCSV() {
    let csv = "LISTA DE INSUMOS SEMANAL\n\n";
    csv += `Semana: ${semana[0].toLocaleDateString(
      "es-ES"
    )} a ${semana[4].toLocaleDateString("es-ES")}\n\n`;

    csv += "Insumo,Cantidad,Unidad,Cantidad Convertida,Unidad Convertida\n";

    Object.entries(insumosRequeridos).forEach(([nombreInsumo, datos]) => {
      const mejorUnidad = obtenerMejorUnidad(datos.cantidad, datos.unidad);
      csv += `"${nombreInsumo}",${datos.cantidad.toFixed(2)},${
        datos.unidad
      },${mejorUnidad.cantidad.toFixed(2)},${mejorUnidad.unidad}\n`;
    });

    return csv;
  }

  function descargarCSV(csv) {
    const elemento = document.createElement("a");
    elemento.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    elemento.setAttribute(
      "download",
      `Insumos_Semanal_${semana[0].toISOString().split("T")[0]}.csv`
    );
    elemento.style.display = "none";
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  }
};

export default InsumosSemanal;
