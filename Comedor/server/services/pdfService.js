import PDFDocument from "pdfkit";
import EscuelaService from "./escuelaService.js";
import { generarPDFPedidoJsPDF } from "./pdfServiceJsPDF.js";

/**
 * Generar PDF del pedido - Ahora usa jsPDF como implementación principal
 */
export const generarPDFPedido = async (pedido, detalles) => {
  try {
    console.log("📄 Generando PDF del pedido con jsPDF...");
    return await generarPDFPedidoJsPDF(pedido, detalles);
  } catch (error) {
    console.error("❌ Error con jsPDF, intentando con PDFKit como fallback...");
    return await generarPDFPedidoPDFKit(pedido, detalles);
  }
};

/**
 * Generar PDF del pedido con formato de factura profesional (PDFKit - Fallback)
 */
const generarPDFPedidoPDFKit = async (pedido, detalles) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtener datos de la escuela
      const datosEscuela = await EscuelaService.getDatosEscuela();

      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.on("error", (error) => {
        reject(error);
      });

      // === ENCABEZADO DE LA INSTITUCIÓN ===
      doc
        .fontSize(24)
        .fillColor("#1a237e")
        .text(datosEscuela.nombre || "SISTEMA DE COMEDOR ESCOLAR", 50, 50, {
          align: "center",
        });

      // Información de la escuela dinâmica
      let yPos = 85;
      if (datosEscuela.direccion) {
        doc
          .fontSize(14)
          .fillColor("#424242")
          .text(`Dirección: ${datosEscuela.direccion}`, 50, yPos, {
            align: "center",
          });
        yPos += 20;
      }

      if (datosEscuela.telefono || datosEscuela.email) {
        let contacto = "";
        if (datosEscuela.telefono)
          contacto += `Teléfono: ${datosEscuela.telefono}`;
        if (datosEscuela.telefono && datosEscuela.email) contacto += " | ";
        if (datosEscuela.email) contacto += `Email: ${datosEscuela.email}`;

        doc.text(contacto, 50, yPos, { align: "center" });
        yPos += 20;
      }

      // Línea separadora principal
      yPos += 10;
      doc
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .strokeColor("#1a237e")
        .lineWidth(2)
        .stroke();

      // === TÍTULO DEL DOCUMENTO ===
      yPos += 20;
      doc
        .fontSize(20)
        .fillColor("#c62828")
        .text("ORDEN DE PEDIDO", 50, yPos, { align: "center" });

      // === INFORMACIÓN DEL PEDIDO Y PROVEEDOR ===
      yPos += 40;

      // Cuadro de información del pedido
      doc.rect(50, yPos, 240, 120).strokeColor("#e0e0e0").stroke();

      doc
        .fontSize(14)
        .fillColor("#1565c0")
        .text("DATOS DEL PEDIDO", 60, yPos + 10);

      doc
        .fontSize(11)
        .fillColor("#424242")
        .text(`Número de Pedido:`, 60, yPos + 35)
        .text(`${pedido.id_pedido}`, 60, yPos + 50, {
          width: 220,
          fontSize: 10,
        })
        .text(`Fecha de Emisión:`, 60, yPos + 70)
        .text(
          `${new Date(pedido.fechaEmision).toLocaleDateString("es-ES")}`,
          60,
          yPos + 85
        )
        .text(`Estado:`, 60, yPos + 100)
        .fillColor("#2e7d32")
        .text(`${pedido.estadoPedido || "Pendiente"}`, 120, yPos + 100);

      // Cuadro de información del proveedor
      doc.rect(310, yPos, 240, 120).strokeColor("#e0e0e0").stroke();

      doc
        .fontSize(14)
        .fillColor("#1565c0")
        .text("DATOS DEL PROVEEDOR", 320, yPos + 10);

      doc
        .fontSize(11)
        .fillColor("#424242")
        .text(`Razón Social:`, 320, yPos + 35)
        .text(`${pedido.nombreProveedor}`, 320, yPos + 50, { width: 220 });

      if (pedido.cuitProveedor) {
        doc
          .text(`CUIT:`, 320, yPos + 70)
          .text(`${pedido.cuitProveedor}`, 320, yPos + 85);
      }

      if (pedido.direccionProveedor) {
        doc
          .text(`Dirección:`, 320, yPos + 100)
          .text(`${pedido.direccionProveedor}`, 320, yPos + 115, {
            width: 220,
            height: 15,
          });
      }

      // === TABLA DE PRODUCTOS ===
      yPos = 360;

      doc
        .fontSize(16)
        .fillColor("#1565c0")
        .text("DETALLE DE PRODUCTOS SOLICITADOS", 50, yPos);

      yPos += 30;

      // Encabezado de la tabla
      doc.rect(50, yPos, 500, 25).fillAndStroke("#1565c0", "#1565c0");

      doc
        .fontSize(11)
        .fillColor("#ffffff")
        .text("PRODUCTO", 60, yPos + 8)
        .text("CANTIDAD", 280, yPos + 8)
        .text("UNIDAD", 380, yPos + 8)
        .text("PROVEEDOR", 450, yPos + 8);

      yPos += 25;

      // Filas de productos
      doc.fillColor("#424242");
      detalles.forEach((detalle, index) => {
        // Alternar colores de fila
        if (index % 2 === 0) {
          doc.rect(50, yPos, 500, 20).fillAndStroke("#f5f5f5", "#e0e0e0");
        } else {
          doc.rect(50, yPos, 500, 20).stroke("#e0e0e0");
        }

        doc
          .fontSize(10)
          .fillColor("#424242")
          .text(detalle.nombreInsumo || "N/A", 60, yPos + 6, { width: 210 })
          .text(detalle.cantidadSolicitada || "0", 280, yPos + 6, {
            width: 90,
            align: "center",
          })
          .text(detalle.unidadMedida || "N/A", 380, yPos + 6, {
            width: 60,
            align: "center",
          })
          .text(detalle.nombreProveedor || "N/A", 450, yPos + 6, { width: 90 });

        yPos += 20;

        // Nueva página si es necesario
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      // === RESUMEN Y PIE ===
      yPos += 20;

      // Cuadro de resumen
      doc.rect(350, yPos, 200, 60).strokeColor("#1565c0").stroke();

      doc
        .fontSize(12)
        .fillColor("#1565c0")
        .text("RESUMEN DEL PEDIDO", 360, yPos + 10);

      doc
        .fontSize(10)
        .fillColor("#424242")
        .text(`Total de productos: ${detalles.length}`, 360, yPos + 30)
        .text(
          `Origen: ${
            pedido.origen === "Generado" ? "🤖 Sistema Automático" : "👤 Manual"
          }`,
          360,
          yPos + 45
        );

      // Pie de página
      yPos += 80;
      doc.moveTo(50, yPos).lineTo(550, yPos).strokeColor("#e0e0e0").stroke();

      yPos += 15;
      doc.fontSize(9).fillColor("#666666").text("INSTRUCCIONES:", 50, yPos);

      doc
        .fontSize(8)
        .text(
          "• Por favor, confirme la disponibilidad de todos los productos listados",
          50,
          yPos + 15
        )
        .text(
          "• Incluya en su respuesta los precios unitarios y el tiempo de entrega estimado",
          50,
          yPos + 30
        )
        .text(
          "• Este pedido fue generado automáticamente por nuestro sistema de gestión",
          50,
          yPos + 45
        )
        .text(
          `• Documento generado el: ${new Date().toLocaleString("es-ES")}`,
          50,
          yPos + 60
        );

      // Información de contacto en pie
      yPos += 85;
      doc
        .fontSize(8)
        .fillColor("#1565c0")
        .text(
          "Para consultas contactar a: comedor@escuela.edu | Tel: (011) 4567-8900",
          50,
          yPos,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
