import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";



export const generateRuptureReport = (orders: any[]) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const currentDate = format(new Date(), "dd/MM/yyyy");

  let y = 40;
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Liste de Réapprovisionnement", 160, y);

  y += 30;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Date : ${currentDate}`, 40, y);

  const ruptureMap = new Map<string, {
    product_name: string;
    color: string;
    size: string;
    quantity: number;
  }>();

  orders.forEach((order) => {
    order.articles.forEach((article: any) => {
   
        const vOptions = article.variant_options || {};
        let o1 = vOptions.option1 ?? "-";
        let o2 = vOptions.option2 ?? "-";

        const isSize = (s: string) => typeof s === "string" && s.length > 0 && s.length <= 3;

        let color = isSize(o1) ? o2 : o1;
        let size = isSize(o1) ? o1 : o2;

        const key = `${article.product_name}__${color}__${size}`;

        if (!ruptureMap.has(key)) {
          ruptureMap.set(key, {
            product_name: article.product_name,
            color,
            size,
            quantity: article.quantity,
          });
        } else {
          const existing = ruptureMap.get(key)!;
          existing.quantity += article.quantity;
        }
      
    });
  });

  const ruptures = Array.from(ruptureMap.values()).sort((a, b) => {
    const keyA = `${a.product_name}-${a.color}-${a.size}`;
    const keyB = `${b.product_name}-${b.color}-${b.size}`;
    return keyA.localeCompare(keyB, "fr", { sensitivity: "base" });
  });

  const headers = [["Article", "Couleur", "Taille", "Qté à remplir", "Note"]];

  const body = ruptures.map((item) => [
    item.product_name,
    item.color,
    item.size,
    item.quantity.toString(),
    "",
  ]);

  autoTable(doc, {
    startY: y + 30,
    margin: { left: 40, right: 40 },
    head: headers,
    body,
    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      lineWidth: 0.2,
      lineColor: 160,
    },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 80 },   // Couleur
      2: { cellWidth: 60 },   // Taille
      3: { cellWidth: 60 },   // Qté
      4: { cellWidth: "auto" }, // Note
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  window.open(doc.output("bloburl"), "_blank")?.print();
};