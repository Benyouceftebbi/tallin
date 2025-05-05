import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import bwipjs from 'bwip-js/browser';
import { format } from "date-fns";

const generateBarcode = async (trackingId: string): Promise<string> => {
    const canvas = document.createElement('canvas');
  
    try {
     bwipjs.toCanvas(canvas, {
        bcid: 'code128',
        text: trackingId,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
  
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Barcode generation failed:', err);
      throw err;
    }
  };
  export const generateParcelLabel = async (order: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [283.5, 425.2], // 100mm x 150mm
    });
  
    const expeditionDate = format(new Date(), 'dd/MM/yyyy');
    const barcodeImg = await generateBarcode(order.id);
  
    let y = 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Bon de Livraison`, 100, y);
    y += 20;
  
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Commande: ${order.id}`, 10, y += 20);
    doc.text(`Date: ${expeditionDate}`, 10, y += 14);
    doc.text(`Client: ${order.name}`, 10, y += 14);
    doc.text(`Téléphone: ${order.phone}`, 10, y += 14);
  
    doc.setFont(undefined, 'bold');
    doc.text(`Adresse:`, 10, y += 20);
    doc.setFont(undefined, 'normal');
    doc.text(order.address, 10, y += 14);
    doc.text(`Wilaya: ${order.wilaya}`, 10, y += 14);
    doc.text(`Commune: ${order.commune}`, 10, y += 14);
  
    doc.setFont(undefined, 'bold');
    doc.text(`Livraison:`, 10, y += 20);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.deliveryCompany} (${order.deliveryType})`, 80, y);
    if (order.deliveryCenter) doc.text(`Centre: ${order.deliveryCenter}`, 10, y += 14);
  
    autoTable(doc, {
      startY: y + 10,
      margin: { left: 10 },
      styles: { fontSize: 8 },
      head: [['Article', 'Qté', 'Prix']],
      body: order.articles.map((a: any) => [
        a.variant_title,
        a.quantity.toString(),
        `${a.unit_price} DA`,
      ]),
    });
  
    y = doc.lastAutoTable.finalY + 10;
  
    doc.setFont(undefined, 'bold');
    doc.text(`Prix Total:`, 10, y += 20);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.totalPrice}`, 80, y);
  
    doc.setFont(undefined, 'bold');
    doc.text(`Confirmatrice:`, 10, y += 20);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.confirmatrice}`, 100, y);
  
    // Barcode
    doc.addImage(barcodeImg, 'PNG', 10, y += 20, 180, 40);
  
    // Show print dialog instead of downloading
    window.open(doc.output('bloburl'), '_blank')?.print();
  };