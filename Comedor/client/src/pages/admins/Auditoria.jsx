import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import auditoriaService from "../../services/auditoriaService";
import AuditoriaForm from "../../components/admin/AuditoriaForm";
import {
  showSuccess,
  showError,
  showInfo,
  showInfoAuditoria,
  showToast,
} from "../../utils/alertService";
import "../../styles/Auditoria.css";

const Auditoria = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showPDFForm, setShowPDFForm] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    usuariosUnicos: 0,
    modulosAfectados: 0,
    accionesEliminar: 0,
  });
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0], // Última semana
    fechaFin: new Date().toISOString().split("T")[0],
    usuario: "",
    accion: "",
    modulo: "",
  });

  const acciones = [
    "Registrar",
    "Modificar",
    "Eliminar",
    "Buscar",
    "Consultar",
    "Exportar",
  ];
  const modulos = [
    "Usuarios",
    "Insumos",
    "Inventario",
    "Pedidos",
    "Asistencias",
    "Sistema",
    "Reportes",
    "Alertas",
  ];

  useEffect(() => {
    cargarLogs();
    cargarEstadisticas();
  }, [filtros]);

  const cargarLogs = async () => {
    try {
      setLoading(true);
      const response = await auditoriaService.obtenerLogs(filtros);

      if (response.success) {
        setLogs(response.data || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error al cargar logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await auditoriaService.obtenerEstadisticas({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
      });

      if (response.success) {
        setEstadisticas(response.data || {});
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
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
      fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      usuario: "",
      accion: "",
      modulo: "",
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const obtenerIconoAccion = (accion) => {
    const iconos = {
      CREAR: "fas fa-plus-circle text-success",
      ACTUALIZAR: "fas fa-edit text-warning",
      ELIMINAR: "fas fa-trash-alt text-danger",
      CONSULTAR: "fas fa-eye text-info",
      LOGIN: "fas fa-sign-in-alt text-primary",
      LOGOUT: "fas fa-sign-out-alt text-secondary",
      CONFIGURAR: "fas fa-cog text-dark",
      DESCARGAR: "fas fa-download text-secondary",
    };
    return iconos[accion] || "fas fa-info-circle text-muted";
  };

  const obtenerColorAccion = (accion) => {
    const colores = {
      CREAR: "success",
      ACTUALIZAR: "warning",
      ELIMINAR: "danger",
      CONSULTAR: "info",
      LOGIN: "primary",
      LOGOUT: "secondary",
      CONFIGURAR: "dark",
      DESCARGAR: "secondary",
    };
    return colores[accion] || "muted";
  };

  const formatUuidAsInt = (uuid) =>
    BigInt("0x" + uuid.replace(/-/g, "")).toString();

  const verDetalles = (log) => {
    // 1. Procesar los detalles técnicos (JSON)
    // Usamos un estilo más moderno para el bloque de código
    const detallesHtml = log.detalles
      ? `<pre style="text-align: left; background: #f4f4f4; padding: 10px; border-radius: 5px; font-size: 0.85em; max-height: 300px; overflow: auto;">${JSON.stringify(
          log.detalles,
          null,
          2
        )}</pre>`
      : `<p style="color: #666; font-style: italic;">Sin detalles adicionales</p>`;

    // 2. Construir el cuerpo del modal con Template Literals
    const contenidoHtml = `
    <div style="text-align: left; line-height: 1.6;">
      <p><strong>🕒 Fecha:</strong> ${formatearFecha(log.fecha_creacion)}</p>
      <p><strong>👤 Usuario:</strong> ${log.nombre_usuario ?? "N/A"} 
         <span style="color: #666; font-size: 0.9em;">(${
           log.email_usuario ?? "Sin email"
         })</span>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
      <p><strong>🔧 Acción:</strong> ${log.accion}</p>
      <p><strong>📦 Módulo:</strong> ${log.modulo}</p>
      <p><strong>📝 Descripción:</strong> ${log.descripcion}</p>
      
    </div>
  `;

    // 3. Mostrar la información
    showInfoAuditoria("Detalles del Registro de Auditoría", contenidoHtml);
  };

  const exportarLogs = () => {
    if (logs.length === 0) {
      showToast("No hay logs para exportar", "warning", 2000);
      return;
    }

    const headers = [
      "Fecha",
      "Usuario",
      "Acción",
      "Módulo",
      "Descripción",
      "IP",
    ];

    const csvData = logs.map((log) => [
      formatearFecha(log.fecha_creacion),
      `${log.nombre_usuario || "Sin usuario"} (${
        log.email_usuario || "Sin email"
      })`,
      log.accion,
      log.modulo,
      log.descripcion,
      log.ip_origen || "Sin IP",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const fecha = new Date().toISOString().split("T")[0].replace(/-/g, "");
    link.download = `auditoria_${fecha}_${logs.length}registros.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(
      "Exportación exitosa",
      `Se exportaron ${logs.length} registros`,
      2000
    );
  };

  return (
    <div className="auditoria-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fa-solid fa-file-shield me-2"></i>
            Auditoría del Sistema
          </h1>
          <p className="page-subtitle">
            Registro de actividades y eventos del sistema
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card auditoria__stats-card">
            <div className="card-body text-center">
              <i className="fas fa-list-ol stats-icon text-primary"></i>
              <h3 className="stats-number text-primary">
                {estadisticas.totalRegistros || 0}
              </h3>
              <p className="stats-label">Total Registros</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card auditoria__stats-card">
            <div className="card-body text-center">
              <i className="fas fa-calendar-day stats-icon text-success"></i>
              <h3 className="stats-number text-success">
                {estadisticas.usuariosUnicos || 0}
              </h3>
              <p className="stats-label">Usuarios Únicos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card auditoria__stats-card">
            <div className="card-body text-center">
              <i className="fas fa-users stats-icon text-info"></i>
              <h3 className="stats-number text-info">
                {estadisticas.modulosAfectados || 0}
              </h3>
              <p className="stats-label">Módulos Afectados</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card auditoria__stats-card">
            <div className="card-body text-center">
              <i className="fas fa-exclamation-triangle stats-icon text-warning"></i>
              <h3 className="stats-number text-warning">
                {estadisticas.accionesEliminar || 0}
              </h3>
              <p className="stats-label">Acciones Críticas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card auditoria__card">
        <div className="auditoria__card-header">
          <h5 className="auditoria__card-title">
            <i className="fas fa-filter me-2"></i>
            Filtros de Auditoría
          </h5>
        </div>
        <div className="auditoria__card-body">
          <div className="row g-3">
            <div className="col-md-2">
              <label htmlFor="fechaInicio" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha Inicio
              </label>
              <input
                type="date"
                className="form-control"
                id="fechaInicio"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-2">
              <label htmlFor="fechaFin" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha Fin
              </label>
              <input
                type="date"
                className="form-control"
                id="fechaFin"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="usuario" className="form-label">
                <i className="fas fa-user me-2"></i>
                Usuario
              </label>
              <input
                type="text"
                className="form-control"
                id="usuario"
                name="usuario"
                value={filtros.usuario}
                onChange={handleFiltroChange}
                placeholder="Buscar por nombre o email..."
              />
            </div>

            <div className="col-md-2">
              <label htmlFor="accion" className="form-label">
                <i className="fas fa-bolt me-2"></i>
                Acción
              </label>
              <select
                className="form-select"
                id="accion"
                name="accion"
                value={filtros.accion}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                {acciones.map((accion) => (
                  <option key={accion} value={accion}>
                    {accion}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label htmlFor="modulo" className="form-label">
                <i className="fas fa-cubes me-2"></i>
                Módulo
              </label>
              <select
                className="form-select"
                id="modulo"
                name="modulo"
                value={filtros.modulo}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {modulos.map((modulo) => (
                  <option key={modulo} value={modulo}>
                    {modulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-1 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={limpiarFiltros}
                title="Limpiar filtros"
              >
                <i className="fas fa-broom"></i>
              </button>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-success"
              onClick={exportarLogs}
              disabled={logs.length === 0}
            >
              <i className="fas fa-file-csv me-2"></i>
              Exportar CSV
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowPDFForm(true)}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Generar PDF
            </button>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => {
                cargarLogs();
                cargarEstadisticas();
              }}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="card auditoria__card">
        <div className="auditoria__card-header">
          <h5 className="auditoria__card-title">
            <i className="fas fa-list me-2"></i>
            Registro de Actividades
          </h5>
          <span className="badge badge-primary">{logs.length} registros</span>
        </div>

        <div className="auditoria__card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2 text-muted">Cargando logs de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No se encontraron registros</h5>
              <p className="text-muted">
                No hay logs que coincidan con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table table-striped data-table">
                <thead className="table-light">
                  <tr>
                    <th width="5%">ID</th>
                    <th width="15%">Fecha/Hora</th>
                    <th width="20%">Usuario</th>
                    <th width="10%">Acción</th>
                    <th width="10%">Módulo</th>
                    <th width="30%">Descripción</th>
                    <th width="10%">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id_auditoria}>
                      <td>
                        <strong>{index + 1}</strong>
                      </td>
                      <td>
                        <div className="auditoria__fecha-info">
                          <span className="auditoria__fecha-date">
                            {new Date(log.fecha_creacion).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                          <small className="auditoria__fecha-time">
                            {new Date(log.fecha_creacion).toLocaleTimeString(
                              "es-ES"
                            )}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="auditoria__usuario-info">
                          <span className="auditoria__usuario-nombre">
                            {log.nombre_usuario || "Sin usuario"}
                          </span>
                          <small className="auditoria__usuario-email">
                            {log.email_usuario || "Sin email"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          <i className="fas fa-info-circle me-1"></i>
                          {log.accion}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-secondary">
                          <i className="fas fa-cube me-1"></i>
                          {log.modulo}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted text-truncate-custom">
                          {log.descripcion}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm auditoria__btn-outline-info"
                          onClick={() => verDetalles(log)}
                          title="Ver detalles completos"
                        >
                          <i className="fas fa-search-plus"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="auditoria__card-footer">
            <div className="row text-center">
              <div className="col-md-12">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Mostrando {logs.length} registro(s) de auditoría | Período:{" "}
                  {filtros.fechaInicio} - {filtros.fechaFin} | Última
                  actualización: {new Date().toLocaleTimeString("es-ES")}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para generar PDF */}
      <AuditoriaForm show={showPDFForm} onHide={() => setShowPDFForm(false)} />
    </div>
  );
};

export default Auditoria;
