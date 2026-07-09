import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import planificacionMenuService from "../../services/planificacionMenuService";
import { showError } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import CalendarioStyle from "../../styles/Calendario.module.css";

const servicios = [
  { id_servicio: 1, nombre: "Desayuno", descripcion: "Comida matutina" },
  {
    id_servicio: 2,
    nombre: "Almuerzo",
    descripcion: "Comida principal del día",
  },
  { id_servicio: 3, nombre: "Merienda", descripcion: "Comida vespertina" },
];

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const formatearFecha = (date) => {
  const normalized = new Date(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatearFechaCorta = (date) =>
  date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });

const obtenerSemanaVisible = (baseDate) => {
  const start = new Date(baseDate);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(12, 0, 0, 0);

  return Array.from({ length: 5 }, (_, index) => {
    const fecha = new Date(start);
    fecha.setDate(start.getDate() + index);
    return fecha;
  });
};

const Calendario = () => {
  const [loading, setLoading] = useState(true);
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [menusAsignados, setMenusAsignados] = useState({});
  const [planificacionActiva, setPlanificacionActiva] = useState(null);

  useEffect(() => {
    const cargarSemana = async () => {
      setLoading(true);
      try {
        const semana = obtenerSemanaVisible(semanaActual);
        const fechaInicio = formatearFecha(semana[0]);
        const fechaFin = formatearFecha(semana[4]);

        const [planificaciones, menusResponse] = await Promise.all([
          planificacionMenuService.getAll(),
          planificacionMenuService.getMenusSemana(fechaInicio, fechaFin),
        ]);

        const plan = (planificaciones || []).find((item) => {
          const inicio = formatearFecha(new Date(item.fechaInicio));
          const fin = formatearFecha(new Date(item.fechaFin));
          return inicio <= fechaFin && fin >= fechaInicio;
        });

        setPlanificacionActiva(plan || null);

        const menusMap = {};
        (menusResponse || []).forEach((menu) => {
          if (menu?.fecha && menu?.id_servicio && menu?.id_receta) {
            menusMap[`${menu.fecha}_${menu.id_servicio}`] = menu;
          }
        });

        setMenusAsignados(menusMap);
      } catch {
        showError("Error al cargar el calendario");
        setPlanificacionActiva(null);
        setMenusAsignados({});
      } finally {
        setLoading(false);
      }
    };

    cargarSemana();
  }, [semanaActual]);

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(semanaActual.getDate() + direccion * 7);
    setSemanaActual(nuevaSemana);
  };

  const semanaVisible = obtenerSemanaVisible(semanaActual);
  const rangoSemana = `${formatearFechaCorta(semanaVisible[0])} - ${formatearFechaCorta(semanaVisible[4])}`;

  const descargarPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margen = 14;
    const colWidth = (pageWidth - margen * 2 - 28) / 5;
    const firstColX = margen + 28;

    let y = 16;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Calendario semanal de menús", margen, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Semana: ${rangoSemana}`, margen, y);
    if (planificacionActiva?.estado) {
      doc.text(`Planificación: ${planificacionActiva.estado}`, margen + 70, y);
    }

    y += 8;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    const headerHeight = 16;
    doc.rect(margen, y, 28, headerHeight);
    doc.text("Servicio", margen + 3, y + 10);

    semanaVisible.forEach((fecha, index) => {
      const x = firstColX + index * colWidth;
      doc.rect(x, y, colWidth, headerHeight);
      const centerX = x + colWidth / 2;
      doc.text(`${diasSemana[index]}`, centerX, y + 6, { align: "center" });
      doc.text(`${formatearFechaCorta(fecha)}`, centerX, y + 12, {
        align: "center",
      });
    });

    y += headerHeight;

    servicios.forEach((servicio, serviceIndex) => {
      const rowHeight = 20;
      const rowY = y + serviceIndex * rowHeight;
      doc.rect(margen, rowY, 28, rowHeight);
      doc.text(servicio.nombre, margen + 3, rowY + 10);

      semanaVisible.forEach((fecha, index) => {
        const x = firstColX + index * colWidth;
        const clave = `${formatearFecha(fecha)}_${servicio.id_servicio}`;
        const menu = menusAsignados[clave];
        const texto = menu?.nombreReceta.toUpperCase() || "SIN RECETA";

        const lines = doc.splitTextToSize(texto, colWidth - 4);

        doc.rect(x, rowY, colWidth, rowHeight);

        const totalLines = lines.length;
        const fontSizeInMm = doc.internal.getFontSize() * 0.352778; // Convierte puntos a mm (~3.5mm para tamaño 10)
        const lineHeightMultiplier = 1.2; // Multiplicador de línea por defecto de jsPDF
        const textHeight = totalLines * fontSizeInMm * lineHeightMultiplier;

        const centerX = x + colWidth / 2;
        const centerY = rowY + (rowHeight - textHeight) / 2 + fontSizeInMm;

        doc.text(lines, centerX, centerY, { align: "center" });
      });
    });

    doc.save(`calendario-menus-${formatearFecha(semanaVisible[0])}.pdf`);
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando calendario de menús...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-calendar"></i>
            Calendario semanal
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Vista únicamente informativa del menú asignado por semana.
          </p>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={descargarPdf}
          >
            <i className="fas fa-file-pdf me-1"></i>
            Descargar en PDF
          </button>
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        <div className={CalendarioStyle.week}>
          <div className={CalendarioStyle.navigationWeek}>
            <button
              className="btn btn-outline-primary-sm btn-sm me-2"
              onClick={() => cambiarSemana(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className={CalendarioStyle.weekSummary}>
              <strong>Semana del {rangoSemana}</strong>
              <div className="small text-muted mt-1">
                {planificacionActiva
                  ? `Planificación ${planificacionActiva.estado}`
                  : "Sin planificación asociada"}
              </div>
            </div>
            <button
              className="btn btn-outline-primary-sm btn-sm ms-2"
              onClick={() => cambiarSemana(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className={CalendarioStyle.tableResponsive}>
            <table
              className={`${CalendarioStyle.tableMenuCalendar} table table-bordered`}
            >
              <thead>
                <tr>
                  <th className="font-italic">
                    <h4>Servicio</h4>
                  </th>
                  {semanaVisible.map((fecha, index) => (
                    <th
                      key={formatearFecha(fecha)}
                      width="17%"
                      className="text-center"
                    >
                      <div className={CalendarioStyle.nombreDia}>
                        {diasSemana[index]}
                      </div>
                      <div className={CalendarioStyle.fechaDia}>
                        {formatearFechaCorta(fecha)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id_servicio}>
                    <td className={CalendarioStyle.cellServicio}>
                      <div className={CalendarioStyle.infoServicio}>
                        <strong>{servicio.nombre}</strong>
                        <small className="text-muted d-block">
                          {servicio.descripcion}
                        </small>
                      </div>
                    </td>
                    {semanaVisible.map((fecha) => {
                      const claveMenu = `${formatearFecha(fecha)}_${servicio.id_servicio}`;
                      const menuAsignado = menusAsignados[claveMenu];

                      return (
                        <td
                          key={claveMenu}
                          className={CalendarioStyle.cellMenu}
                        >
                          <div className={CalendarioStyle.slotMenu}>
                            {menuAsignado ? (
                              <div className={CalendarioStyle.menuPlanificado}>
                                <div
                                  className={`${CalendarioStyle.nombreReceta}`}
                                >
                                  {menuAsignado.nombreReceta.toUpperCase()}
                                </div>
                              </div>
                            ) : (
                              <div className={CalendarioStyle.pendingPill}>
                                <strong>
                                  <em>Sin Receta</em>
                                </strong>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;
