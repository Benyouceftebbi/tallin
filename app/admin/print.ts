import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export async function generateOrdersPDF(orders: any[]) {
  const doc = new jsPDF();

  const startDate = new Date("2025-07-05T00:00:00+01:00");
  const endDate = new Date("2025-07-10T23:59:59+01:00");

  const filtered = orders.filter((order) => {
    const created = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return created >= startDate && created <= endDate;
  });

  const statusCounts: Record<string, number> = {};
  const articleCountsByStatus: Record<string, number> = {};
  const productStatusMap: Record<
    string, // product name
    Record<string, number> // status -> count
  > = {};

  let totalArticles = 0;

  for (const order of filtered) {
    const status = order.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const articles = Array.isArray(order.articles) ? order.articles : [];

    articleCountsByStatus[status] =
      (articleCountsByStatus[status] || 0) + articles.length;
    totalArticles += articles.length;

    for (const article of articles) {
      const name = article.product_name || "Unnamed Product";

      if (!productStatusMap[name]) {
        productStatusMap[name] = {};
      }

      productStatusMap[name][status] =
        (productStatusMap[name][status] || 0) + 1;
    }
  }

  // HEADER & METADATA
  doc.setFontSize(18);
  doc.text("📦 Order Report", 14, 20);
  doc.setFontSize(10);
  doc.text(
    `From ${format(startDate, "dd MMM yyyy")} to ${format(endDate, "dd MMM yyyy")}`,
    14,
    28
  );
  doc.text(`Total Orders: ${filtered.length}`, 14, 34);
  doc.text(`Total Articles: ${totalArticles}`, 14, 40);

  // TABLE: ORDERS BY STATUS
  autoTable(doc, {
    startY: 46,
    head: [["Status", "Number of Orders"]],
    body: Object.entries(statusCounts).map(([status, count]) => [
      status,
      count.toString(),
    ]),
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    styles: { fontSize: 10, halign: "center", cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // TABLE: ARTICLES BY STATUS
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Status", "Number of Articles"]],
    body: Object.entries(articleCountsByStatus).map(([status, count]) => [
      status,
      count.toString(),
    ]),
    headStyles: { fillColor: [241, 196, 15], textColor: 0 },
    styles: { fontSize: 10, halign: "center", cellPadding: 3 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  // ✅ TABLE: ARTICLES BY PRODUCT + STATUS
  const uniqueStatuses = Array.from(
    new Set(
      Object.values(productStatusMap)
        .flatMap((statusMap) => Object.keys(statusMap))
    )
  );

  const articleProductTableBody = Object.entries(productStatusMap).map(
    ([productName, statusMap]) => {
      const row = [productName];

      let rowTotal = 0;
      for (const status of uniqueStatuses) {
        const count = statusMap[status] || 0;
        row.push(count.toString());
        rowTotal += count;
      }

      row.push(rowTotal.toString());
      return row;
    }
  );

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 14,
    head: [["Product Name", ...uniqueStatuses, "Total"]],
    body: articleProductTableBody,
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    styles: { fontSize: 9, halign: "center", cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // ✅ DETAILED ORDERS TABLE
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    head: [["ID", "Status", "Created At", "Articles"]],
    body: filtered.map((order) => {
      const created = order.createdAt?.toDate?.() || new Date(order.createdAt);
      const articleCount = Array.isArray(order.articles)
        ? order.articles.length
        : 0;
      return [
        order.id,
        order.status,
        format(created, "dd MMM yyyy HH:mm"),
        articleCount.toString(),
      ];
    }),
    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save("orders-report.pdf");
}
