import PDFDocument from "pdfkit";
import EscuelaService from "./escuelaService.js";
// import { generarPDFPedidoJsPDF } from "./pdfServiceJsPDF.js"; // Deshabilitado: problemas con jspdf-autotable en servidor
import nodemailer from "nodemailer";

/**
 * Convertir cantidad según la unidad de medida
 * Si la unidad contiene "Gramo" o "Mililitro" y cantidad > 1000, divide por 1000
 */
const convertirCantidad = (cantidad, unidad) => {
  const cantidadNum = Number(cantidad) || 0;
  if (
    (unidad.includes("Gramo") || unidad.includes("Mililitro")) &&
    cantidadNum > 1000
  ) {
    return Math.round((cantidadNum / 1000) * 100) / 100;
  }
  return cantidadNum;
};

/**
 * Generar PDF del pedido - Usa PDFKit como implementación en servidor
 */
export const generarPDFPedido = async (pedido, detalles) => {
  try {
    console.log("📄 Generando PDF del pedido con PDFKit...");
    return await generarPDFPedidoPDFKit(pedido, detalles);
  } catch (error) {
    console.error("❌ Error al generar PDF:", error);
    throw error;
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
          yPos + 85,
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

        // Convertir cantidad según unidad
        const cantidadMostrada = convertirCantidad(
          detalle.cantidadSolicitada,
          detalle.unidadMedida,
        );

        doc
          .fontSize(10)
          .fillColor("#424242")
          .text(detalle.nombreInsumo || "N/A", 60, yPos + 6, { width: 210 })
          .text(cantidadMostrada || "0", 280, yPos + 6, {
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
          yPos + 45,
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
          yPos + 15,
        )
        .text(
          "• Incluya en su respuesta los precios unitarios y el tiempo de entrega estimado",
          50,
          yPos + 30,
        )
        .text(
          "• Este pedido fue generado automáticamente por nuestro sistema de gestión",
          50,
          yPos + 45,
        )
        .text(
          `• Documento generado el: ${new Date().toLocaleString("es-ES")}`,
          50,
          yPos + 60,
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
          { align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generar PDF de confirmación de pedido por proveedor
 * @param {Object} datos - Datos del pedido confirmado
 * @returns {Promise<Buffer>} - Buffer con el contenido del PDF
 */
export const generarPDFConfirmacionProveedor = async (datos) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        numeroPedido,
        proveedor,
        fechaPedido,
        insumosConfirmados = [],
        insumosNoDisponibles = [],
      } = datos;

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

      // Encabezado
      doc
        .fontSize(20)
        .fillColor("#1a237e")
        .text("CONFIRMACIÓN DE PEDIDO", { align: "center" });

      doc.fontSize(11).fillColor("#000000").moveDown(0.5);

      // Información del pedido
      doc.fontSize(11).text(`Número de Pedido: ${numeroPedido}`);
      doc.text(
        `Fecha de Pedido: ${new Date(fechaPedido).toLocaleDateString("es-AR")}`,
      );
      doc.text(
        `Fecha de Confirmación: ${new Date().toLocaleDateString("es-AR")}`,
      );

      // Información del proveedor
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor("#1565c0").text("Datos del Proveedor");
      doc.fontSize(11).fillColor("#000000");
      doc.text(`Razón Social: ${proveedor?.razonSocial || "N/A"}`);
      doc.text(`Email: ${proveedor?.mail || "N/A"}`);
      if (proveedor?.telefono) {
        doc.text(`Teléfono: ${proveedor.telefono}`);
      }

      // Tabla de insumos confirmados
      if (insumosConfirmados.length > 0) {
        doc.moveDown(1);
        doc.fontSize(12).fillColor("#1565c0").text("INSUMOS CONFIRMADOS");
        doc.fontSize(10).fillColor("#000000").moveDown(0.3);

        // Encabezados
        const tableTop = doc.y;
        const colWidth = 150;
        doc.text("Insumo", 50, tableTop);
        doc.text("Cantidad", 250, tableTop);
        doc.text("Estado", 400, tableTop);

        // Línea
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Datos
        let y = tableTop + 25;
        insumosConfirmados.forEach((insumo) => {
          doc.fontSize(10);

          const cantidad = Number(insumo.cantidadSolicitada);
          const unidad = insumo.unidadMedida || "";

          // Aplicar conversión usando la función auxiliar
          const cantidadMostrada = convertirCantidad(cantidad, unidad);

          doc.text(insumo.nombreInsumo || "N/A", 50, y, { width: 200 });
          doc.text(`${cantidadMostrada} ${unidad}`, 250, y);
          doc.text("✓ Disponible", 400, y);
          y += 25;
        });

        // Resumen
        doc.moveTo(50, y).lineTo(550, y).stroke();
        doc.fontSize(11).fillColor("#1a237e");
        doc.text(
          `Total Confirmados: ${insumosConfirmados.length} insumo(s)`,
          50,
          y + 10,
        );
      }

      // Pie de página
      doc.moveDown(2);
      doc.fontSize(9).fillColor("#666666");
      doc.text(
        "Este documento es una confirmación oficial de disponibilidad de insumos.",
        50,
        doc.y,
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Enviar PDF de confirmación al proveedor por correo
 * @param {string} email - Email del proveedor
 * @param {string} nombreProveedor - Nombre del proveedor
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} numeroPedido - Número del pedido
 * @returns {Promise<void>}
 */
export const enviarPDFConfirmacionMail = async (
  email,
  nombreProveedor,
  pdfBuffer,
  numeroPedido,
  hayInsumosRechazados = false,
) => {
  try {
    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Crear mensaje con información sobre insumos rechazados si los hay
    const mensajeRechazados = hayInsumosRechazados
      ? `<p><strong>Nota:</strong> Algunos insumos no disponibles han sido automáticamente redistribuidos a otros proveedores para asegurar la continuidad del servicio.</p>`
      : "";

    // Enviar correo con PDF
    await transporter.sendMail({
      from: process.env.SMTP_USER || "comedor@escuela.edu",
      to: email,
      subject: `Confirmación de Pedido - ${nombreProveedor}`,
      html: `
        <h2>Confirmación de Pedido</h2>
        <p>Estimado ${nombreProveedor},</p>
        <p>Adjuntamos la confirmación de disponibilidad de insumos para el pedido Nº <strong>${numeroPedido}</strong>.</p>
        <p>En el documento PDF encontrará el detalle de los insumos confirmados.</p>
        ${mensajeRechazados}
        <p>Saludos cordiales,<br><strong>Sistema de Comedor</strong></p>
      `,
      attachments: [
        {
          filename: `confirmacion-pedido-${numeroPedido}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`✅ PDF de confirmación enviado a ${email}`);
  } catch (error) {
    console.error(
      "❌ Error al enviar PDF de confirmación por mail:",
      error.message,
    );
    throw error;
  }
};
