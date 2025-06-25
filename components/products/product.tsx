import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import autoTable from "jspdf-autotable";
export const generatePDF = (product: {
  name: string;

  option1: string;
  option2:string;
  variants:any[];
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const currentDate = format(product.date ?? new Date(), "dd/MM/yyyy");

  let y = 30;
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Fiche de Contrôle d'Inventaire", 160, y);

  y += 30;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Produit : ${product.name}`, 40, y);
  doc.text(`Date : ${currentDate}`, 400, y);


  // 📊 Table with note column empty
  const headers = [[product.option1,product.option2, "Quantité", "Note"]];
  const body = product.variants.map((v) => [
    v.option1,
    v.option2,
    v.depots[0].quantity.toString(),
    "", // Empty note field
  ]);

  autoTable(doc, {
    startY: y + 30,
    margin: { left: 40, right: 40 },
    head: headers,
    body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  // Print instead of download
  window.open(doc.output("bloburl"), "_blank")?.print();
};