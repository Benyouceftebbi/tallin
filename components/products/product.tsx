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

  let y = 30;
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Fiche de Contrôle d'Inventaire", 160, y);

  y += 30;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Produit : ${product.name}`, 40, y);
  doc.text(`Date : ${currentDate}`, 400, y);

  const headers = [["Couleur", "Taille", "Quantité", "Note"]];

  // Extract and tag color vs other
  const variantsWithColorSplit = product.variants.map((v) => {
    const isColorOption1 = product.option1.toLowerCase().includes("couleur") || product.option1.toLowerCase().includes("color");
    return {
      color: isColorOption1 ? v.option1 : v.option2,
      other: isColorOption1 ? v.option2 : v.option1,
      quantity: v.depots?.[0]?.quantity ?? 0,
    };
  });

  // Sort by color name
  const sortedVariants = variantsWithColorSplit.sort((a, b) =>
    a.color.localeCompare(b.color, "fr", { sensitivity: "base" })
  );

  const body = sortedVariants.map((v) => [
    v.color || "-",
    v.other || "-",
    v.quantity.toString(),
    "",
  ]);

  autoTable(doc, {
    startY: y + 30,
    margin: { left: 40, right: 40 },
    head: headers,
    body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  window.open(doc.output("bloburl"), "_blank")?.print();
};