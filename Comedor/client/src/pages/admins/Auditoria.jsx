import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Auditoria.css";

const Auditoria = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0], // Última semana
    fechaFin: new Date().toISOString().split("T")[0],
    usuario: "",
    accion: "",
    modulo: "",
  });

  // Datos de ejemplo para demostración
  const logsPrueba = [
    {
      id: 1,
      fecha: "2025-12-01T10:30:00Z",
      usuario: "admin@sistema.com",
      nombreUsuario: "Juan Pérez",
      accion: "CREAR",
      modulo: "Insumos",
      descripcion: "Creó nuevo insumo: Arroz Blanco",
      ip: "192.168.1.100",
      detalles: { id_insumo: 15, nombre: "Arroz Blanco", cantidad: 50 },
    },
    {
      id: 2,
      fecha: "2025-12-01T09:15:00Z",
      usuario: "cocinera@sistema.com",
      nombreUsuario: "María García",
      accion: "ACTUALIZAR",
      modulo: "Inventario",
      descripcion: "Actualizó stock de insumo: Tomates",
      ip: "192.168.1.105",
      detalles: { id_inventario: 8, cantidad_anterior: 20, cantidad_nueva: 35 },
    },
    {
      id: 3,
      fecha: "2025-12-01T08:45:00Z",
      usuario: "docente@sistema.com",
      nombreUsuario: "Carlos López",
      accion: "CONSULTAR",
      modulo: "Asistencias",
      descripcion: "Consultó lista de asistencias del grado 5°A",
      ip: "192.168.1.102",
      detalles: { id_grado: 5, fecha: "2025-12-01" },
    },
    {
      id: 4,
      fecha: "2025-11-30T16:20:00Z",
      usuario: "admin@sistema.com",
      nombreUsuario: "Juan Pérez",
      accion: "ELIMINAR",
      modulo: "Usuarios",
      descripcion: "Eliminó usuario: test@sistema.com",
      ip: "192.168.1.100",
      detalles: { id_usuario_eliminado: 25, email: "test@sistema.com" },
    },
    {
      id: 5,
      fecha: "2025-11-30T14:10:00Z",
      usuario: "cocinera@sistema.com",
      nombreUsuario: "María García",
      accion: "CREAR",
      modulo: "Pedidos",
      descripcion: "Creó nuevo pedido de insumos",
      ip: "192.168.1.105",
      detalles: { id_pedido: 12, total_items: 8, estado: "Pendiente" },
    },
    {
      id: 6,
      fecha: "2025-11-30T11:30:00Z",
      usuario: "admin@sistema.com",
      nombreUsuario: "Juan Pérez",
      accion: "CONFIGURAR",
      modulo: "Sistema",
      descripcion: "Modificó parámetros del sistema",
      ip: "192.168.1.100",
      detalles: {
        parametro: "limite_stock_minimo",
        valor_anterior: 10,
        valor_nuevo: 15,
      },
    },
  ];

  const acciones = [
    "CREAR",
    "ACTUALIZAR",
    "ELIMINAR",
    "CONSULTAR",
    "LOGIN",
    "LOGOUT",
    "CONFIGURAR",
  ];
  const modulos = [
    "Usuarios",
    "Insumos",
    "Inventario",
    "Pedidos",
    "Asistencias",
    "Sistema",
    "Reportes",
  ];

  useEffect(() => {
    cargarLogs();
  }, [filtros]);

  const cargarLogs = async () => {
    try {
      setLoading(true);

      // Simular carga de datos
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Aplicar filtros a los datos de prueba
      let logsFiltrados = [...logsPrueba];

      if (filtros.fechaInicio) {
        logsFiltrados = logsFiltrados.filter(
          (log) =>
            new Date(log.fecha).toISOString().split("T")[0] >=
            filtros.fechaInicio
        );
      }

      if (filtros.fechaFin) {
        logsFiltrados = logsFiltrados.filter(
          (log) =>
            new Date(log.fecha).toISOString().split("T")[0] <= filtros.fechaFin
        );
      }

      if (filtros.usuario) {
        logsFiltrados = logsFiltrados.filter(
          (log) =>
            log.nombreUsuario
              .toLowerCase()
              .includes(filtros.usuario.toLowerCase()) ||
            log.usuario.toLowerCase().includes(filtros.usuario.toLowerCase())
        );
      }

      if (filtros.accion) {
        logsFiltrados = logsFiltrados.filter(
          (log) => log.accion === filtros.accion
        );
      }

      if (filtros.modulo) {
        logsFiltrados = logsFiltrados.filter(
          (log) => log.modulo === filtros.modulo
        );
      }

      setLogs(logsFiltrados);
    } catch (error) {
      console.error("Error al cargar logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
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
    };
    return colores[accion] || "muted";
  };

  const verDetalles = (log) => {
    const detallesTexto = JSON.stringify(log.detalles, null, 2);
    alert(`📋 DETALLES DEL LOG

🕒 Fecha: ${formatearFecha(log.fecha)}
👤 Usuario: ${log.nombreUsuario} (${log.usuario})
🔧 Acción: ${log.accion}
📦 Módulo: ${log.modulo}
📝 Descripción: ${log.descripcion}
🌐 IP: ${log.ip}

📄 Detalles adicionales:
${detallesTexto}`);
  };

  const exportarLogs = () => {
    if (logs.length === 0) {
      alert("No hay logs para exportar");
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
      formatearFecha(log.fecha),
      `${log.nombreUsuario} (${log.usuario})`,
      log.accion,
      log.modulo,
      log.descripcion,
      log.ip,
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
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-list-ol stats-icon text-primary"></i>
              <h3 className="stats-number text-primary">{logs.length}</h3>
              <p className="stats-label">Total Registros</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-calendar-day stats-icon text-success"></i>
              <h3 className="stats-number text-success">
                {
                  logs.filter(
                    (l) =>
                      new Date(l.fecha).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </h3>
              <p className="stats-label">Hoy</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-users stats-icon text-info"></i>
              <h3 className="stats-number text-info">
                {new Set(logs.map((l) => l.usuario)).size}
              </h3>
              <p className="stats-label">Usuarios Activos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-exclamation-triangle stats-icon text-warning"></i>
              <h3 className="stats-number text-warning">
                {logs.filter((l) => l.accion === "ELIMINAR").length}
              </h3>
              <p className="stats-label">Acciones Críticas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros de Auditoría
          </h5>
        </div>
        <div className="card-body">
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
              className="btn btn-outline-primary"
              onClick={() => cargarLogs()}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Registro de Actividades
          </h5>
          <span className="badge bg-primary">{logs.length} registros</span>
        </div>

        <div className="card-body">
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
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th width="15%">
                      <i className="fas fa-clock me-2"></i>
                      Fecha/Hora
                    </th>
                    <th width="20%">
                      <i className="fas fa-user me-2"></i>
                      Usuario
                    </th>
                    <th width="12%">
                      <i className="fas fa-bolt me-2"></i>
                      Acción
                    </th>
                    <th width="12%">
                      <i className="fas fa-cubes me-2"></i>
                      Módulo
                    </th>
                    <th width="30%">
                      <i className="fas fa-info-circle me-2"></i>
                      Descripción
                    </th>
                    <th width="11%">
                      <i className="fas fa-cogs me-2"></i>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {new Date(log.fecha).toLocaleDateString("es-ES")}
                          </span>
                          <small className="text-muted">
                            {new Date(log.fecha).toLocaleTimeString("es-ES")}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {log.nombreUsuario}
                          </span>
                          <small className="text-muted">{log.usuario}</small>
                          <small className="text-muted">
                            <i className="fas fa-globe-americas me-1"></i>
                            {log.ip}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge bg-${obtenerColorAccion(
                            log.accion
                          )}`}
                        >
                          <i
                            className={obtenerIconoAccion(log.accion).replace(
                              /text-\w+/,
                              ""
                            )}
                          ></i>
                          {log.accion}
                        </span>
                      </td>

                      <td>
                        <span className="badge bg-secondary">
                          <i className="fas fa-cube me-1"></i>
                          {log.modulo}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted">
                          {log.descripcion.length > 60
                            ? log.descripcion.substring(0, 60) + "..."
                            : log.descripcion}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-outline-info"
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
          <div className="card-footer">
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
    </div>
  );
};

export default Auditoria;
