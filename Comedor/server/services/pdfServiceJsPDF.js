import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EscuelaService } from "./escuelaService.js";

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
 * Generar PDF del pedido usando jsPDF
 */
export const generarPDFPedidoJsPDF = async (pedido, detalles) => {
  try {
    console.log("🔄 Generando PDF con jsPDF...");
    console.log("- Pedido:", pedido.id_pedido);
    console.log("- Detalles:", detalles?.length || 0, "items");

    // Obtener datos de la escuela
    const datosEscuela = await EscuelaService.getDatosEscuela();
    console.log("- Datos escuela:", datosEscuela);

    // Crear nuevo documento PDF
    const doc = new jsPDF();

    // === ENCABEZADO ===
    doc.setFontSize(20);
    doc.setTextColor(26, 35, 126); // Color azul
    doc.text(datosEscuela.nombre || "SISTEMA DE COMEDOR ESCOLAR", 105, 20, {
      align: "center",
    });

    // Información de la escuela
    doc.setFontSize(10);
    doc.setTextColor(66, 66, 66); // Color gris
    let yPos = 35;

    if (datosEscuela.direccion) {
      doc.text(`Dirección: ${datosEscuela.direccion}`, 105, yPos, {
        align: "center",
      });
      yPos += 5;
    }

    let contactInfo = "";
    if (datosEscuela.telefono) contactInfo += `Tel: ${datosEscuela.telefono}`;
    if (datosEscuela.email) {
      if (contactInfo) contactInfo += " | ";
      contactInfo += `Email: ${datosEscuela.email}`;
    }
    if (contactInfo) {
      doc.text(contactInfo, 105, yPos, { align: "center" });
      yPos += 15;
    }

    // === TÍTULO DEL DOCUMENTO ===
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PEDIDO DE INSUMOS", 105, yPos, { align: "center" });
    yPos += 15;

    // === INFORMACIÓN DEL PEDIDO ===
    doc.setFontSize(10);

    // Cuadro de información del pedido
    const infoY = yPos;
    doc.rect(15, infoY, 180, 25);

    // Columna izquierda
    doc.text("Número de Pedido:", 20, infoY + 8);
    doc.setFont(undefined, "bold");
    doc.text(pedido.id_pedido, 20, infoY + 15);
    doc.setFont(undefined, "normal");

    // Columna derecha
    doc.text("Fecha de Emisión:", 120, infoY + 8);
    doc.setFont(undefined, "bold");
    const fechaEmision = new Date(pedido.fechaEmision).toLocaleDateString(
      "es-ES",
    );
    doc.text(fechaEmision, 120, infoY + 15);
    doc.setFont(undefined, "normal");

    yPos += 35;

    // === INFORMACIÓN DEL PROVEEDOR ===
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("PROVEEDOR", 15, yPos);
    doc.setFont(undefined, "normal");
    yPos += 8;

    doc.setFontSize(10);
    doc.text(
      `Razón Social: ${pedido.nombreProveedor || "No especificado"}`,
      15,
      yPos,
    );
    yPos += 5;

    if (pedido.cuitProveedor) {
      doc.text(`CUIT: ${pedido.cuitProveedor}`, 15, yPos);
      yPos += 5;
    }

    if (pedido.direccionProveedor) {
      doc.text(`Dirección: ${pedido.direccionProveedor}`, 15, yPos);
      yPos += 5;
    }

    if (pedido.telefonoProveedor) {
      doc.text(`Teléfono: ${pedido.telefonoProveedor}`, 15, yPos);
      yPos += 5;
    }

    if (pedido.emailProveedor) {
      doc.text(`Email: ${pedido.emailProveedor}`, 15, yPos);
      yPos += 5;
    }

    yPos += 10;

    // === TABLA DE PRODUCTOS ===
    if (detalles && detalles.length > 0) {
      const tableColumns = [
        "Código",
        "Producto",
        "Unidad",
        "Cantidad Solicitada",
      ];

      const tableRows = detalles.map((item) => [
        item.codigoInsumo || `INS-${String(item.id_insumo).padStart(4, "0")}`,
        item.nombreInsumo || "Producto",
        item.unidadMedida || "UN",
        `${convertirCantidad(
          item.cantidad || item.cantidadSolicitada || 0,
          item.unidadMedida,
        )}`,
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: yPos,
        margin: { left: 15, right: 15 },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [26, 35, 126],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Código
          1: { cellWidth: 90 }, // Producto
          2: { cellWidth: 30 }, // Unidad
          3: { cellWidth: 40, halign: "center" }, // Cantidad
        },
        didDrawPage: (data) => {
          yPos = data.cursor.y;
        },
      });

      // Información adicional
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Total de productos: ${detalles.length}`, 15, yPos);
    } else {
      doc.setFontSize(10);
      doc.text("No hay detalles disponibles para este pedido.", 15, yPos);
    }

    // === PIE DE PÁGINA ===
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Este documento fue generado automáticamente por el Sistema de Comedor Escolar",
      105,
      pageHeight - 20,
      { align: "center" },
    );
    doc.text(
      `Generado el: ${new Date().toLocaleString("es-ES")}`,
      105,
      pageHeight - 15,
      { align: "center" },
    );

    // Convertir a buffer
    const pdfBytes = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(pdfBytes);

    console.log(
      "✅ PDF generado exitosamente. Tamaño:",
      pdfBuffer.length,
      "bytes",
    );

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generando PDF con jsPDF:", error);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
};

// Mantener la función original como fallback
export const generarPDFPedido = generarPDFPedidoJsPDF;
