import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showError, showSuccess } from "../../utils/alertService";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import DocenteStyle from "../../styles/Docente.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const AsistenciaAlumno = () => {
  const navigate = useNavigate();
  const { idAlumno } = useParams(); // idAlumnoGrado
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alumno, setAlumno] = useState(null);
  const [asistenciasAlumno, setAsistenciasAlumno] = useState([]);
  const [filteredAsistencias, setFilteredAsistencias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [idAlumno]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar servicios
      const serviciosRes = await API.get("/servicios");
      const serviciosActivos =
        serviciosRes.data.filter((s) => s.estado === "Activo") || [];
      setServicios(serviciosActivos);

      // Cargar asistencias del alumno (usando /asistencias, no /consumos)
      try {
        const asistenciasRes = await API.get("/asistencias");
        let asistencias = [];
        if (Array.isArray(asistenciasRes.data)) {
          asistencias = asistenciasRes.data;
        } else if (
          asistenciasRes.data?.data &&
          Array.isArray(asistenciasRes.data.data)
        ) {
          asistencias = asistenciasRes.data.data;
        }

        // Filtrar solo las asistencias del alumno actual
        const asistenciasDelAlumno = asistencias.filter(
          (a) => a.id_alumnoGrado === parseInt(idAlumno),
        );

        // Filtrar solo las de estado 'Completado'
        const asistenciasCompletadas = asistenciasDelAlumno.filter(
          (a) => (a.estado || "").toLowerCase() === "completado",
        );

        setAsistenciasAlumno(asistenciasCompletadas);
        setFilteredAsistencias(asistenciasCompletadas);

        // Obtener datos del alumno del primer registro
        if (asistenciasCompletadas.length > 0) {
          setAlumno({
            id: idAlumno,
            nombre: asistenciasCompletadas[0].nombre || "Alumno",
            apellido: asistenciasCompletadas[0].apellido || "",
            dni: asistenciasCompletadas[0].dni || "N/A",
            grado: asistenciasCompletadas[0].nombreGrado || "N/A",
          });
        } else {
          setAlumno({
            id: idAlumno,
            nombre: "Alumno",
            apellido: "",
            dni: "N/A",
            grado: "N/A",
          });
        }
      } catch (error) {
        console.error("Error al cargar asistencias:", error);
        setAsistenciasAlumno([]);
        setFilteredAsistencias([]);
      }
    } catch (error) {
      showError("Error", "Error al cargar los datos del alumno.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFechaInicio("");
    setFechaFin("");
    setServicioSeleccionado("");
  };

  // Filtrar asistencias
  useEffect(() => {
    let filtered = asistenciasAlumno;

    // Filtrar por fecha inicio
    if (fechaInicio) {
      filtered = filtered.filter((a) => {
        const fecha = new Date(a.fecha);
        const inicio = new Date(fechaInicio);
        return fecha >= inicio;
      });
    }

    // Filtrar por fecha fin
    if (fechaFin) {
      filtered = filtered.filter((a) => {
        const fecha = new Date(a.fecha);
        const fin = new Date(fechaFin);
        return fecha <= fin;
      });
    }

    // Filtrar por servicio
    if (servicioSeleccionado) {
      filtered = filtered.filter((a) => {
        return a.id_servicio === parseInt(servicioSeleccionado);
      });
    }

    setFilteredAsistencias(filtered);
  }, [fechaInicio, fechaFin, servicioSeleccionado, asistenciasAlumno]);

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const stats = {
      totalAsistencias: 0,
      totalInasistencias: 0,
      desayuno: 0,
      almuerzo: 0,
      merienda: 0,
      siAsistenciaDesayuno: 0,
      noAsistenciaDesayuno: 0,
      siAsistenciaAlmuerzo: 0,
      noAsistenciaAlmuerzo: 0,
      siAsistenciaMerienda: 0,
      noAsistenciaMerienda: 0,
    };

    filteredAsistencias.forEach((a) => {
      const tipo = (a.tipoAsistencia || "").toUpperCase();
      const servicio = a.id_servicio;

      // Contar asistencias (SI o NO)
      if (tipo === "SI" || tipo === "NO") {
        stats.totalAsistencias++;
      }
      // Contar inasistencias (AUSENTE)
      else if (tipo === "AUSENTE") {
        stats.totalInasistencias++;
      }

      // Contar por servicio
      if (servicio === 1) {
        stats.desayuno++;
      } else if (servicio === 2) {
        stats.almuerzo++;
      } else if (servicio === 3) {
        stats.merienda++;
      }

      // Contar SI y NO por servicio
      if (servicio === 1 && tipo === "SI") {
        stats.siAsistenciaDesayuno++;
      } else if (servicio === 1 && tipo === "NO") {
        stats.noAsistenciaDesayuno++;
      } else if (servicio === 2 && tipo === "SI") {
        stats.siAsistenciaAlmuerzo++;
      } else if (servicio === 2 && tipo === "NO") {
        stats.noAsistenciaAlmuerzo++;
      } else if (servicio === 3 && tipo === "SI") {
        stats.siAsistenciaMerienda++;
      } else if (servicio === 3 && tipo === "NO") {
        stats.noAsistenciaMerienda++;
      }
    });

    return stats;
  };

  // Obtener servicios únicos presentes en las asistencias filtradas
  const obtenerServiciosPresentesEnFiltradas = () => {
    const serviciosUnicos = new Set(
      filteredAsistencias.map((a) => a.id_servicio),
    );
    return Array.from(serviciosUnicos).sort();
  };

  // Obtener nombre de servicio
  const obtenerNombreServicio = (idServicio, nombreServicio) => {
    if (nombreServicio) return nombreServicio;
    const servicio = servicios.find((s) => s.id_servicio === idServicio);
    return servicio ? servicio.nombre : "Servicio no encontrado";
  };

  // Descargar PDF
  const descargarPDF = () => {
    try {
      const doc = new jsPDF();
      const stats = calcularEstadisticas();

      // Encabezado
      doc.setFontSize(16);
      doc.text("Reporte de Asistencias", 14, 15);

      // Información del alumno
      doc.setFontSize(12);
      doc.text(`Alumno: ${alumno?.apellido}, ${alumno?.nombre}`, 14, 25);
      doc.text(`DNI: ${alumno?.dni}`, 14, 32);
      doc.text(`Grado: ${alumno?.grado}`, 14, 39);
      doc.text(
        `Período: ${fechaInicio || "Inicio"} a ${fechaFin || "Fin"}`,
        14,
        46,
      );

      // Estadísticas
      doc.setFontSize(11);
      doc.text("Estadísticas:", 14, 57);
      doc.text(`Total de asistencias: ${stats.totalAsistencias}`, 20, 64);
      doc.text(`Total de inasistencias: ${stats.totalInasistencias}`, 20, 71);
      doc.text(`Desayunos: ${stats.desayuno}`, 20, 78);
      doc.text(`Almuerzos: ${stats.almuerzo}`, 20, 85);
      doc.text(`Meriendas: ${stats.merienda}`, 20, 92);

      // Tabla de asistencias
      const tableData = filteredAsistencias.map((a) => [
        new Date(a.fecha).toLocaleDateString("es-ES"),
        obtenerNombreServicio(a.id_servicio, a.nombreServicio),
        a.tipoAsistencia || "N/A",
      ]);

      doc.autoTable({
        head: [["Fecha", "Servicio", "Asistencia"]],
        body: tableData,
        startY: 100,
        headStyles: { fillColor: [102, 126, 234] },
        bodyStyles: { textColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Descargar
      doc.save(
        `Asistencias_${alumno?.apellido}_${alumno?.nombre}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showSuccess("Éxito", "PDF descargado correctamente");
    } catch (error) {
      showError("Error", "Error al descargar el PDF");
    }
  };

  const stats = calcularEstadisticas();

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando la Asistencia del Alumno...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`${ContenidoStyle.headerActions} mb-3`}>
        <button
          onClick={() => navigate(-1)}
          className={`${ContenidoStyle.btn} ${ContenidoStyle.btnVolver}`}
          title="Volver"
        >
          <i className="fas fa-arrow-left fs-5"></i>
        </button>
      </div>

      {/* Header */}
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-user-check me-1"></i>
            Asistencias de {alumno?.nombre} {alumno?.apellido}
          </h1>
          <p className={ContenidoStyle.pageSubtitle + " fw-bold"}>
            DNI: {alumno?.dni}
          </p>
          <p className={ContenidoStyle.pageSubtitle + " fw-bold"}>
            Grado: {alumno?.grado}
          </p>
        </div>
      </div>

      {/* Estadísticas */}

      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div
            className={`${DocenteStyle.statsCard} ${DocenteStyle.asistencias}`}
          >
            <div className="fs-3">{stats.totalAsistencias}</div>
            <div>Total Asistencias</div>
          </div>
        </div>
        <div className="col-md-6">
          <div
            className={`${DocenteStyle.statsCard} ${DocenteStyle.inasistencias}`}
          >
            <div className="fs-3">{stats.totalInasistencias}</div>
            <div>Total Inasistencias</div>
          </div>
        </div>
      </div>
      <div className="row g-3 mb-4">
        {obtenerServiciosPresentesEnFiltradas().includes(1) && (
          <>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.desayuno}`}
              >
                <div className="fs-3">{stats.desayuno}</div>
                <div>Desayunos</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.siDesayuno}`}
              >
                <div className="fs-3">{stats.siAsistenciaDesayuno}</div>
                <div>Sí Desayuno</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.noDesayuno}`}
              >
                <div className="fs-3">{stats.noAsistenciaDesayuno}</div>
                <div>No Desayuno</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="row g-3 mb-4">
        {obtenerServiciosPresentesEnFiltradas().includes(2) && (
          <>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.almuerzo}`}
              >
                <div className="fs-3">{stats.almuerzo}</div>
                <div>Almuerzos</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.siAlmuerzo}`}
              >
                <div className="fs-3">{stats.siAsistenciaAlmuerzo}</div>
                <div>Sí Almuerzo</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.noAlmuerzo}`}
              >
                <div className="fs-3">{stats.noAsistenciaAlmuerzo}</div>
                <div>No Almuerzo</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="row g-3 mb-4">
        {obtenerServiciosPresentesEnFiltradas().includes(3) && (
          <>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.merienda}`}
              >
                <div className="fs-3">{stats.merienda}</div>
                <div>Meriendas</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.siMerienda}`}
              >
                <div className="fs-3">{stats.siAsistenciaMerienda}</div>
                <div>Sí Merienda</div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className={`${DocenteStyle.statsCard} ${DocenteStyle.noMerienda}`}
              >
                <div className="fs-3">{stats.noAsistenciaMerienda}</div>
                <div>No Merienda</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filtros */}
      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.searchBar}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    className={ComponenteStyle.formControl}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Fecha Fin</label>
                  <input
                    type="date"
                    className={ComponenteStyle.formControl}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Servicio</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={servicioSeleccionado}
                    onChange={(e) => setServicioSeleccionado(e.target.value)}
                  >
                    <option value="">Todos los servicios</option>
                    {servicios.map((s) => (
                      <option key={s.id_servicio} value={s.id_servicio}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>&nbsp;</label>
                  {(fechaInicio || fechaFin || servicioSeleccionado) && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={clearFilters}
                    >
                      <i className="fas fa-redo"></i>
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-12">
                  <button
                    className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
                    onClick={descargarPDF}
                    disabled={filteredAsistencias.length === 0}
                  >
                    <i className="fas fa-download me-1"></i>
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Asistencias */}
        <div className={TablaStyle.tableContainer}>
          {filteredAsistencias.length === 0 ? (
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No hay asistencias que mostrar</h5>
              <p>
                Intenta cambiar los filtros aplicados o el alumno no tiene
                registros completados.
              </p>
            </div>
          ) : (
            <div className={TablaStyle.scrollableTable}>
              <div className={TablaStyle.tableBodyScroll}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
                    <tr>
                      <th width="10%" className="text-center">
                        #
                      </th>
                      <th width="20%">Fecha</th>
                      <th width="35%">Servicio</th>
                      <th width="35%" className="text-center">
                        Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAsistencias.map((asistencia, index) => (
                      <tr key={`${asistencia.id_asistencia}-${index}`}>
                        <td className="fw-bold text-center">{index + 1}</td>
                        <td>
                          {new Date(asistencia.fecha).toLocaleDateString(
                            "es-ES",
                          )}
                        </td>
                        <td>
                          <span
                            className={`${ContenidoStyle.badge} bg-info text-dark`}
                          >
                            {obtenerNombreServicio(
                              asistencia.id_servicio,
                              asistencia.nombreServicio,
                            )}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`${ContenidoStyle.badge} ${
                              asistencia.tipoAsistencia === "SI" ||
                              asistencia.tipoAsistencia === "No"
                                ? `${ContenidoStyle.badgeSecondary} rounded-circle`
                                : asistencia.tipoAsistencia === "Ausente"
                                  ? ContenidoStyle.badgeDanger
                                  : `${ContenidoStyle.badgeSuccess} rounded-circle`
                            }`}
                          >
                            {asistencia.tipoAsistencia || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsistenciaAlumno;
