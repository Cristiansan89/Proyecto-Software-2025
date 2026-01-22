import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import auditoriaService from "../../services/auditoriaService";

const AuditoriaForm = ({ show, onHide }) => {
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [logs, setLogs] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    usuario: "",
    accion: "",
    modulo: "",
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
    "Inventario",
    "Pedidos",
    "Asistencias",
    "Sistema",
    "Reportes",
    "Alertas",
    "Grados",
    "Personas",
  ];

  useEffect(() => {
    if (show) {
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setError("");
    setSuccess("");
    setLogs([]);
    setEstadisticas({});
    setFiltros({
      fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      usuario: "",
      accion: "",
      modulo: "",
      incluirEstadisticas: true,
      incluirDetalles: true,
    });
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      // Cargar logs
      const logsResponse = await auditoriaService.obtenerLogs(filtros);
      if (logsResponse.success) {
        setLogs(logsResponse.data || []);
      } else {
        throw new Error("Error al cargar los logs de auditoría");
      }

      // Cargar estadísticas si están habilitadas
      if (filtros.incluirEstadisticas) {
        const statsResponse = await auditoriaService.obtenerEstadisticas({
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
        });
        if (statsResponse.success) {
          setEstadisticas(statsResponse.data || {});
        }
      }

      setSuccess(
        `Se cargaron ${logsResponse.data?.length || 0} registros correctamente`,
      );
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los datos de auditoría: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generarPDF = async () => {
    try {
      setGeneratingPDF(true);
      setError("");

      if (logs.length === 0) {
        await cargarDatos();
        if (logs.length === 0) {
          throw new Error("No hay datos para generar el informe");
        }
      }

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

      const fechaGeneracion = new Date().toLocaleString("es-ES");
      doc.text(`Fecha de generación: ${fechaGeneracion}`, 40, yPosition);
      yPosition += 20;

      doc.text(
        `Período: ${filtros.fechaInicio} al ${filtros.fechaFin}`,
        40,
        yPosition,
      );
      yPosition += 15;

      if (filtros.usuario)
        (doc.text(`Filtro de usuario: ${filtros.usuario}`, 40, yPosition),
          (yPosition += 15));
      if (filtros.accion)
        (doc.text(`Filtro de acción: ${filtros.accion}`, 40, yPosition),
          (yPosition += 15));
      if (filtros.modulo)
        (doc.text(`Filtro de módulo: ${filtros.modulo}`, 40, yPosition),
          (yPosition += 15));

      yPosition += 10;

      // Estadísticas (si están habilitadas)
      if (filtros.incluirEstadisticas && Object.keys(estadisticas).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("RESUMEN ESTADÍSTICO", 40, yPosition);
        yPosition += 20;

        const statsData = [
          [
            "Total de Registros",
            estadisticas.totalRegistros?.toString() || "0",
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
      const tableData = logs.map((log) => [
        formatearFecha(log.fechaHora),
        log.nombre_usuario || "Sistema",
        log.accion,
        log.modulo,
        log.descripcion.length > 50
          ? log.descripcion.substring(0, 50) + "..."
          : log.descripcion,
        log.estado || "Exito",
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
      if (filtros.incluirDetalles && logs.length > 0) {
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
          `• Total de registros en el período: ${logs.length}`,
          40,
          yPosition,
        );
        yPosition += 15;

        const accionesUnicas = [...new Set(logs.map((log) => log.accion))];
        doc.text(
          `• Acciones registradas: ${accionesUnicas.join(", ")}`,
          40,
          yPosition,
        );
        yPosition += 15;

        const modulosUnicos = [...new Set(logs.map((log) => log.modulo))];
        doc.text(
          `• Módulos afectados: ${modulosUnicos.join(", ")}`,
          40,
          yPosition,
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
          { align: "center" },
        );
      }

      // Guardar el PDF
      const nombreArchivo = `informe_auditoria_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`;
      doc.save(nombreArchivo);

      setSuccess(`Informe PDF generado correctamente: ${nombreArchivo}`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Error al generar el informe PDF: " + error.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal-backdrop fade show"></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-file-pdf me-2"></i>
                Generar Informe de Auditoría en PDF
              </h3>
              <button className="modal-close text-white" onClick={onHide}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </div>
              )}

              <form>
                <div className="row">
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
                      value={filtros.fechaInicio}
                      onChange={handleFiltroChange}
                      max={filtros.fechaFin}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
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
                      min={filtros.fechaInicio}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div>
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
                      placeholder="Buscar en descripción..."
                    />
                  </div>
                </div>
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
                      value={filtros.accion}
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
                      value={filtros.modulo}
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

                <div className="row">
                  <div className="col">
                    <label className="form-label">Opciones del informe:</label>
                    <div className="d-flex gap-3 mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="incluirEstadisticas"
                          name="incluirEstadisticas"
                          checked={filtros.incluirEstadisticas}
                          onChange={handleFiltroChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="incluirEstadisticas"
                        >
                          Incluir resumen estadístico
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="incluirDetalles"
                          name="incluirDetalles"
                          checked={filtros.incluirDetalles}
                          onChange={handleFiltroChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="incluirDetalles"
                        >
                          Incluir información adicional
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-2 mt-2">
                  <h6>Vista previa de datos:</h6>
                  <div className="bg-light rounded">
                    <div className="row">
                      <div className="col">
                        <small className="text-muted">
                          <strong>Registros cargados:</strong> {logs.length}
                          {logs.length > 0 && (
                            <>
                              <br />
                              <strong>Período:</strong> {filtros.fechaInicio} al{" "}
                              {filtros.fechaFin}
                              {filtros.usuario && (
                                <>
                                  <br />
                                  <strong>Filtro usuario:</strong>{" "}
                                  {filtros.usuario}
                                </>
                              )}
                              {filtros.accion && (
                                <>
                                  <br />
                                  <strong>Filtro acción:</strong>{" "}
                                  {filtros.accion}
                                </>
                              )}
                              {filtros.modulo && (
                                <>
                                  <br />
                                  <strong>Filtro módulo:</strong>{" "}
                                  {filtros.modulo}
                                </>
                              )}
                            </>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="form-actions mt-3">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={onHide}
                  disabled={loading || generatingPDF}
                >
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary me-2"
                  onClick={cargarDatos}
                  disabled={loading || generatingPDF}
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Cargando datos...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt me-2"></i>
                      Cargar datos
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={generarPDF}
                  disabled={loading || generatingPDF}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditoriaForm;
