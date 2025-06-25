import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import autoTable from "jspdf-autotable";

export const generatePDF = (product: {
  name: string;
  option1: string;
  option2: string;
  variants: any[];
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const currentDate = format(new Date(), "dd/MM/yyyy");

  // 📋 Header
  let y = 40;
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Fiche de Contrôle d'Inventaire", 150, y);

  y += 30;
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(`Produit : ${product.name}`, 40, y);
  doc.text(`Date : ${currentDate}`, 400, y);

  // 🧠 Detect color field (option1 or option2)
  const isColorOption1 =
    product.option1.toLowerCase().includes("couleur") ||
    product.option1.toLowerCase().includes("color");

  const variantsWithColorSplit = product.variants.map((v) => ({
    color: isColorOption1 ? v.option1 : v.option2,
    other: isColorOption1 ? v.option2 : v.option1,
    quantity: v.depots?.[0]?.quantity ?? 0,
  }));

  // 🧹 Sort by color alphabetically
  const sortedVariants = variantsWithColorSplit.sort((a, b) =>
    a.color.localeCompare(b.color, "fr", { sensitivity: "base" })
  );

  // ✍️ Group color only once per section
  let lastColor = "";
  const body = sortedVariants.map((v) => {
    const colorDisplay = v.color === lastColor ? "" : v.color;
    lastColor = v.color;
    return [colorDisplay, v.other, v.quantity.toString(), ""];
  });

  // 🎨 Table
  autoTable(doc, {
    startY: y + 40,
    margin: { left: 40, right: 40 },
    head: [["Couleur", "Taille", "Quantité", "Note"]],
    body,
    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      lineWidth: 0.2,
      lineColor: 180,
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 120},  // Couleur
      1: { cellWidth: 120 },  // Option
      2: { cellWidth: 60 },  // Quantité
      3: { cellWidth: "auto" }, // Note: let it stretch
    },
    tableLineWidth: 0.1,
    tableLineColor: 160,
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // 🖨 Print preview
  window.open(doc.output("bloburl"), "_blank")?.print();
};