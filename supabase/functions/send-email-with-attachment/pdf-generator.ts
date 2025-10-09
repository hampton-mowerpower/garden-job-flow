// PDF Generation with Logo and Quotation T&Cs
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

// Hampton Mowerpower logo as base64 (embedded for PDF generation)
const HAMPTON_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

  // Header with Logo and Company Details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('HAMPTON MOWERPOWER', 15, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Garden Equipment Sales & Service', 15, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.text('87 Ludstone Street, Hampton 3188 | (03) 9598 6741', 15, yPos);
  
  yPos += 4;
  doc.text('hamptonmowerpower@gmail.com | https://www.hamptonmowerpower.com.au', 15, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'bold');
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

  // Quotation Terms & Conditions (only for quotations)
  if (isQuotation) {
    yPos += 10;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Quotation Terms and Conditions', 15, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    const termsText = [
      { title: '1. Non-Refundable Fee', content: 'The quotation fee is non-refundable under all circumstances. This fee covers the time, labour, and technical expertise required to inspect and assess the machine.' },
      { title: '2. Deduction Policy', content: 'If the customer proceeds with the repair, the quotation fee will be deducted from the final repair cost once the job is approved and completed.' },
      { title: '3. Quotation Estimate', content: 'All quotations are provided as an estimate only, based on the initial inspection and diagnosis. Additional faults, labour, or replacement parts may be identified during the repair process. As such, the quoted amount is subject to variation and is not a fixed or guaranteed price. Any change in cost will be communicated to the customer before additional work is undertaken.' },
      { title: '4. Machine Assessment', content: 'To provide an accurate quotation, it may be necessary to partially or fully disassemble the machine for inspection, assessment, and diagnosis. The customer acknowledges that such disassembly may render the machine temporarily inoperable.' },
      { title: '5. Reassembly Fee', content: 'If the customer chooses not to proceed with the repair and requests that the machine be reassembled, an additional labour fee may apply to cover the reassembly process.' },
      { title: '6. Limitation of Liability', content: 'Hampton Mowerpower shall not be liable for any loss, damage, or delay arising from unforeseen circumstances, parts availability, or decisions made by the customer not to proceed with the repair.' },
      { title: '7. Customer Acknowledgement', content: 'By accepting this quotation, the customer acknowledges that they have read, understood, and agreed to the above terms and conditions, and authorise Hampton Mowerpower to perform the diagnostic and repair work as outlined.' }
    ];
    
    for (const term of termsText) {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(term.title, 15, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(term.content, 180);
      doc.text(contentLines, 15, yPos);
      yPos += (contentLines.length * 4) + 6;
    }
    
    // Disclaimer
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Disclaimer:', 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text('All prices include GST unless otherwise stated.', 15, yPos);
    yPos += 4;
    const disclaimerLines = doc.splitTextToSize('Hampton Mowerpower reserves the right to revise quotations in the event of unforeseen circumstances, additional labour, or replacement parts required to safely and effectively complete the repair.', 180);
    doc.text(disclaimerLines, 15, yPos);
  }

  // Footer (on last page)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for your business!', 105, 285, { align: 'center' });
    doc.text(
      isQuotation
        ? 'This quotation is valid for 30 days.'
        : 'Payment is due upon collection.',
      105,
      289,
      { align: 'center' }
    );
  }

  // Generate PDF as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
