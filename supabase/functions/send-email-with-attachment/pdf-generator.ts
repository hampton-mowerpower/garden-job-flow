// Simplified PDF Generation using jsPDF
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

interface JobData {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerAddress: string;
  companyName?: string;
  companyAbn?: string;
  machineBrand: string;
  machineModel: string;
  machineSerial?: string;
  machineCategory?: string;
  status: string;
  grandTotal: number;
  serviceDeposit: number;
  balanceDue: number;
  parts?: any[];
  labourHours: number;
  labourRate: number;
  gst: number;
  transportTotalCharge?: number;
  transportBreakdown?: string;
  sharpenTotalCharge?: number;
  sharpenBreakdown?: string;
  smallRepairTotal?: number;
  smallRepairDetails?: string;
  problemDescription?: string;
  additionalNotes?: string;
  requestedFinishDate?: string;
}

export async function generateInvoicePDF(
  jobData: JobData,
  jobNumber: string,
  isQuotation: boolean
): Promise<Uint8Array> {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const date = new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const title = isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('HAMPTON MOWERPOWER', 15, yPos);
  
  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('87 Ludstone Street, Hampton VIC 3188, Australia', 15, yPos);
  yPos += 4;
  doc.text('Phone: 03-9598-6741 | Email: hamptonmowerpower@gmail.com', 15, yPos);
  yPos += 4;
  doc.text('ABN: 97 161 289 069', 15, yPos);
  
  // Document Title (right side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 200, 20, { align: 'right' });
  
  // Document Info (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${isQuotation ? 'Quote' : 'Invoice'} #: ${jobNumber}`, 200, 30, { align: 'right' });
  doc.text(`Date: ${date}`, 200, 36, { align: 'right' });
  doc.text(`Work Order: ${jobNumber}`, 200, 42, { align: 'right' });
  
  yPos = 55;

  // Customer Info (left side)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 15, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(jobData.customerName, 15, yPos + 6);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  
  if (jobData.companyName) {
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    doc.text(jobData.companyName, 15, yPos);
    doc.setFont('helvetica', 'normal');
  }
  
  if (jobData.companyAbn) {
    yPos += 5;
    doc.text(`ABN: ${jobData.companyAbn}`, 15, yPos);
  }
  
  yPos += 5;
  doc.text(jobData.customerAddress, 15, yPos);
  yPos += 5;
  doc.text(jobData.customerPhone, 15, yPos);
  
  if (jobData.customerEmail) {
    yPos += 5;
    doc.text(jobData.customerEmail, 15, yPos);
  }

  // Equipment Info (right side)
  let equipmentY = 61;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPMENT DETAILS', 120, equipmentY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  equipmentY += 6;
  doc.text(`Category: ${jobData.machineCategory || 'N/A'}`, 120, equipmentY);
  equipmentY += 5;
  doc.text(`Brand/Make: ${jobData.machineBrand}`, 120, equipmentY);
  equipmentY += 5;
  doc.text(`Model: ${jobData.machineModel}`, 120, equipmentY);
  
  if (jobData.machineSerial) {
    equipmentY += 5;
    doc.text(`Serial: ${jobData.machineSerial}`, 120, equipmentY);
  }

  yPos = Math.max(yPos, equipmentY) + 15;

  // Problem Description
  if (jobData.problemDescription) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER CONCERN', 15, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(jobData.problemDescription, 180);
    doc.text(lines, 15, yPos);
    yPos += (lines.length * 5) + 5;
  }

  // Additional Notes
  if (jobData.additionalNotes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ADDITIONAL NOTES', 15, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(jobData.additionalNotes, 180);
    doc.text(lines, 15, yPos);
    yPos += (lines.length * 5) + 5;
  }

  yPos += 5;

  // Line Items Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPos - 5, 180, 7, 'F');
  
  doc.text('TYPE', 17, yPos);
  doc.text('DESCRIPTION', 45, yPos);
  doc.text('QTY', 135, yPos, { align: 'right' });
  doc.text('UNIT PRICE', 155, yPos, { align: 'right' });
  doc.text('LINE GST', 170, yPos, { align: 'right' });
  doc.text('TOTAL', 193, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  
  let subtotalExGST = 0;

  // Add Parts
  if (jobData.parts && jobData.parts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 248, 248);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.text('PARTS', 17, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');

    jobData.parts.forEach((part: any) => {
      const unitExGST = part.unitPrice / 1.1;
      const lineTotal = unitExGST * part.quantity;
      const lineGST = lineTotal * 0.1;
      subtotalExGST += lineTotal;

      doc.text('Parts', 17, yPos);
      const descLines = doc.splitTextToSize(part.description || 'Part', 80);
      doc.text(descLines, 45, yPos);
      doc.text(part.quantity.toString(), 135, yPos, { align: 'right' });
      doc.text(`$${unitExGST.toFixed(2)}`, 155, yPos, { align: 'right' });
      doc.text(`$${lineGST.toFixed(2)}`, 170, yPos, { align: 'right' });
      doc.text(`$${lineTotal.toFixed(2)}`, 193, yPos, { align: 'right' });
      
      yPos += Math.max(5, descLines.length * 5);
    });
    
    yPos += 2;
  }

  // Add Labour
  if (jobData.labourHours > 0) {
    const labourExGST = (jobData.labourHours * jobData.labourRate) / 1.1;
    const labourGST = labourExGST * 0.1;
    subtotalExGST += labourExGST;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 248, 248);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.text('LABOUR', 17, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');

    doc.text('Labour', 17, yPos);
    doc.text('Service & Repair Work', 45, yPos);
    doc.text(jobData.labourHours.toFixed(2), 135, yPos, { align: 'right' });
    doc.text(`$${(jobData.labourRate / 1.1).toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.text(`$${labourGST.toFixed(2)}`, 170, yPos, { align: 'right' });
    doc.text(`$${labourExGST.toFixed(2)}`, 193, yPos, { align: 'right' });
    
    yPos += 7;
  }

  // Add other sections (Transport, Sharpen, Small Repair) if present
  if (jobData.transportTotalCharge && jobData.transportTotalCharge > 0) {
    const transportExGST = jobData.transportTotalCharge / 1.1;
    const transportGST = transportExGST * 0.1;
    subtotalExGST += transportExGST;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 248, 248);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.text('TRANSPORT', 17, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');

    doc.text('Transport', 17, yPos);
    doc.text(jobData.transportBreakdown || 'Pick-up & Delivery', 45, yPos);
    doc.text('1', 135, yPos, { align: 'right' });
    doc.text(`$${transportExGST.toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.text(`$${transportGST.toFixed(2)}`, 170, yPos, { align: 'right' });
    doc.text(`$${transportExGST.toFixed(2)}`, 193, yPos, { align: 'right' });
    
    yPos += 7;
  }

  if (jobData.sharpenTotalCharge && jobData.sharpenTotalCharge > 0) {
    const sharpenExGST = jobData.sharpenTotalCharge / 1.1;
    const sharpenGST = sharpenExGST * 0.1;
    subtotalExGST += sharpenExGST;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 248, 248);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.text('SHARPEN', 17, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');

    doc.text('Sharpen', 17, yPos);
    doc.text(jobData.sharpenBreakdown || 'Blade Sharpening', 45, yPos);
    doc.text('1', 135, yPos, { align: 'right' });
    doc.text(`$${sharpenExGST.toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.text(`$${sharpenGST.toFixed(2)}`, 170, yPos, { align: 'right' });
    doc.text(`$${sharpenExGST.toFixed(2)}`, 193, yPos, { align: 'right' });
    
    yPos += 7;
  }

  if (jobData.smallRepairTotal && jobData.smallRepairTotal > 0) {
    const repairExGST = jobData.smallRepairTotal / 1.1;
    const repairGST = repairExGST * 0.1;
    subtotalExGST += repairExGST;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(248, 248, 248);
    doc.rect(15, yPos - 4, 180, 6, 'F');
    doc.text('SMALL REPAIR', 17, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');

    doc.text('Small Repair', 17, yPos);
    doc.text(jobData.smallRepairDetails || 'Small Repair Work', 45, yPos);
    doc.text('1', 135, yPos, { align: 'right' });
    doc.text(`$${repairExGST.toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.text(`$${repairGST.toFixed(2)}`, 170, yPos, { align: 'right' });
    doc.text(`$${repairExGST.toFixed(2)}`, 193, yPos, { align: 'right' });
    
    yPos += 7;
  }

  yPos += 10;

  // Totals section
  const totalsX = 140;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal (ex GST):', totalsX, yPos);
  doc.text(`$${subtotalExGST.toFixed(2)}`, 193, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('GST (10%):', totalsX, yPos);
  doc.text(`$${jobData.gst.toFixed(2)}`, 193, yPos, { align: 'right' });
  yPos += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total (inc. GST):', totalsX, yPos);
  doc.text(`$${jobData.grandTotal.toFixed(2)}`, 193, yPos, { align: 'right' });
  yPos += 8;
  
  if (!isQuotation && jobData.serviceDeposit > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Deposit Paid:', totalsX, yPos);
    doc.text(`-$${jobData.serviceDeposit.toFixed(2)}`, 193, yPos, { align: 'right' });
    yPos += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', totalsX, yPos);
    doc.text(`$${jobData.balanceDue.toFixed(2)}`, 193, yPos, { align: 'right' });
  }

  // Footer
  yPos = 270;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(9);
  doc.text(
    isQuotation
      ? 'This quotation is valid for 30 days.'
      : 'Payment is due upon collection.',
    105,
    yPos,
    { align: 'center' }
  );

  // Generate PDF as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
