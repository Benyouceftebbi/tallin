import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import autoTable from "jspdf-autotable";

export const generatePDF = ({
  productName,
  options,
  variantCombinations,
}: {
  productName: string;
  options: Array<{
    name: string;
    values: string[];
  }>;
  variantCombinations: Array<{
    option1: string;
    option2: string;
    depots: Array<{
      quantity: number;
    }>;
  }>;
}) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const currentDate = format(new Date(), "dd/MM/yyyy");

  // Detect size vs color from option names based on value length
  const [opt1, opt2] = options;
  const avgLen = (vals: string[]) =>
    vals.reduce((sum, val) => sum + val.length, 0) / vals.length;

  const sizeOption = avgLen(opt1.values) <= avgLen(opt2.values) ? opt1 : opt2;
  const colorOption = sizeOption === opt1 ? opt2 : opt1;

  const sizes = sizeOption.values;
  const colors = colorOption.values;

  // 🔢 Build quantity map
  const quantityMap: Record<string, number> = {};

  variantCombinations.forEach((v) => {
    const o1 = v.option1;
    const o2 = v.option2;

    const isSize = (str: string) => str.length <= 3;
    const size = isSize(o1) ? o1 : o2;
    const color = isSize(o1) ? o2 : o1;

    const key = `${color}__${size}`;
    quantityMap[key] = v.depots?.[0]?.quantity ?? 0;
  });

  // 🖨 Header
  let y = 40;
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(`Fiche d'inventaire – ${productName}`, 40, y);

  y += 25;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Date : ${currentDate}`, 40, y);

  // 🧾 Table content
  const headers = [["Couleur", ...sizes, "Note"]];

  const body = colors.map((color) => {
    const row = [color];
    sizes.forEach((size) => {
      const key = `${color}__${size}`;
      const qty = quantityMap[key] ?? "";
      row.push(qty.toString());
    });
    row.push(""); // Note column
    return row;
  });

  autoTable(doc, {
    startY: y + 30,
    head: headers,
    body,
    margin: { left: 40, right: 40 },
    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 6,
      lineWidth: 0.2,
      lineColor: 160,
    },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 100 },
      [sizes.length + 1]: { cellWidth: 100 },
    },
  });

  window.open(doc.output("bloburl"), "_blank")?.print();
};