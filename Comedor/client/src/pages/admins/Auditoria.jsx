import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import auditoriaService from "../../services/auditoriaService";
import { formatAuditDateTime, formatDate } from "../../utils/dateUtils";
import AuditoriaInforme from "../../components/admin/AuditoriaInforme";
import AuditoriaDetalle from "../../components/admin/AuditoriaDetalle";
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
  const [usuariosUnicos, setUsuariosUnicos] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [usuarioRolMap, setUsuarioRolMap] = useState({}); // Mapeo de usuario -> rol
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Usuarios filtrados por rol
  const [rolesFiltrados, setRolesFiltrados] = useState([]); // Roles filtrados por usuario
  const [showInforme, setShowInforme] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
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
    rol: "",
    accion: "",
    modulo: "",
    criticidad: "",
    resultado: "",
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const acciones = [
    "Registrar",
    "Modificar",
    "Eliminar",
    "Buscar",
    "Consultar",
    "Exportar",
  ];

  const criticidades = ["Bajo", "Medio", "Alto"];

  const resultados = ["Éxito", "Error", "Intento_fallido"];

  useEffect(() => {
    cargarLogs();
    cargarEstadisticas();
    cargarRoles();
  }, [filtros]);

  useEffect(() => {
    // Extraer usuarios únicos y crear mapeo usuario -> rol
    const usuarios = [...new Set(logs.map((log) => log.nombre_usuario))].filter(
      Boolean,
    );
    setUsuariosUnicos(usuarios);

    // Crear mapeo de usuario -> rol
    const mapa = {};
    logs.forEach((log) => {
      if (log.nombre_usuario) {
        mapa[log.nombre_usuario] = log.nombre_rol || "Sin Rol";
      }
    });
    setUsuarioRolMap(mapa);

    // Resetear filtros dependientes cuando cambian los logs
    setUsuariosFiltrados(usuarios);
    setRolesFiltrados(rolesDisponibles);
    setPaginaActual(1);
  }, [logs, rolesDisponibles]);

  const modulos = [
    "Usuarios",
    "Insumos",
    "Inventarios",
    "Pedidos",
    "Asistencias",
    "Roles",
    "Grados",
    "Personas",
    "Servicios",
    "Recetas",
    "Turnos",
    "Permisos",
    "Consumos",
    "Planificación Menús",
    "Proveedores",
    "Items Recetas",
    "Líneas Pedidos",
    "Movimientos Inventarios",
    "Parámetros Sistema",
    "Registros Asistencias",
    "Rol Permisos",
    "Servicio Turnos",
    "Recetas Servicios",
    "Proveedor Insumos",
    "Alumno Grados",
    "Docente Grados",
    "Reemplazo Docentes",
    "Estado Pedidos",
    "Tipos Merma",
    "Alertas Inventario",
    "Generación Automática",
    "Escuela",
    "Configuración Servicios",
    "Telegram",
    "Auditoría",
    "Autenticación",
  ];

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
      //console.error("Error al cargar logs:", error);
      showError("Error al cargar los registros de auditoría.");
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
      //console.error("Error al cargar estadísticas:", error);
      showError("Error al cargar las estadísticas de auditoría.");
    }
  };

  const cargarRoles = async () => {
    try {
      const response = await auditoriaService.obtenerRoles();

      if (response.success) {
        setRolesDisponibles(response.data || []);
      }
    } catch (error) {
      //console.error("Error al cargar roles:", error);
      setRolesDisponibles([]);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    // Actualizar filtros principales
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Lógica de filtros dependientes
    if (name === "rol" && value) {
      // Si se selecciona un rol, filtrar usuarios por ese rol
      const usuariosConRol = usuariosUnicos.filter(
        (usuario) => usuarioRolMap[usuario] === value,
      );
      setUsuariosFiltrados(usuariosConRol);
      // Limpiar usuario si no pertenece al rol seleccionado
      setFiltros((prev) => ({
        ...prev,
        usuario: "",
      }));
    } else if (name === "rol" && !value) {
      // Si se limpia el rol, mostrar todos los usuarios
      setUsuariosFiltrados(usuariosUnicos);
    }

    if (name === "usuario" && value) {
      // Si se selecciona un usuario, mostrar solo su rol
      const rolDelUsuario = usuarioRolMap[value];
      if (rolDelUsuario) {
        setRolesFiltrados([rolDelUsuario]);
        setFiltros((prev) => ({
          ...prev,
          rol: rolDelUsuario,
        }));
      }
    } else if (name === "usuario" && !value) {
      // Si se limpia el usuario, mostrar todos los roles
      setRolesFiltrados(rolesDisponibles);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      usuario: "",
      rol: "",
      accion: "",
      modulo: "",
      criticidad: "",
      resultado: "",
    });
    setUsuariosFiltrados(usuariosUnicos);
    setRolesFiltrados(rolesDisponibles);
    setPaginaActual(1);
  };

  // Funciones de paginación
  const obtenerLogsActuales = () => {
    const indiceInicial = (paginaActual - 1) * registrosPorPagina;
    const indiceFinal = indiceInicial + registrosPorPagina;
    return logs.slice(indiceInicial, indiceFinal);
  };

  const totalPaginas = Math.ceil(logs.length / registrosPorPagina);

  const handleRegistrosPorPagina = (e) => {
    setRegistrosPorPagina(parseInt(e.target.value));
    setPaginaActual(1);
  };

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const handleIrAPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const formatearFecha = (fecha) => {
    return formatAuditDateTime(fecha);
  };

  const formatearFechaParaDisplay = (fecha) => {
    if (!fecha) return "";
    const [año, mes, día] = fecha.split("-");
    return `${día}/${mes}/${año}`;
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

  const obtenerColorCriticidad = (criticidad) => {
    const colores = {
      Bajo: "info",
      Medio: "warning",
      Alto: "danger",
    };
    return colores[criticidad] || "secondary";
  };

  const obtenerColorResultado = (resultado) => {
    const colores = {
      Éxito: "success",
      Error: "danger",
      Intento_fallido: "warning",
    };
    return colores[resultado] || "secondary";
  };

  const formatUuidAsInt = (uuid) =>
    BigInt("0x" + uuid.replace(/-/g, "")).toString();

  const verDetalles = (log) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const cerrarDetalles = () => {
    setShowDetail(false);
    setSelectedLog(null);
  };

  const abrirInforme = () => {
    setShowInforme(true);
  };

  const cerrarInforme = () => {
    setShowInforme(false);
  };

  const exportarLogs = () => {
    if (logs.length === 0) {
      showToast("No hay logs para exportar", "warning", 2000);
      return;
    }

    const headers = [
      "Fecha",
      "Usuario",
      "Email",
      "Acción",
      "Módulo",
      "Descripción",
      "Criticidad",
      "Resultado",
      "ID Registro Afectado",
    ];

    const csvData = logs.map((log) => [
      formatearFecha(log.fechaHora),
      log.nombre_usuario || "Sin usuario",
      log.email_usuario || "Sin email",
      log.accion,
      log.modulo,
      log.descripcion,
      log.nivel_criticidad || "N/A",
      log.resultado_accion || "N/A",
      log.id_registro_afectado || "N/A",
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
      2000,
    );
  };

  return (
    <div className="auditoria-container">
      {/* Vista de informe PDF */}
      {showInforme ? (
        <AuditoriaInforme
          logs={logs}
          estadisticas={estadisticas}
          filtrosAuditoria={filtros}
          cerrarInforme={cerrarInforme}
          rolesDisponibles={rolesDisponibles}
        />
      ) : showDetail && selectedLog ? (
        <AuditoriaDetalle
          selectedLog={selectedLog}
          formatearFecha={formatearFecha}
          obtenerColorCriticidad={obtenerColorCriticidad}
          obtenerColorResultado={obtenerColorResultado}
          cerrarDetalles={cerrarDetalles}
        />
      ) : (
        <>
          {/* Vista de lista */}
          <div className="page-header mb-3">
            <div className="header-left">
              <h1 className="page-title">
                <i className="fa-solid fa-file-shield"></i>
                Auditoría del Sistema
              </h1>
              <p className="page-subtitle">
                Registro de actividades y eventos del sistema
              </p>
            </div>
            <div>
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

          {/* Estadísticas rápidas */}
          <div className="row mb-2">
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
            {/* HEADER */}
            <div className="auditoria__card-header d-flex justify-content-between align-items-center">
              <h5 className="auditoria__card-title mb-0">
                <i className="fas fa-filter me-2"></i>
                Filtros de Auditoría
              </h5>

              <div className="d-flex gap-2">
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
                  onClick={abrirInforme}
                >
                  <i className="fas fa-file-pdf me-2"></i>
                  Generar PDF
                </button>
              </div>
            </div>
            {/* ← ESTE DIV FALTABA */}

            {/* BODY */}
            <div className="auditoria__card-body">
              <div className="row g-3">
                {/* Fecha Inicio */}
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

                {/* Fecha Fin */}
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

                {/* Usuario */}
                <div className="col-md-2">
                  <label htmlFor="usuario" className="form-label">
                    <i className="fas fa-user me-2"></i>
                    Usuario
                  </label>
                  <select
                    className="form-select"
                    id="usuario"
                    name="usuario"
                    value={filtros.usuario}
                    onChange={handleFiltroChange}
                    disabled={usuariosFiltrados.length === 0}
                  >
                    <option value="">Todos los usuarios</option>
                    {usuariosFiltrados.map((usuario) => (
                      <option key={usuario} value={usuario}>
                        {usuario}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rol */}
                <div className="col-md-2">
                  <label htmlFor="rol" className="form-label">
                    <i className="fas fa-user-tie me-2"></i>
                    Rol
                  </label>
                  <select
                    className="form-select"
                    id="rol"
                    name="rol"
                    value={filtros.rol}
                    onChange={handleFiltroChange}
                    disabled={rolesFiltrados.length === 0}
                  >
                    <option value="">Todos los roles</option>
                    {rolesFiltrados.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Acción */}
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

                {/* Módulo */}
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

                {/* Criticidad */}
                <div className="col-md-2">
                  <label htmlFor="criticidad" className="form-label">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    Criticidad
                  </label>
                  <select
                    className="form-select"
                    id="criticidad"
                    name="criticidad"
                    value={filtros.criticidad}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todas</option>
                    {criticidades.map((criticidad) => (
                      <option key={criticidad} value={criticidad}>
                        {criticidad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resultado */}
                <div className="col-md-2">
                  <label htmlFor="resultado" className="form-label">
                    <i className="fas fa-check-circle me-2"></i>
                    Resultado
                  </label>
                  <select
                    className="form-select"
                    id="resultado"
                    name="resultado"
                    value={filtros.resultado}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todos</option>
                    {resultados.map((resultado) => (
                      <option key={resultado} value={resultado}>
                        {resultado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón limpiar*/}
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-secondary w-100"
                    onClick={limpiarFiltros}
                    title="Limpiar filtros"
                  >
                    <i className="fas fa-broom"></i> Limpiar Filtros
                  </button>
                </div>
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
              <span className="badge badge-primary">
                {logs.length} registros
              </span>
            </div>

            <div className="auditoria__card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2 text-muted">
                    Cargando logs de auditoría...
                  </p>
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
                        <th width="6%">ID</th>
                        <th width="17%">Fecha/Hora</th>
                        <th width="17%">Usuario</th>
                        <th width="12%">Acción</th>
                        <th width="12%">Módulo</th>
                        {/*<th width="15%">Descripción</th>*/}
                        <th width="12%">Criticidad</th>
                        <th width="12%">Resultado</th>
                        <th width="12%">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obtenerLogsActuales().map((log, index) => (
                        <tr key={log.id_auditoria}>
                          <td>
                            <strong>
                              {(paginaActual - 1) * registrosPorPagina +
                                index +
                                1}
                            </strong>
                          </td>
                          <td>
                            <div className="auditoria__fecha-info">
                              <span className="auditoria__fecha-date">
                                {formatDate(log.fechaHora)}
                              </span>
                              <small className="auditoria__fecha-time">
                                {new Intl.DateTimeFormat("es-AR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false,
                                }).format(new Date(log.fechaHora))}
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
                          {/* 
                      <td>
                        <span className="text-muted text-truncate-custom">
                          {log.descripcion}
                        </span>
                      </td>
*/}
                          <td>
                            <span
                              className={`badge badge-${obtenerColorCriticidad(log.nivel_criticidad)}`}
                            >
                              <i className="fas fa-exclamation-circle me-1"></i>
                              {log.nivel_criticidad || "N/A"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge badge-${obtenerColorResultado(log.resultado_accion)}`}
                            >
                              {log.resultado_accion === "Éxito" && (
                                <i className="fas fa-check-circle me-1"></i>
                              )}
                              {log.resultado_accion === "Error" && (
                                <i className="fas fa-times-circle me-1"></i>
                              )}
                              {log.resultado_accion === "Intento_fallido" && (
                                <i className="fas fa-exclamation-triangle me-1"></i>
                              )}
                              {log.resultado_accion || "N/A"}
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
                <div className="row mb-3 align-items-center">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <label
                        htmlFor="registrosPorPagina"
                        className="form-label me-2 mb-0"
                      >
                        <small className="text-muted">
                          Registros por página:
                        </small>
                      </label>
                      <select
                        id="registrosPorPagina"
                        className="form-select form-select-sm"
                        value={registrosPorPagina}
                        onChange={handleRegistrosPorPagina}
                        style={{ width: "4em" }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4 text-center">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      Mostrando {obtenerLogsActuales().length} de {logs.length}{" "}
                      registros
                    </small>
                  </div>

                  <div className="col-md-4 text-end">
                    <small className="text-muted">
                      Período: {formatearFechaParaDisplay(filtros.fechaInicio)}{" "}
                      - {formatearFechaParaDisplay(filtros.fechaFin)}
                    </small>
                  </div>
                </div>

                {/* Controles de paginación */}
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handlePaginaAnterior}
                    disabled={paginaActual === 1}
                  >
                    <i className="fas fa-chevron-left"></i> Anterior
                  </button>

                  <div className="d-flex gap-1">
                    {Array.from(
                      { length: Math.min(5, totalPaginas) },
                      (_, i) => {
                        let numeroPagina;
                        if (totalPaginas <= 5) {
                          numeroPagina = i + 1;
                        } else if (paginaActual <= 3) {
                          numeroPagina = i + 1;
                        } else if (paginaActual >= totalPaginas - 2) {
                          numeroPagina = totalPaginas - 4 + i;
                        } else {
                          numeroPagina = paginaActual - 2 + i;
                        }

                        return (
                          <button
                            key={numeroPagina}
                            className={`btn btn-sm ${paginaActual === numeroPagina ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => handleIrAPagina(numeroPagina)}
                          >
                            {numeroPagina}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handlePaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente <i className="fas fa-chevron-right"></i>
                  </button>

                  <small className="text-muted ms-2">
                    Página {paginaActual} de {totalPaginas}
                  </small>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Auditoria;
