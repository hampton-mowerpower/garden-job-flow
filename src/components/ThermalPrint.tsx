import React from 'react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import hamptonQRCode from '@/assets/hampton-qr-code.png';

interface ThermalPrintProps {
  job: Job;
  type: 'service-label' | 'collection-receipt';
  width?: 79 | 58;
}

export const printThermal = async (props: ThermalPrintProps): Promise<void> => {
  const { job, type, width = 79 } = props;

  // Convert QR code to base64 for embedding
  const getQRCodeBase64 = async (): Promise<string> => {
    try {
      const response = await fetch(hamptonQRCode);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading QR code:', error);
      return '';
    }
  };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  const html = type === 'service-label' 
    ? await generateServiceLabelHTML(job, width)
    : await generateCollectionReceiptHTML(job, width, await getQRCodeBase64());

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    try {
      printWindow.print();
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

const generateServiceLabelHTML = async (job: Job, width: number): Promise<string> => {
  const partsRequired = job.parts
    .filter(part => part.partName && part.partName.trim() !== '' && part.quantity > 0)
    .map(part => `${part.partName.trim()} × ${part.quantity || 1}`)
    .join(', ') || 'N/A';

  const quotationText = job.quotationAmount && job.quotationAmount > 0
    ? `QUOTATION REQUESTED: ${formatCurrency(job.quotationAmount)}`
    : '';

  // Calculate safe content width (printable area for TM-T82II)
  const safeWidth = width === 79 ? 72 : 54;

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
      max-width: ${safeWidth}mm;
      padding: 3.5mm ${width === 79 ? '3.5mm' : '2mm'};
      font-size: ${width === 79 ? '12px' : '10px'};
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 700;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 4mm;
      font-size: ${width === 79 ? '16px' : '13px'};
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .abn {
      text-align: center;
      font-size: ${width === 79 ? '10px' : '9px'};
      margin-bottom: 4mm;
      font-weight: 700;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 79 ? '24px' : '20px'};
      font-weight: 900;
      margin: 4mm 0;
      letter-spacing: 3px;
      background: #000;
      color: #fff;
      padding: 4mm;
      border: 3px solid #000;
    }
    .section {
      margin: 3mm 0;
      border-top: 2px solid #000;
      padding-top: 3mm;
      font-weight: 700;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '13px' : '11px'};
      margin-bottom: 2mm;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 2mm;
    }
    .label {
      font-weight: 900;
      display: inline-block;
      width: ${width === 79 ? '32mm' : '24mm'};
      vertical-align: top;
    }
    .value {
      display: inline-block;
      max-width: ${width === 79 ? '38mm' : '28mm'};
      word-wrap: break-word;
      overflow-wrap: anywhere;
      font-weight: 700;
    }
    .quotation-alert {
      background: #ffeb3b;
      color: #000;
      text-align: center;
      padding: 3mm;
      margin: 4mm 0;
      font-weight: 900;
      font-size: ${width === 79 ? '13px' : '11px'};
      border: 3px solid #000;
    }
    .technician-notes {
      margin-top: 5mm;
      border: 2px solid #000;
      padding: 3mm;
      min-height: ${width === 79 ? '35mm' : '25mm'};
      position: relative;
      background: white;
    }
    .ruled-lines {
      position: absolute;
      top: 10mm;
      left: 3mm;
      right: 3mm;
      bottom: 3mm;
      background-image: repeating-linear-gradient(
        transparent,
        transparent ${width === 79 ? '6mm' : '5mm'},
        #000 ${width === 79 ? '6mm' : '5mm'},
        #000 calc(${width === 79 ? '6mm' : '5mm'} + 1px)
      );
    }
    .footer {
      text-align: center;
      margin-top: 5mm;
      font-size: ${width === 79 ? '9px' : '8px'};
      line-height: 1.5;
      border-top: 2px solid #000;
      padding-top: 3mm;
      font-weight: 700;
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
    <div class="section-title">MACHINE DETAILS</div>
    <div><span class="label">Type:</span> <span class="value">${escapeHtml(job.machineCategory)}</span></div>
    <div><span class="label">Brand:</span> <span class="value">${escapeHtml(job.machineBrand)}</span></div>
    <div><span class="label">Model:</span> <span class="value">${escapeHtml(job.machineModel)}</span></div>
    ${job.machineSerial ? `<div><span class="label">Serial:</span> <span class="value">${escapeHtml(job.machineSerial)}</span></div>` : ''}
  </div>
  
  <div class="section">
    <div class="section-title">WORK REQUESTED</div>
    <div class="value">${escapeHtml(job.problemDescription)}</div>
  </div>
  
  ${job.servicePerformed ? `
  <div class="section">
    <div class="section-title">SERVICE NOTES</div>
    <div class="value">${escapeHtml(job.servicePerformed)}</div>
  </div>
  ` : ''}
  
  ${partsRequired !== 'N/A' ? `
  <div class="section">
    <div class="section-title">PARTS REQUIRED</div>
    <div class="value">${escapeHtml(partsRequired)}</div>
  </div>
  ` : ''}
  
  ${quotationText ? `
  <div class="quotation-alert">⚠️ ${escapeHtml(quotationText)}</div>
  ` : ''}
  
  <div class="technician-notes">
    <div class="section-title">TECHNICIAN NOTES</div>
    <div class="ruled-lines"></div>
  </div>
  
  <div class="footer">
    <strong>HAMPTON MOWERPOWER</strong><br>
    87 Ludstone Street, Hampton VIC 3188<br>
    Phone: 03-95986741 | ABN: 97 161 289 069<br>
    Email: hamptonmowerpower@gmail.com<br>
    Created: ${format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm')}
  </div>
</body>
</html>
`;
};

const generateCollectionReceiptHTML = async (job: Job, width: number, qrCodeBase64: string): Promise<string> => {
  // Calculate safe content width (printable area for TM-T82II)
  const safeWidth = width === 79 ? 72 : 54;
  
  // Determine payment type and amount
  const hasQuotation = job.quotationAmount && job.quotationAmount > 0;
  const hasDeposit = job.serviceDeposit && job.serviceDeposit > 0;
  const paymentAmount = hasQuotation ? job.quotationAmount : (hasDeposit ? job.serviceDeposit : 0);
  const paymentLabel = hasQuotation ? 'Quotation Amount Paid' : 'Deposit Paid';
  const paymentGST = paymentAmount ? paymentAmount * 0.1 / 1.1 : 0;
  
  const balanceDue = Math.max(0, job.grandTotal - paymentAmount);
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
      max-width: ${safeWidth}mm;
      padding: 3.5mm ${width === 79 ? '3.5mm' : '2mm'};
      font-size: ${width === 79 ? '11px' : '9px'};
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 700;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 3mm;
      font-size: ${width === 79 ? '18px' : '14px'};
      letter-spacing: 1px;
    }
    .subheader {
      text-align: center;
      font-size: ${width === 79 ? '12px' : '10px'};
      margin-bottom: 3mm;
      font-weight: 900;
      background: #000;
      color: #fff;
      padding: 2mm;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 79 ? '22px' : '18px'};
      font-weight: 900;
      margin: 3mm 0;
      letter-spacing: 3px;
      background: #000;
      color: #fff;
      padding: 4mm;
      border: 3px solid #000;
    }
    .section {
      margin: 3mm 0;
      border-top: 2px solid #000;
      padding-top: 3mm;
      font-weight: 700;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '12px' : '10px'};
      margin-bottom: 2mm;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 1mm;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 1.5mm 0;
      font-weight: 700;
    }
    .bold {
      font-weight: 900;
    }
    .items {
      font-size: ${width === 79 ? '10px' : '9px'};
    }
    .total-row {
      font-size: ${width === 79 ? '16px' : '13px'};
      font-weight: 900;
      margin-top: 3mm;
      padding-top: 3mm;
      border-top: 3px double #000;
    }
    .paid-stamp {
      text-align: center;
      font-size: ${width === 79 ? '18px' : '14px'};
      font-weight: 900;
      margin: 4mm 0;
      padding: 4mm;
      border: 4px solid #000;
      background: #000;
      color: #fff;
      letter-spacing: 3px;
      transform: rotate(-15deg);
    }
    .footer {
      text-align: center;
      margin-top: 5mm;
      font-size: ${width === 79 ? '9px' : '8px'};
      line-height: 1.5;
      font-weight: 700;
      border-top: 3px solid #000;
      padding-top: 3mm;
    }
    .conditions {
      margin-top: 5mm;
      padding: 4mm;
      border: 3px solid #000;
      font-size: ${width === 79 ? '10px' : '8px'};
      line-height: 1.6;
      background: #f5f5f5;
      font-weight: 600;
    }
    .conditions-title {
      font-weight: 900;
      font-size: ${width === 79 ? '12px' : '10px'};
      margin-bottom: 3mm;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 2mm;
      text-align: center;
      letter-spacing: 1px;
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
    <div class="section-title">ITEMS/SERVICES</div>
    ${itemsLines.map(line => `<div>• ${escapeHtml(line || '')}</div>`).join('\n    ')}
  </div>
  ` : ''}
  
  <div class="section">
    <div class="section-title">PAYMENT SUMMARY</div>
    ${paymentAmount > 0 ? `
    <div class="row bold">
      <span>${paymentLabel}:</span>
      <span>${formatCurrency(paymentAmount)}</span>
    </div>
    <div class="row" style="font-size: ${width === 79 ? '9px' : '8px'};">
      <span>(incl. ${formatCurrency(paymentGST)} GST)</span>
      <span></span>
    </div>
    ` : ''}
    ${job.discountValue && job.discountValue > 0 ? `
    <div class="row">
      <span>Discount ${job.discountType === 'PERCENT' ? `(${job.discountValue}%)` : ''}:</span>
      <span>-${formatCurrency(job.discountType === 'PERCENT' ? job.subtotal * (job.discountValue / 100) : job.discountValue)}</span>
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
  
  <div class="conditions">
    <div class="conditions-title">⚠ REPAIR CONTRACT CONDITIONS ⚠</div>
    <div style="margin-bottom: 2mm;">
      <strong>1.</strong> All quotes are valid for 30 days from date of issue.<br><br>
      <strong>2.</strong> All domestic customer service work is guaranteed for 90 days from completion date. All commercial customer service work is covered by floor warranty only (as provided by the manufacturer or distributor).<br><br>
      <strong>3.</strong> We are not responsible for consequential damage or loss of use.<br><br>
      <strong>4.</strong> Payment is due upon collection unless account terms are agreed.<br><br>
      <strong>5.</strong> Goods not collected within 90 days may be disposed of to recover costs.
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 4mm; font-size: ${width === 79 ? '10px' : '9px'}; font-weight: 700;">
    Commercial special discounts and benefits — enquire in store.
  </div>
  
  ${qrCodeBase64 ? `
  <div style="text-align: center; margin-top: 4mm;">
    <img src="data:image/png;base64,${qrCodeBase64}" alt="Website QR Code" style="width: ${width === 79 ? '30mm' : '25mm'}; height: ${width === 79 ? '30mm' : '25mm'}; margin: 0 auto;" />
  </div>
  ` : ''}
  
  <div class="footer">
    <strong>HAMPTON MOWERPOWER</strong><br>
    A.B.N. 97 161 289 069<br>
    GARDEN EQUIPMENT SALES & SERVICE<br>
    87 Ludstone Street, Hampton 3188<br>
    Phone: 03 9598 6741<br>
    www.hamptonmowerpower.com.au<br>
    Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
  </div>
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
