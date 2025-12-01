import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import asistenciasService from "../../services/asistenciasService";
import servicioService from "../../services/servicioService";
import { gradoService } from "../../services/gradoService";

const ListaAsistencia = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [asistencias, setAsistencias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split("T")[0],
    idServicio: "",
    idGrado: "",
    estado: "",
  });
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    pendientes: 0,
    completados: 0,
    cancelados: 0,
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (filtros.fecha) {
      cargarAsistencias();
    }
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [serviciosData, gradosData] = await Promise.all([
        servicioService.getAll(),
        gradoService.getAll(),
      ]);

      setServicios(serviciosData || []);
      setGrados(gradosData || []);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filtros.fecha) params.append("fecha", filtros.fecha);
      if (filtros.idServicio) params.append("idServicio", filtros.idServicio);
      if (filtros.idGrado) params.append("idGrado", filtros.idGrado);

      const queryString = params.toString();
      const response = await asistenciasService.obtenerRegistrosAsistencias(
        queryString
      );

      console.log("🔍 Respuesta del servicio:", response);

      if (response.success) {
        console.log("✅ Datos recibidos:", response.data);
        setAsistencias(response.data || []);
        calcularEstadisticas(response.data || []);
      } else {
        console.error("❌ Error en respuesta:", response.message);
        setAsistencias([]);
        setEstadisticas({
          totalRegistros: 0,
          pendientes: 0,
          completados: 0,
          cancelados: 0,
        });
      }
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      setAsistencias([]);
      setEstadisticas({
        totalRegistros: 0,
        pendientes: 0,
        completados: 0,
        cancelados: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (asistenciasData) => {
    const totalRegistros = asistenciasData.length;
    const pendientes = asistenciasData.filter(
      (a) => a.estado === "Pendiente"
    ).length;
    const completados = asistenciasData.filter(
      (a) => a.estado === "Completado"
    ).length;
    const cancelados = asistenciasData.filter(
      (a) => a.estado === "Cancelado"
    ).length;

    setEstadisticas({
      totalRegistros,
      pendientes,
      completados,
      cancelados,
    });
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: new Date().toISOString().split("T")[0],
      idServicio: "",
      idGrado: "",
      estado: "",
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const obtenerNombreServicio = (idServicio, nombreServicio) => {
    if (nombreServicio) return nombreServicio;
    const servicio = servicios.find(
      (s) => (s.idServicio || s.id_servicio) === idServicio
    );
    return servicio ? servicio.nombre : "Servicio no encontrado";
  };

  const obtenerNombreGrado = (idGrado, nombreGrado) => {
    if (nombreGrado) return nombreGrado;
    const grado = grados.find((g) => (g.idGrado || g.id_grado) === idGrado);
    return grado ? grado.nombre || grado.nombreGrado : "Grado no encontrado";
  };

  const getBadgeEstado = (estado) => {
    const badges = {
      Pendiente: "bg-warning text-dark",
      Completado: "bg-success text-white",
      Cancelado: "bg-danger text-white",
    };
    return badges[estado] || "bg-secondary";
  };

  const getBadgeTipo = (tipo) => {
    const badges = {
      Si: "bg-success text-white",
      No: "bg-danger text-white",
      Ausente: "bg-secondary text-white",
    };
    return badges[tipo] || "bg-secondary";
  };

  const verDetalle = (asistencia) => {
    const tipoTexto =
      asistencia.tipoAsistencia === "Si"
        ? "Presente"
        : asistencia.tipoAsistencia === "No"
        ? "No Confirmado"
        : "Ausente";

    alert(`📋 DETALLE DE ASISTENCIA

👤 Alumno: ${asistencia.nombreAlumno || "Sin especificar"}
📅 Fecha: ${formatearFecha(asistencia.fecha)}
🍽️ Servicio: ${obtenerNombreServicio(
      asistencia.id_servicio,
      asistencia.nombreServicio
    )}
🎓 Grado: ${obtenerNombreGrado(asistencia.id_grado, asistencia.nombreGrado)}
✅ Tipo de Asistencia: ${tipoTexto}
📊 Estado: ${asistencia.estado}
🆔 ID de Registro: ${asistencia.id_asistencia}

${
  asistencia.estado === "Pendiente"
    ? "⚠️ Este registro está pendiente de confirmación"
    : ""
}${
      asistencia.estado === "Completado"
        ? "✅ Este registro ha sido completado"
        : ""
    }${
      asistencia.estado === "Cancelado"
        ? "❌ Este registro ha sido cancelado"
        : ""
    }`);
  };

  const cambiarEstado = async (asistencia) => {
    const nuevoEstado = prompt(
      `Cambiar estado de asistencia para ${asistencia.nombreAlumno}\n\nEstado actual: ${asistencia.estado}\n\nIngrese el nuevo estado:\n- Pendiente\n- Completado\n- Cancelado`,
      asistencia.estado
    );

    if (
      nuevoEstado &&
      ["Pendiente", "Completado", "Cancelado"].includes(nuevoEstado)
    ) {
      if (nuevoEstado === asistencia.estado) {
        alert("El estado seleccionado es el mismo que el actual.");
        return;
      }

      try {
        setLoading(true);
        const response = await asistenciasService.actualizarEstadoAsistencia(
          asistencia.id_asistencia,
          nuevoEstado
        );

        if (response.success) {
          alert(
            `✅ Estado cambiado exitosamente de "${asistencia.estado}" a "${nuevoEstado}"`
          );
          // Recargar los datos para reflejar el cambio
          await cargarAsistencias();
        } else {
          alert(`❌ Error al actualizar estado: ${response.message}`);
        }
      } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert("❌ Error inesperado al cambiar el estado");
      } finally {
        setLoading(false);
      }
    } else if (nuevoEstado !== null) {
      alert("Estado inválido. Debe ser: Pendiente, Completado o Cancelado");
    }
  };

  const exportarCSV = () => {
    if (asistencias.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const headers = [
      "Fecha",
      "Servicio",
      "Grado",
      "Alumno",
      "Tipo de Asistencia",
      "Estado",
    ];
    const csvData = asistencias.map((asistencia) => [
      formatearFecha(asistencia.fecha),
      obtenerNombreServicio(asistencia.id_servicio, asistencia.nombreServicio),
      obtenerNombreGrado(asistencia.id_grado, asistencia.nombreGrado),
      asistencia.nombreAlumno || "Sin especificar",
      asistencia.tipoAsistencia,
      asistencia.estado,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencias_${filtros.fecha}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const asistenciasFiltradasPorEstado = filtros.estado
    ? asistencias.filter((a) => a.estado === filtros.estado)
    : asistencias;

  console.log("📊 Debug - Estado filtro:", filtros.estado);
  console.log("📊 Debug - Total asistencias:", asistencias.length);
  console.log(
    "📊 Debug - Filtradas por estado:",
    asistenciasFiltradasPorEstado.length
  );

  if (loading && asistencias.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando asistencias...</span>
        </div>
        <p className="mt-3">Cargando registros de asistencias...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Registros</h6>
              <h2 className="text-primary">{estadisticas.totalRegistros}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Pendientes</h6>
              <h2 className="text-warning">{estadisticas.pendientes}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Completados</h6>
              <h2 className="text-success">{estadisticas.completados}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Cancelados</h6>
              <h2 className="text-danger">{estadisticas.cancelados}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="fecha" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha
              </label>
              <input
                type="date"
                className="form-control"
                id="fecha"
                name="fecha"
                value={filtros.fecha}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="idServicio" className="form-label">
                <i className="fas fa-utensils me-2"></i>
                Servicio
              </label>
              <select
                className="form-select"
                id="idServicio"
                name="idServicio"
                value={filtros.idServicio}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los servicios</option>
                {servicios.map((servicio) => (
                  <option
                    key={servicio.idServicio || servicio.id_servicio}
                    value={servicio.idServicio || servicio.id_servicio}
                  >
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label htmlFor="idGrado" className="form-label">
                <i className="fas fa-graduation-cap me-2"></i>
                Grado
              </label>
              <select
                className="form-select"
                id="idGrado"
                name="idGrado"
                value={filtros.idGrado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los grados</option>
                {grados.map((grado) => (
                  <option
                    key={grado.idGrado || grado.id_grado}
                    value={grado.idGrado || grado.id_grado}
                  >
                    {grado.nombre || grado.nombreGrado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label htmlFor="estado" className="form-label">
                <i className="fas fa-tasks me-2"></i>
                Estado
              </label>
              <select
                className="form-select"
                id="estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={limpiarFiltros}
            >
              <i className="fas fa-broom me-2"></i>
              Limpiar Filtros
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={exportarCSV}
              disabled={asistencias.length === 0}
            >
              <i className="fas fa-download me-2"></i>
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Asistencias */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Registros de Asistencias
          </h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => cargarAsistencias()}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2 text-muted">Actualizando datos...</p>
            </div>
          ) : asistenciasFiltradasPorEstado.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No hay registros de asistencias</h5>
              <p className="text-muted">
                {filtros.fecha
                  ? `No se encontraron registros para ${formatearFecha(
                      filtros.fecha
                    )}`
                  : "No hay registros con los filtros seleccionados"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-light">
                  <tr>
                    <th width="12%">
                      <i className="fas fa-calendar me-2"></i>
                      Fecha
                    </th>
                    <th width="18%">
                      <i className="fas fa-utensils me-2"></i>
                      Servicio
                    </th>
                    <th width="18%">
                      <i className="fas fa-graduation-cap me-2"></i>
                      Grado
                    </th>
                    <th width="20%">
                      <i className="fas fa-user me-2"></i>
                      Alumno
                    </th>
                    <th width="12%">
                      <i className="fas fa-check me-2"></i>
                      Tipo
                    </th>
                    <th width="12%">
                      <i className="fas fa-tasks me-2"></i>
                      Estado
                    </th>
                    <th width="8%">
                      <i className="fas fa-cogs me-2"></i>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {asistenciasFiltradasPorEstado.map((asistencia, index) => (
                    <tr key={`${asistencia.id_asistencia}-${index}`}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {new Date(asistencia.fecha).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                          <small className="text-muted">
                            {new Date(asistencia.fecha).toLocaleDateString(
                              "es-ES",
                              {
                                weekday: "short",
                              }
                            )}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-light text-dark me-2">
                            <i className="fas fa-utensils me-1"></i>
                          </span>
                          {obtenerNombreServicio(
                            asistencia.id_servicio,
                            asistencia.nombreServicio
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-light text-dark me-2">
                            <i className="fas fa-graduation-cap me-1"></i>
                          </span>
                          {obtenerNombreGrado(
                            asistencia.id_grado,
                            asistencia.nombreGrado
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-info text-white me-2">
                            <i className="fas fa-user me-1"></i>
                          </span>
                          <span className="fw-medium">
                            {asistencia.nombreAlumno || "Sin especificar"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getBadgeTipo(
                            asistencia.tipoAsistencia
                          )}`}
                        >
                          {asistencia.tipoAsistencia}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${getBadgeEstado(
                            asistencia.estado
                          )}`}
                        >
                          {asistencia.estado}
                        </span>
                      </td>

                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {asistencia.estado === "Pendiente" && (
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              title="Cambiar estado"
                              onClick={() => cambiarEstado(asistencia)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {asistenciasFiltradasPorEstado.length > 0 && (
          <div className="card-footer">
            <div className="row text-center">
              <div className="col-md-12">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Mostrando {asistenciasFiltradasPorEstado.length} de{" "}
                  {asistencias.length} registro(s) | Última actualización:{" "}
                  {new Date().toLocaleTimeString("es-ES")}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaAsistencia;
