import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatAuditDateTime, formatDate, formatDateTime } from "../../utils/dateUtils";
import {
  showSuccess,
  showError,
  showToast,
} from "../../utils/alertService";

const AuditoriaInforme = ({
  logs,
  estadisticas,
  filtrosAuditoria,
  cerrarInforme,
  rolesDisponibles = [],
}) => {
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [usuariosUnicos, setUsuariosUnicos] = useState([]);
  const [usuarioRolMap, setUsuarioRolMap] = useState({}); // Mapeo de usuario -> rol
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Usuarios filtrados por rol
  const [rolesFiltrados, setRolesFiltrados] = useState([]); // Roles filtrados por usuario
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Inicializar estado de filtros independiente
  const [filtrosInforme, setFiltrosInforme] = useState({
    rol: "",
    usuario: "",
    fechaInicio: filtrosAuditoria?.fechaInicio || "",
    fechaFin: filtrosAuditoria?.fechaFin || "",
    modulo: filtrosAuditoria?.modulo || "",
    accion: filtrosAuditoria?.accion || "",
    criticidad: "",
    resultado: "",
    incluirEstadisticas: true,
    incluirDetalles: true,
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

  const criticidades = [
    "Bajo",
    "Medio",
    "Alto",
  ];

  const resultados = [
    "Éxito",
    "Error",
    "Intento_fallido",
  ];

  useEffect(() => {
    // Scroll al inicio cuando se abre el informe
    window.scrollTo(0, 0);
    extraerDatosUnicos();
    // DEBUG: Verificar estructura de logs
    console.log("📋 AuditoriaInforme - Logs recibidos:", logs.length);
    if (logs.length > 0) {
      console.log("🔍 Primer log:", logs[0]);
      console.log("✓ ¿Tiene nombre_rol?", "nombre_rol" in logs[0]);
    }
  }, [logs]);

  // Actualizar filtros dependientes cuando cambien los datos
  useEffect(() => {
    // Cuando cambien los usuarios o roles disponibles, resetear los filtros dependientes
    if (usuariosUnicos.length > 0) {
      setUsuariosFiltrados(usuariosUnicos);
    }
    if (rolesDisponibles.length > 0) {
      setRolesFiltrados(rolesDisponibles);
    }
  }, [usuariosUnicos, rolesDisponibles]);

  const extraerDatosUnicos = () => {
    // Obtener usuarios únicos de los logs
    const usuarios = [...new Set(logs.map((log) => log.nombre_usuario))].filter(
      Boolean
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
    
    // DEBUG
    console.log("👥 Usuarios únicos:", usuarios);
    console.log("🗺️ Mapeo usuario->rol:", mapa);
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Actualizar filtros principales
    setFiltrosInforme((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Lógica de filtros dependientes
    if (name === "rol" && value) {
      // Si se selecciona un rol, filtrar usuarios por ese rol
      const usuariosConRol = usuariosUnicos.filter(
        (usuario) => usuarioRolMap[usuario] === value
      );
      setUsuariosFiltrados(usuariosConRol);
      // Limpiar usuario si no pertenece al rol seleccionado
      setFiltrosInforme((prev) => ({
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
        setFiltrosInforme((prev) => ({
          ...prev,
          rol: rolDelUsuario,
        }));
      }
    } else if (name === "usuario" && !value) {
      // Si se limpia el usuario, mostrar todos los roles
      setRolesFiltrados(rolesDisponibles);
    }

    // Resetear a la primera página cuando cambia un filtro
    setPaginaActual(1);
  };

  const obtenerLogsFiltradores = () => {
    const resultado = logs.filter((log) => {
      // Filtrar por usuario si está seleccionado (primero porque es más específico)
      if (filtrosInforme.usuario) {
        if (log.nombre_usuario !== filtrosInforme.usuario) {
          return false;
        }
      }

      // Filtrar por rol si está seleccionado
      if (filtrosInforme.rol) {
        // Usar el nombre_rol directo del log, no del mapa
        const rolDelLog = log.nombre_rol || "Sin Rol";
        console.log(`🎯 Comparando: usuario=${log.nombre_usuario}, rol_log=${rolDelLog}, rol_filtro=${filtrosInforme.rol}, match=${rolDelLog === filtrosInforme.rol}`);
        if (rolDelLog !== filtrosInforme.rol) {
          return false;
        }
      }

      // Filtrar por rango de fechas
      if (filtrosInforme.fechaInicio || filtrosInforme.fechaFin) {
        const fechaLog = new Date(log.fechaHora).toISOString().split("T")[0];
        if (
          filtrosInforme.fechaInicio &&
          fechaLog < filtrosInforme.fechaInicio
        ) {
          return false;
        }
        if (
          filtrosInforme.fechaFin &&
          fechaLog > filtrosInforme.fechaFin
        ) {
          return false;
        }
      }

      // Filtrar por módulo si está seleccionado
      if (filtrosInforme.modulo && log.modulo !== filtrosInforme.modulo) {
        return false;
      }

      // Filtrar por acción si está seleccionada
      if (filtrosInforme.accion && log.accion !== filtrosInforme.accion) {
        return false;
      }

      // Filtrar por criticidad si está seleccionada
      if (filtrosInforme.criticidad && log.nivel_criticidad !== filtrosInforme.criticidad) {
        return false;
      }

      // Filtrar por resultado si está seleccionado
      if (filtrosInforme.resultado && log.resultado_accion !== filtrosInforme.resultado) {
        return false;
      }

      return true;
    });
    
    console.log(`📊 Total logs: ${logs.length}, Filtro activo: ${filtrosInforme.rol ? 'Rol=' + filtrosInforme.rol : (filtrosInforme.usuario ? 'Usuario=' + filtrosInforme.usuario : 'Ninguno')}, Resultado: ${resultado.length}`);
    return resultado;
  };

  // Funciones de paginación
  const obtenerLogsActuales = () => {
    const logsFiltradores = obtenerLogsFiltradores();
    const indiceInicial = (paginaActual - 1) * registrosPorPagina;
    const indiceFinal = indiceInicial + registrosPorPagina;
    return logsFiltradores.slice(indiceInicial, indiceFinal);
  };

  const totalLogsFiltradores = obtenerLogsFiltradores().length;
  const totalPaginas = Math.ceil(totalLogsFiltradores / registrosPorPagina);

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

  const obtenerColorCriticidad = (criticidad) => {
    const colores = {
      "Bajo": "info",
      "Medio": "warning",
      "Alto": "danger",
    };
    return colores[criticidad] || "secondary";
  };

  const obtenerColorResultado = (resultado) => {
    const colores = {
      "Éxito": "success",
      "Error": "danger",
      "Intento_fallido": "warning",
    };
    return colores[resultado] || "secondary";
  };

  const generarPDF = async () => {
    try {
      const logsFiltradores = obtenerLogsFiltradores();

      if (logsFiltradores.length === 0) {
        showError("No hay datos para generar el informe con los filtros aplicados");
        return;
      }

      setGeneratingPDF(true);

      // Crear nuevo documento PDF
      const doc = new jsPDF("l", "pt", "a4"); // landscape, points, a4
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Configurar fuente
      doc.setFont("helvetica");

      // Encabezado del documento
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("INFORME DE AUDITORÍA DEL SISTEMA", pageWidth / 2, 40, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text("Sistema de Gestión de Comedor Escolar", pageWidth / 2, 60, {
        align: "center",
      });

      // Información del filtro
      let yPosition = 90;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const fechaGeneracion = formatDateTime(new Date());
      doc.text(`Fecha de generación: ${fechaGeneracion}`, 40, yPosition);
      yPosition += 20;

      doc.text(
        `Período: ${formatDate(filtrosInforme.fechaInicio)} al ${formatDate(filtrosInforme.fechaFin)}`,
        40,
        yPosition
      );
      yPosition += 15;

      if (filtrosInforme.usuario)
        (doc.text(
          `Filtro de usuario: ${filtrosInforme.usuario}`,
          40,
          yPosition
        ),
          (yPosition += 15));
      if (filtrosInforme.rol)
        (doc.text(
          `Filtro de rol: ${filtrosInforme.rol}`,
          40,
          yPosition
        ),
          (yPosition += 15));
      if (filtrosInforme.accion)
        (doc.text(
          `Filtro de acción: ${filtrosInforme.accion}`,
          40,
          yPosition
        ),
          (yPosition += 15));
      if (filtrosInforme.modulo)
        (doc.text(
          `Filtro de módulo: ${filtrosInforme.modulo}`,
          40,
          yPosition
        ),
          (yPosition += 15));

      yPosition += 10;

      // Estadísticas (si están habilitadas)
      if (filtrosInforme.incluirEstadisticas && Object.keys(estadisticas).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("RESUMEN ESTADÍSTICO", 40, yPosition);
        yPosition += 20;

        const statsData = [
          [
            "Total de Registros",
            logsFiltradores.length.toString(),
          ],
          ["Usuarios Únicos", estadisticas.usuariosUnicos?.toString() || "0"],
          [
            "Módulos Afectados",
            estadisticas.modulosAfectados?.toString() || "0",
          ],
          [
            "Acciones Críticas (Eliminar)",
            estadisticas.accionesEliminar?.toString() || "0",
          ],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Métrica", "Valor"]],
          body: statsData,
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 8 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 200 },
            1: { cellWidth: 100, halign: "center" },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 30;
      }

      // Tabla de registros de auditoría
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("REGISTROS DE AUDITORÍA", 40, yPosition);
      yPosition += 20;

      // Preparar datos para la tabla
      const tableData = logsFiltradores.map((log) => [
        formatearFecha(log.fechaHora),
        log.nombre_usuario || "Sistema",
        log.accion,
        log.modulo,
        log.descripcion.length > 50
          ? log.descripcion.substring(0, 50) + "..."
          : log.descripcion,
        log.estado || "Éxito",
      ]);

      const headers = [
        "Fecha/Hora",
        "Usuario",
        "Acción",
        "Módulo",
        "Descripción",
        "Estado",
      ];

      // Configurar tabla con autoTable
      autoTable(doc, {
        startY: yPosition,
        head: [headers],
        body: tableData,
        theme: "striped",
        styles: {
          fontSize: 8,
          cellPadding: 6,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 100 }, // Fecha
          1: { cellWidth: 80 }, // Usuario
          2: { cellWidth: 60 }, // Acción
          3: { cellWidth: 70 }, // Módulo
          4: { cellWidth: 200 }, // Descripción
          5: { cellWidth: 50 }, // Estado
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 40, right: 40 },
      });

      // Agregar detalles adicionales si están habilitados
      if (filtrosInforme.incluirDetalles && logsFiltradores.length > 0) {
        // Verificar si hay espacio en la página actual
        const currentY = doc.lastAutoTable.finalY;
        if (currentY > pageHeight - 100) {
          doc.addPage();
          yPosition = 40;
        } else {
          yPosition = currentY + 30;
        }

        doc.setFontSize(12);
        doc.text("INFORMACIÓN ADICIONAL", 40, yPosition);
        yPosition += 20;

        doc.setFontSize(9);
        doc.text(
          `• Total de registros en el período: ${logsFiltradores.length}`,
          40,
          yPosition
        );
        yPosition += 15;

        const accionesUnicas = [...new Set(logsFiltradores.map((log) => log.accion))];
        doc.text(
          `• Acciones registradas: ${accionesUnicas.join(", ")}`,
          40,
          yPosition
        );
        yPosition += 15;

        const modulosUnicos = [...new Set(logsFiltradores.map((log) => log.modulo))];
        doc.text(
          `• Módulos afectados: ${modulosUnicos.join(", ")}`,
          40,
          yPosition
        );
      }

      // Pie de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Sistema de Gestión de Comedor Escolar - Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      }

      // Guardar el PDF
      const nombreArchivo = `informe_auditoria_${filtrosInforme.fechaInicio}_${filtrosInforme.fechaFin}.pdf`;
      doc.save(nombreArchivo);

      showSuccess(
        `Informe PDF generado correctamente: ${nombreArchivo}`,
        "",
        2000
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showError("Error al generar el informe PDF: " + error.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div>
      {/* Header con botón de volver */}
      <div className="page-header mb-3">
        <div className="header-left">
          <button className="btn btn-secondary mb-3" onClick={cerrarInforme}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver a la lista
          </button>
          <h2 className="page-title">
            <i className="fas fa-file-pdf me-2"></i>
            Informe de Auditoría en PDF
          </h2>
          <p className="page-subtitle">
            Configura las opciones del informe antes de generarlo
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-danger"
            onClick={generarPDF}
            disabled={generatingPDF || obtenerLogsFiltradores().length === 0}
            title="Generar informe en PDF"
          >
            {generatingPDF ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                Generando PDF...
              </>
            ) : (
              <>
                <i className="fas fa-file-pdf me-2"></i>
                Generar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen del período */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-calendar me-2"></i>
                Período y Filtros Aplicados
              </h5>
            </div>
            {/* Periodo y registros encontrados */}
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small">📅 Período</label>
                  <p className="fw-bold">
                    {filtrosInforme.fechaInicio} al {filtrosInforme.fechaFin}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small">📋 Registros encontrados</label>
                  <p className="fw-bold">
                    <span className="badge bg-primary" style={{ fontSize: "1rem" }}>
                      {obtenerLogsFiltradores().length}
                    </span>
                  </p>
                </div>
              </div>
              {/* Rol y Usuario */}
             <div className="row mb-3">
              {filtrosInforme.rol && (
                  <div className="col-md-6">
                    <label className="text-muted small">👔 Rol</label>
                    <p className="fw-bold">{filtrosInforme.rol}</p>
                  </div>
              )}
               {filtrosInforme.usuario && (
                  <div className="col-md-6">
                    <label className="text-muted small">👤 Usuario</label>
                    <p className="fw-bold">{filtrosInforme.usuario}</p>
                  </div>
              )}
              </div>
              <div className="row">
                {filtrosInforme.accion && (
                  <div className="col-md-6 mb-2">
                    <label className="text-muted small">🔧 Acción</label>
                    <p className="fw-bold">{filtrosInforme.accion}</p>
                  </div>
                )}
                {filtrosInforme.modulo && (
                  <div className="col-md-6 mb-2">
                    <label className="text-muted small">📦 Módulo</label>
                    <p className="fw-bold">{filtrosInforme.modulo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
       {/* <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small">📊 Total Registros</label>
                <p className="fw-bold display-6 text-primary">
                  {estadisticas.totalRegistros || 0}
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted small">👥 Usuarios Únicos</label>
                <p className="fw-bold h5 text-success">
                  {estadisticas.usuariosUnicos || 0}
                </p>
              </div>
              <div className="mb-3">
                <label className="text-muted small">🔗 Módulos Afectados</label>
                <p className="fw-bold h5 text-info">
                  {estadisticas.modulosAfectados || 0}
                </p>
              </div>
              <div>
                <label className="text-muted small">⚠️ Acciones Críticas</label>
                <p className="fw-bold h5 text-danger">
                  {estadisticas.accionesEliminar || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>

      {/* Opciones del informe */}
      <div className="card">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">
            <i className="fas fa-sliders-h me-2"></i>
            Filtros Avanzados del Informe
          </h5>
        </div>
        <div className="card-body">
          <form>
            {/* Rango de fechas */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="fechaInicio" className="form-label">
                  <i className="fas fa-calendar me-2"></i>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={filtrosInforme.fechaInicio}
                  onChange={handleFiltroChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="fechaFin" className="form-label">
                  <i className="fas fa-calendar me-2"></i>
                  Fecha Fin
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="fechaFin"
                  name="fechaFin"
                  value={filtrosInforme.fechaFin}
                  onChange={handleFiltroChange}
                />
              </div>
            </div>

            {/* Rol y Usuario */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="rol" className="form-label">
                  <i className="fas fa-user-tie me-2"></i>
                  Rol
                </label>
                <select
                  className="form-select"
                  id="rol"
                  name="rol"
                  value={filtrosInforme.rol}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos los roles</option>
                  {rolesFiltrados.length > 0 ? (
                    rolesFiltrados.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))
                  ) : (
                    rolesDisponibles.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="usuario" className="form-label">
                  <i className="fas fa-user me-2"></i>
                  Usuario
                </label>
                <select
                  className="form-select"
                  id="usuario"
                  name="usuario"
                  value={filtrosInforme.usuario}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos los usuarios</option>
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((usuario) => (
                      <option key={usuario} value={usuario}>
                        {usuario}
                      </option>
                    ))
                  ) : (
                    usuariosUnicos.map((usuario) => (
                      <option key={usuario} value={usuario}>
                        {usuario}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Acción y Módulo */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="accion" className="form-label">
                  <i className="fas fa-bolt me-2"></i>
                  Acción
                </label>
                <select
                  className="form-select"
                  id="accion"
                  name="accion"
                  value={filtrosInforme.accion}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las acciones</option>
                  {acciones.map((accion) => (
                    <option key={accion} value={accion}>
                      {accion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="modulo" className="form-label">
                  <i className="fas fa-cubes me-2"></i>
                  Módulo
                </label>
                <select
                  className="form-select"
                  id="modulo"
                  name="modulo"
                  value={filtrosInforme.modulo}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos los módulos</option>
                  {modulos.map((modulo) => (
                    <option key={modulo} value={modulo}>
                      {modulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Criticidad y Resultado */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="criticidad" className="form-label">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Criticidad
                </label>
                <select
                  className="form-select"
                  id="criticidad"
                  name="criticidad"
                  value={filtrosInforme.criticidad}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las criticidades</option>
                  {criticidades.map((criticidad) => (
                    <option key={criticidad} value={criticidad}>
                      {criticidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="resultado" className="form-label">
                  <i className="fas fa-check-circle me-2"></i>
                  Resultado
                </label>
                <select
                  className="form-select"
                  id="resultado"
                  name="resultado"
                  value={filtrosInforme.resultado}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todos los resultados</option>
                  {resultados.map((resultado) => (
                    <option key={resultado} value={resultado}>
                      {resultado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opciones de contenido */}
            <div className="row">
              <div className="col">
                <label className="form-label">
                  <strong>Opciones de contenido:</strong>
                </label>
                <div>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="incluirEstadisticas"
                      name="incluirEstadisticas"
                      checked={filtrosInforme.incluirEstadisticas}
                      onChange={handleFiltroChange}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="incluirEstadisticas"
                    >
                      <strong>Incluir resumen estadístico</strong>
                      <br />
                      <small className="text-muted">
                        Agrega una tabla con el resumen de estadísticas al inicio
                        del informe
                      </small>
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="incluirDetalles"
                      name="incluirDetalles"
                      checked={filtrosInforme.incluirDetalles}
                      onChange={handleFiltroChange}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="incluirDetalles"
                    >
                      <strong>Incluir información adicional</strong>
                      <br />
                      <small className="text-muted">
                        Agrega un resumen de acciones y módulos al final del
                        informe
                      </small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de registros filtrados */}
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="fas fa-table me-2"></i>
            Registros de Auditoría Filtrados
          </h5>
          <small className="text-white-50">
            {obtenerLogsFiltradores().length} registro(s)
          </small>
        </div>

        <div className="card-body">
          {obtenerLogsFiltradores().length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No se encontraron registros</h5>
              <p className="text-muted">
                No hay registros que coincidan con los filtros aplicados
              </p>
            </div>
          ) : (
            <>
              {filtrosInforme.rol && (
                <div className="alert alert-info mb-3">
                  <strong>⚠️ DEBUG:</strong> Filtro de rol '{filtrosInforme.rol}' activo. 
                  Mapa: {Object.keys(usuarioRolMap).length} usuarios.
                  {Object.keys(usuarioRolMap).length > 0 && (
                    <>
                      <br/><small>Muestra de mapeo: {Object.entries(usuarioRolMap).slice(0, 3).map(([u, r]) => `${u}→${r}`).join(", ")}</small>
                    </>
                  )}
                </div>
              )}
              <div className="table-container" style={{ overflowX: "auto" }}>
              <table className="table table-striped data-table">
                <thead className="table-light">
                  <tr>
                    <th width="5%">#</th>
                    <th width="15%">Fecha/Hora</th>
                    <th width="12%">Usuario</th>
                    <th width="10%">Acción</th>
                    <th width="10%">Módulo</th>
                    <th width="20%">Descripción</th>
                    <th width="10%">Criticidad</th>
                    <th width="10%">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {obtenerLogsActuales().map((log, index) => (
                    <tr key={log.id_auditoria}>
                      <td>
                        <strong>{(paginaActual - 1) * registrosPorPagina + index + 1}</strong>
                      </td>
                      <td>
                        <div>
                          <span className="d-block">
                            {formatDate(log.fechaHora)}
                          </span>
                          <small className="text-muted">
                            {new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(log.fechaHora))}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div>
                          <span className="d-block">
                            {log.nombre_usuario || "Sin usuario"}
                          </span>
                          <small className="text-muted">
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
                        <span className="text-muted text-truncate" title={log.descripcion}>
                          {log.descripcion.length > 40
                            ? log.descripcion.substring(0, 40) + "..."
                            : log.descripcion}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge badge-${obtenerColorCriticidad(
                            log.nivel_criticidad
                          )}`}
                        >
                          <i className="fas fa-exclamation-circle me-1"></i>
                          {log.nivel_criticidad || "N/A"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge badge-${obtenerColorResultado(
                            log.resultado_accion
                          )}`}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {obtenerLogsFiltradores().length > 0 && (
          <div className="card-footer bg-light">
            {/* Controles de paginación */}
            <div className="row mb-3 align-items-center">
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                <label htmlFor="registrosPorPaginaInforme" className="form-label me-2 mb-0">
                  <small className="text-muted">
                    Registros por página:
                  </small>
                </label>
                <select
                  id="registrosPorPaginaInforme"
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
                  Total: {obtenerLogsFiltradores().length} registro(s) coinciden con los filtros
                </small>
              </div>

              <div className="col-md-4 text-end">
                <small className="text-muted">
                  Esta tabla refleja exactamente lo que se incluirá en el PDF
                </small>
              </div>
            </div>

            {/* Botones de paginación */}
            <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handlePaginaAnterior}
                disabled={paginaActual === 1}
              >
                <i className="fas fa-chevron-left"></i> Anterior
              </button>

              <div className="d-flex gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
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
                      className={`btn btn-sm ${paginaActual === numeroPagina ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleIrAPagina(numeroPagina)}
                    >
                      {numeroPagina}
                    </button>
                  );
                })}
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

      {/*
      <div className="card mt-3">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">
            <i className="fas fa-eye me-2"></i>
            Vista Previa del Contenido
          </h5>
        </div>
        <div className="card-body">
          <div className="bg-light p-4 rounded border mb-3">
            <h6 className="border-bottom pb-2 mb-3">
              📋 Filtros Aplicados:
            </h6>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Período:</strong> {filtrosInforme.fechaInicio} al{" "}
                  {filtrosInforme.fechaFin}
                </p>
                {filtrosInforme.usuario && (
                  <p className="mb-2">
                    <strong>Usuario:</strong> {filtrosInforme.usuario}
                  </p>
                )}
                {filtrosInforme.rol && (
                  <p className="mb-2">
                    <strong>Rol:</strong> {filtrosInforme.rol}
                  </p>
                )}
              </div>
              <div className="col-md-6">
                {filtrosInforme.accion && (
                  <p className="mb-2">
                    <strong>Acción:</strong> {filtrosInforme.accion}
                  </p>
                )}
                {filtrosInforme.modulo && (
                  <p className="mb-2">
                    <strong>Módulo:</strong> {filtrosInforme.modulo}
                  </p>
                )}
                <p className="mb-2">
                  <strong>Registros encontrados:</strong>{" "}
                  <span className="badge bg-primary">
                    {obtenerLogsFiltradores().length}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-light p-4 rounded border">
            <h6 className="border-bottom pb-2 mb-3">
              📄 Secciones que se incluirán en el PDF:
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <strong>Encabezado</strong> - Título e información del informe
              </li>
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <strong>Período y Filtros</strong> - Fechas y criterios aplicados
              </li>
              {filtrosInforme.incluirEstadisticas && (
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Resumen Estadístico</strong> - Métricas del período
                </li>
              )}
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <strong>Tabla de Registros</strong> - {obtenerLogsFiltradores().length}{" "}
                registros de auditoría
              </li>
              {filtrosInforme.incluirDetalles && (
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Información Adicional</strong> - Detalle de acciones y
                  módulos
                </li>
              )}
              <li className="mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <strong>Pie de Página</strong> - Numeración y datos del sistema
              </li>
            </ul>
          </div>
        </div>
      </div>
       */}
    </div>
  );
};

export default AuditoriaInforme;
