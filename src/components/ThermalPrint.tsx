import React from 'react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';

interface ThermalPrintProps {
  job: Job;
  type: 'service-label' | 'collection-receipt';
  width?: 80 | 58; // mm
}

export const printThermal = async (props: ThermalPrintProps): Promise<void> => {
  const { job, type, width = 80 } = props;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  const html = type === 'service-label' 
    ? generateServiceLabelHTML(job, width)
    : generateCollectionReceiptHTML(job, width);

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Non-blocking: Print immediately without waiting
  setTimeout(() => {
    try {
      printWindow.print();
      // Auto-close after printing
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 500);
    } catch (error) {
      console.error('Print error:', error);
      printWindow.close();
    }
  }, 300);
};

const generateServiceLabelHTML = (job: Job, width: number): string => {
  const partsRequired = job.parts
    .filter(part => part.partName && part.partName.trim() !== '' && part.quantity > 0)
    .map(part => `${part.partName.trim()} × ${part.quantity || 1}`)
    .join(', ') || 'N/A';

  const workRequested = job.problemDescription.length > 60 
    ? job.problemDescription.substring(0, 57) + '...' 
    : job.problemDescription;

  const quotationText = job.quotationAmount && job.quotationAmount > 0
    ? `⚠️ QUOTATION REQUESTED: ${formatCurrency(job.quotationAmount)}`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Label - ${job.jobNumber}</title>
  <style>
    @page {
      size: ${width}mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      width: ${width}mm;
      padding: 2mm 1mm;
      font-size: ${width === 80 ? '11pt' : '9pt'};
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .header {
      text-align: center;
      font-weight: bold;
      margin-bottom: 3mm;
      font-size: ${width === 80 ? '13pt' : '11pt'};
    }
    .abn {
      text-align: center;
      font-size: ${width === 80 ? '9pt' : '8pt'};
      margin-bottom: 3mm;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 80 ? '20pt' : '16pt'};
      font-weight: bold;
      margin: 3mm 0;
      letter-spacing: 2px;
    }
    .section {
      margin: 2mm 0;
      border-top: 1px dashed #000;
      padding-top: 2mm;
    }
    .label {
      font-weight: bold;
      display: inline-block;
      width: ${width === 80 ? '30mm' : '22mm'};
      vertical-align: top;
    }
    .value {
      display: inline-block;
      max-width: ${width === 80 ? '45mm' : '32mm'};
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .quotation-alert {
      background: #000;
      color: #fff;
      text-align: center;
      padding: 2mm;
      margin: 3mm 0;
      font-weight: bold;
      font-size: ${width === 80 ? '12pt' : '10pt'};
    }
    .cut-line {
      text-align: center;
      margin-top: 5mm;
      font-size: 8pt;
    }
  </style>
</head>
<body>
  <div class="header">HAMPTON MOWERPOWER</div>
  <div class="abn">ABN 97 161 289 069</div>
  
  <div class="job-id">${escapeHtml(job.jobNumber)}</div>
  
  <div class="section">
    <div><span class="label">Customer:</span> <span class="value">${escapeHtml(job.customer.name)}</span></div>
    <div><span class="label">Phone:</span> <span class="value">${escapeHtml(job.customer.phone)}</span></div>
  </div>
  
  <div class="section">
    <div><span class="label">Machine:</span> <span class="value">${escapeHtml(job.machineCategory)}</span></div>
    <div><span class="label">Brand:</span> <span class="value">${escapeHtml(job.machineBrand)}</span></div>
    <div><span class="label">Model:</span> <span class="value">${escapeHtml(job.machineModel)}</span></div>
    ${job.machineSerial ? `<div><span class="label">Serial:</span> <span class="value">${escapeHtml(job.machineSerial)}</span></div>` : ''}
  </div>
  
  <div class="section">
    <div><span class="label">Work:</span> <span class="value">${escapeHtml(workRequested)}</span></div>
  </div>
  
  ${job.servicePerformed ? `
  <div class="section">
    <div><span class="label">Notes:</span> <span class="value">${escapeHtml(job.servicePerformed)}</span></div>
  </div>
  ` : ''}
  
  ${partsRequired !== 'N/A' ? `
  <div class="section">
    <div><span class="label">Parts:</span> <span class="value">${escapeHtml(partsRequired)}</span></div>
  </div>
  ` : ''}
  
  ${quotationText ? `
  <div class="quotation-alert">${escapeHtml(quotationText)}</div>
  ` : ''}
  
  <div class="section">
    <div><span class="label">Date:</span> <span class="value">${format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm')}</span></div>
    <div><span class="label">Tech:</span> <span class="value">______</span></div>
  </div>
  
  <div class="cut-line">✂ -------------------------------- ✂</div>
</body>
</html>
`;
};

const generateCollectionReceiptHTML = (job: Job, width: number): string => {
  const amountPaid = job.serviceDeposit || 0;
  const balanceDue = Math.max(0, job.grandTotal - amountPaid);
  const isPaid = balanceDue === 0;

  const itemsLines = [
    ...job.parts.map(p => `${p.partName} x${p.quantity}`),
    job.labourHours > 0 ? `Labour (${job.labourHours}h)` : null
  ].filter(Boolean).slice(0, 10);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Collection Receipt - ${job.jobNumber}</title>
  <style>
    @page {
      size: ${width}mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      width: ${width}mm;
      padding: 2mm 1mm;
      font-size: ${width === 80 ? '11pt' : '9pt'};
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .header {
      text-align: center;
      font-weight: bold;
      margin-bottom: 2mm;
      font-size: ${width === 80 ? '14pt' : '12pt'};
    }
    .subheader {
      text-align: center;
      font-size: ${width === 80 ? '9pt' : '8pt'};
      margin-bottom: 3mm;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 80 ? '18pt' : '14pt'};
      font-weight: bold;
      margin: 2mm 0;
    }
    .section {
      margin: 2mm 0;
      border-top: 1px dashed #000;
      padding-top: 2mm;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 1mm 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .bold {
      font-weight: bold;
    }
    .items {
      font-size: ${width === 80 ? '9pt' : '8pt'};
    }
    .total-row {
      font-size: ${width === 80 ? '13pt' : '11pt'};
      font-weight: bold;
      margin-top: 2mm;
    }
    .paid-stamp {
      text-align: center;
      font-size: ${width === 80 ? '16pt' : '14pt'};
      font-weight: bold;
      margin: 3mm 0;
      padding: 2mm;
      border: 3px double #000;
    }
    .footer {
      text-align: left;
      margin-top: 5mm;
      font-size: ${width === 80 ? '8pt' : '7pt'};
      line-height: 1.4;
    }
    .shop-info {
      text-align: center;
      font-weight: bold;
      margin-bottom: 2mm;
      font-size: ${width === 80 ? '9pt' : '8pt'};
    }
    .conditions {
      font-size: ${width === 80 ? '7pt' : '6pt'};
      line-height: 1.3;
      margin-top: 2mm;
    }
    .cut-line {
      text-align: center;
      margin-top: 5mm;
      font-size: 8pt;
    }
  </style>
</head>
<body>
  <div class="header">HAMPTON MOWERPOWER</div>
  <div class="subheader">COLLECTION RECEIPT</div>
  <div class="subheader">ABN 97 161 289 069 | 03-9598-6741</div>
  
  <div class="job-id">${escapeHtml(job.jobNumber)}</div>
  
  <div class="section">
    <div class="bold">${escapeHtml(job.customer.name)}</div>
    <div>${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}</div>
  </div>
  
  ${itemsLines.length > 0 ? `
  <div class="section items">
    <div class="bold">Items/Services:</div>
    ${itemsLines.map(line => `<div>• ${escapeHtml(line || '')}</div>`).join('\n    ')}
  </div>
  ` : ''}
  
  <div class="section">
    <div class="row">
      <span>Subtotal:</span>
      <span>${formatCurrency(job.subtotal)}</span>
    </div>
    ${job.discountValue && job.discountValue > 0 ? `
    <div class="row">
      <span>Discount ${job.discountType === 'PERCENT' ? `(${job.discountValue}%)` : ''}:</span>
      <span>-${formatCurrency(job.discountType === 'PERCENT' ? job.subtotal * (job.discountValue / 100) : job.discountValue)}</span>
    </div>
    ` : ''}
    <div class="row">
      <span>GST (10%):</span>
      <span>${formatCurrency(job.gst)}</span>
    </div>
    <div class="row bold">
      <span>Total:</span>
      <span>${formatCurrency(job.grandTotal)}</span>
    </div>
    ${amountPaid > 0 ? `
    <div class="row">
      <span>Deposit Paid:</span>
      <span>-${formatCurrency(amountPaid)}</span>
    </div>
    ` : ''}
    <div class="row total-row">
      <span>Balance Due:</span>
      <span>${formatCurrency(balanceDue)}</span>
    </div>
  </div>
  
  ${isPaid ? `
  <div class="paid-stamp">✓ PAID IN FULL</div>
  ` : ''}
  
  <div class="section">
    <div>${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
  </div>
  
  <div class="footer">
    <div class="shop-info">
      HAMPTON MOWERPOWER<br>
      A.B.N. 97 161 289 069<br>
      GARDEN EQUIPMENT SALES & SERVICE<br>
      87 Ludstone Street, Hampton 3188<br>
      Phone: 03 9598 6741   Fax: 03 9521 9581<br>
      www.hamptonmowerpower.com.au
    </div>
    <div class="conditions">
      <strong>REPAIR CONTRACT CONDITIONS</strong><br>
      1. Please carry out at my cost any work and supply any parts and materials necessary to repair the problem(s) listed above.<br>
      2. The owner or his agent is requested to make any claim for faulty workmanship or detective materials within fourteen (14) days of notification that the repair job has been delivered or completed.<br>
      3. Acceptance of goods for repairs or quotation is subject to the conditions of the disposal of Uncollected Goods Act 1961. The act confers on the repair agent the right of sale after an interval or not less than one month from the date on which the goods are ready for re-delivery or the date on which the owner is informed.
    </div>
  </div>
  
  <div class="cut-line">✂ -------------------------------- ✂</div>
</body>
</html>
`;
};

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text || '').replace(/[&<>"']/g, m => map[m]);
}
