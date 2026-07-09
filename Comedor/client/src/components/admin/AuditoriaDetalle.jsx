import { useEffect } from "react";
import { jsPDF } from "jspdf";
import { formatDateTime } from "../../utils/dateUtils";

const AuditoriaDetalle = ({
  selectedLog,
  formatearFecha,
  obtenerColorCriticidad,
  obtenerColorResultado,
  cerrarDetalles,
}) => {
  useEffect(() => {
    // Scroll al inicio cuando se abre el detalle
    window.scrollTo(0, 0);
  }, [selectedLog]);
  const agregarSeccion = (doc, titulo, datos, posY) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const colorPrimario = [0, 102, 204];
    let yPos = posY;

    // Título de la sección
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, pageWidth - 30, 8, "F");
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colorPrimario);
    doc.text(titulo, 17, yPos + 5);
    yPos += 12;

    // Contenido con pares clave-valor
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    Object.entries(datos).forEach(([clave, valor]) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFont(undefined, "bold");
      doc.text(`${clave}:`, 17, yPos);
      doc.setFont(undefined, "normal");

      const lineas = doc.splitTextToSize(String(valor), pageWidth - 50);
      doc.text(lineas, 50, yPos);

      yPos += lineas.length * 5 + 3;
    });

    return yPos + 5;
  };

  const imprimirDetallePDF = () => {
    try {
      if (!selectedLog) return;

      // Crear documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const colorPrimario = [0, 102, 204];
      let yPosition = 15;

      // Encabezado
      doc.setFillColor(...colorPrimario);
      doc.rect(10, yPosition - 5, pageWidth - 20, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Detalle de Registro de Auditoría", pageWidth / 2, yPosition + 4, {
        align: "center",
      });

      yPosition += 25;

      // Información General
      const formatoFecha = formatearFecha(selectedLog.fechaHora);
      const infoGeneral = {
        "Fecha y Hora": formatoFecha,
        Usuario: selectedLog.nombre_usuario || "N/A",
        Email: selectedLog.email_usuario || "N/A",
      };
      yPosition = agregarSeccion(doc, "Información General", infoGeneral, yPosition);

      // Detalles de la Acción
      const infoAccion = {
        Acción: selectedLog.accion,
        Módulo: selectedLog.modulo,
        Criticidad: selectedLog.nivel_criticidad || "N/A",
        Resultado: selectedLog.resultado_accion || "N/A",
      };

      if (selectedLog.id_registro_afectado) {
        infoAccion["Registro Afectado"] = selectedLog.id_registro_afectado;
      }

      yPosition = agregarSeccion(
        doc,
        "Detalles de la Acción",
        infoAccion,
        yPosition
      );

      // Descripción
      if (selectedLog.descripcion) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition, pageWidth - 30, 8, "F");
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colorPrimario);
        doc.text("Descripción", 17, yPosition + 5);
        yPosition += 12;

        doc.setFont(undefined, "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const descripcionLines = doc.splitTextToSize(
          selectedLog.descripcion,
          pageWidth - 30
        );
        doc.text(descripcionLines, 17, yPosition);
        yPosition += descripcionLines.length * 5 + 8;
      }

      // Valor Anterior
      if (selectedLog.valor_anterior) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        const valorAnteriorData = typeof selectedLog.valor_anterior === "string"
          ? JSON.parse(selectedLog.valor_anterior)
          : selectedLog.valor_anterior;

        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition, pageWidth - 30, 8, "F");
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colorPrimario);
        doc.text("Valor Anterior", 17, yPosition + 5);
        yPosition += 12;

        doc.setDrawColor(...colorPrimario);
        doc.setLineWidth(0.3);
        doc.rect(15, yPosition, pageWidth - 30, 40);

        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const valorAnteriorStr = JSON.stringify(valorAnteriorData, null, 2);
        const lineasAnterior = doc.splitTextToSize(
          valorAnteriorStr,
          pageWidth - 36
        );
        doc.text(lineasAnterior.slice(0, 12), 17, yPosition + 3);
        yPosition += 45;
      }

      // Valor Nuevo
      if (selectedLog.valor_nuevo) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        const valorNuevoData = typeof selectedLog.valor_nuevo === "string"
          ? JSON.parse(selectedLog.valor_nuevo)
          : selectedLog.valor_nuevo;

        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPosition, pageWidth - 30, 8, "F");
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colorPrimario);
        doc.text("Valor Nuevo", 17, yPosition + 5);
        yPosition += 12;

        doc.setDrawColor(...colorPrimario);
        doc.setLineWidth(0.3);
        doc.rect(15, yPosition, pageWidth - 30, 40);

        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const valorNuevoStr = JSON.stringify(valorNuevoData, null, 2);
        const lineasNuevo = doc.splitTextToSize(
          valorNuevoStr,
          pageWidth - 36
        );
        doc.text(lineasNuevo.slice(0, 12), 17, yPosition + 3);
      }

      // Pie de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
        doc.text(
          `Generado el ${formatDateTime(new Date())}`,
          15,
          pageHeight - 8
        );
      }

      // Descargar el PDF
      doc.save(
        `auditoria_${selectedLog.id_auditoria}_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF. Revisa la consola para más detalles.");
    }
  };

  return (
    <div>
      {/* Header con botón de volver */}
      <div className="page-header mb-3">
        <button className="btn btn-secondary mb-3" onClick={cerrarDetalles}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver a la lista
          </button>
      </div>
      <div className="page-header mb-3">
        <div className="header-left">
          
          <h2 className="page-title">
            <i className="fas fa-file-shield me-2"></i>
            Detalles del Registro de Auditoría
          </h2>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-danger"
            onClick={imprimirDetallePDF}
            title="Imprimir este registro en PDF"
          >
            <i className="fas fa-file-pdf me-2"></i>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Contenido de detalles en cards */}
      <div className="row">
        {/* Panel izquierdo - Información General */}
        <div className="col-lg-6">
          <div className="auditoria__card h-100">
            <div className="auditoria__card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Información General
              </h5>
            </div>
            <div className="auditoria__card-body">
              <div className="row mb-3">
                <div className="col-12">
                  <label className="text-muted small">📅 Fecha y Hora</label>
                  <p className="fw-bold">
                    {formatearFecha(selectedLog.fechaHora)}
                  </p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-12">
                  <label className="text-muted small">👤 Usuario</label>
                  <p className="fw-bold">
                    {selectedLog.nombre_usuario || "Sin usuario"}
                  </p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-12">
                  <label className="text-muted small">📧 Email</label>
                  <p className="fw-bold">
                    {selectedLog.email_usuario || "Sin email"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Detalles de la Acción */}
        <div className="col-lg-6">
          <div className="auditoria__card h-100">
            <div className="auditoria__card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Detalles de la Acción
              </h5>
            </div>
            <div className="auditoria__card-body">
              <div className="row mb-3">
                <div className="col-6">
                  <label className="text-muted small">🔧 Acción</label>
                  <p className="fw-bold">{selectedLog.accion}</p>
                </div>
                <div className="col-6">
                  <label className="text-muted small">📦 Módulo</label>
                  <p className="fw-bold">{selectedLog.modulo}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="text-muted small">⚠️ Criticidad</label>
                  <div>
                    <span
                      className={`badge badge-${obtenerColorCriticidad(
                        selectedLog.nivel_criticidad
                      )}`}
                    >
                      {selectedLog.nivel_criticidad || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <label className="text-muted small">✓ Resultado</label>
                  <div>
                    <span
                      className={`badge badge-${obtenerColorResultado(
                        selectedLog.resultado_accion
                      )}`}
                    >
                      {selectedLog.resultado_accion === "Éxito" && (
                        <i className="fas fa-check-circle me-1"></i>
                      )}
                      {selectedLog.resultado_accion === "Error" && (
                        <i className="fas fa-times-circle me-1"></i>
                      )}
                      {selectedLog.resultado_accion === "Intento_fallido" && (
                        <i className="fas fa-exclamation-triangle me-1"></i>
                      )}
                      {selectedLog.resultado_accion || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              {selectedLog.id_registro_afectado && (
                <div className="row">
                  <div className="col-12">
                    <label className="text-muted small">
                      🔗 Registro Afectado
                    </label>
                    <p className="fw-bold font-monospace bg-light p-2 rounded">
                      {selectedLog.id_registro_afectado}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="auditoria__card mb-3 mt-3">
        <div className="auditoria__card-header bg-secondary text-white">
          <h5 className="mb-0">
            <i className="fas fa-align-left me-2"></i>
            Descripción
          </h5>
        </div>
        <div className="auditoria__card-body">
          <p>{selectedLog.descripcion}</p>
        </div>
      </div>

      {/* Valor Anterior */}
      {selectedLog.valor_anterior && (
        <div className="auditoria__card mb-3">
          <div className="auditoria__card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="fas fa-history me-2"></i>
              Valor Anterior
            </h5>
          </div>
          <div className="auditoria__card-body">
            <pre
              className="bg-light p-3 rounded"
              style={{ overflow: "auto", maxHeight: "400px" }}
            >
              {JSON.stringify(
                typeof selectedLog.valor_anterior === "string"
                  ? JSON.parse(selectedLog.valor_anterior)
                  : selectedLog.valor_anterior,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Valor Nuevo */}
      {selectedLog.valor_nuevo && (
        <div className="auditoria__card">
          <div className="auditoria__card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="fas fa-star me-2"></i>
              Valor Nuevo
            </h5>
          </div>
          <div className="auditoria__card-body">
            <pre
              className="bg-light p-3 rounded"
              style={{ overflow: "auto", maxHeight: "400px" }}
            >
              {JSON.stringify(
                typeof selectedLog.valor_nuevo === "string"
                  ? JSON.parse(selectedLog.valor_nuevo)
                  : selectedLog.valor_nuevo,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaDetalle;
