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
  // Parse and deduplicate work requested items
  const workRequested = job.problemDescription
    .split(/[,;\n]+/) // Split by comma, semicolon, or newline
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
    .map(item => item.toUpperCase());

  // Format parts - one per line
  const partsRequired = job.parts
    .filter(part => part.partName && part.partName.trim() !== '' && part.quantity > 0)
    .map(part => `${part.partName.trim().toUpperCase()} ×${part.quantity || 1}`)
    .join('\n') || 'N/A';

  const quotationText = job.quotationAmount && job.quotationAmount > 0
    ? `QUOTATION REQUESTED: ${formatCurrency(job.quotationAmount)}`
    : '';

  // Calculate safe content width (printable area for TM-T82II - 79mm width, ~72mm safe area)
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
      font-size: ${width === 79 ? '13px' : '11px'};
      line-height: 1.8;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 900;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 4mm;
      font-size: ${width === 79 ? '18px' : '15px'};
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .abn {
      text-align: center;
      font-size: ${width === 79 ? '11px' : '10px'};
      margin-bottom: 4mm;
      font-weight: 900;
    }
    .job-number-label {
      text-align: center;
      font-weight: 900;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-top: 4mm;
      margin-bottom: 2mm;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 79 ? '28px' : '22px'};
      font-weight: 900;
      margin-bottom: 4mm;
      letter-spacing: 2px;
      padding: 4mm 2mm;
      border: 3px solid #000;
      white-space: nowrap;
      overflow: visible;
      display: block;
      max-width: 100%;
      box-sizing: border-box;
    }
    .section {
      margin: 3mm 0;
      border-top: 2px solid #000;
      padding-top: 3mm;
      font-weight: 900;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-bottom: 3mm;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 3mm 2mm;
      letter-spacing: 1.5px;
    }
    .label {
      font-weight: 900;
      display: inline-block;
      width: ${width === 79 ? '32mm' : '24mm'};
      vertical-align: top;
      font-size: ${width === 79 ? '14px' : '12px'};
      text-transform: uppercase;
    }
    .value {
      display: inline-block;
      max-width: ${width === 79 ? '38mm' : '28mm'};
      word-wrap: break-word;
      overflow-wrap: anywhere;
      font-weight: 900;
      font-size: ${width === 79 ? '14px' : '12px'};
      text-transform: uppercase;
    }
    .list-item {
      display: block;
      margin: 3mm 0;
      line-height: 2;
      font-weight: 900;
      font-size: ${width === 79 ? '14px' : '12px'};
      text-transform: uppercase;
      word-wrap: break-word;
      overflow-wrap: anywhere;
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
  
  <div class="job-number-label">JOB NUMBER</div>
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
    ${workRequested.map(item => `<div class="list-item">${escapeHtml(item)}</div>`).join('')}
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
    ${partsRequired.split('\n').map(part => `<div class="list-item">${escapeHtml(part)}</div>`).join('')}
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
    Phone: 03-9598-6741 | ABN: 97 161 289 069<br>
    www.hamptonmowerpower.com.au<br>
    Created: ${format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm')}
  </div>
</body>
</html>
`;
};

const generateCollectionReceiptHTML = async (job: Job, width: number, qrCodeBase64: string): Promise<string> => {
  // Calculate safe content width (printable area for TM-T82II)
  const safeWidth = width === 79 ? 72 : 54;
  
  // Determine payment type and amount - prioritize quotation over deposit
  const hasQuotation = job.quotationAmount && job.quotationAmount > 0;
  const hasDeposit = job.serviceDeposit && job.serviceDeposit > 0;
  const paymentAmount = hasQuotation ? job.quotationAmount : (hasDeposit ? job.serviceDeposit : 0);
  const paymentLabel = hasQuotation ? 'QUOTATION PAID' : 'SERVICE DEPOSIT PAID';
  const paymentGST = paymentAmount ? paymentAmount * 0.1 / 1.1 : 0;
  
  const balanceDue = job.balanceDue !== undefined ? job.balanceDue : Math.max(0, job.grandTotal - paymentAmount);
  const isPaid = balanceDue === 0;

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
      font-size: ${width === 79 ? '12px' : '10px'};
      line-height: 1.8;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 900;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 3mm;
      font-size: ${width === 79 ? '24px' : '20px'};
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .subheader {
      text-align: center;
      font-size: ${width === 79 ? '16px' : '13px'};
      margin-bottom: 3mm;
      font-weight: 900;
      background: #000;
      color: #fff;
      padding: 3mm;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .job-number-label {
      text-align: center;
      font-weight: 900;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-top: 3mm;
      margin-bottom: 2mm;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .job-id {
      text-align: center;
      font-size: ${width === 79 ? '28px' : '22px'};
      font-weight: 900;
      margin-bottom: 4mm;
      letter-spacing: 2px;
      padding: 4mm 2mm;
      border: 3px solid #000;
      white-space: nowrap;
      overflow: visible;
      display: block;
      max-width: 100%;
      box-sizing: border-box;
    }
    .section {
      margin: 3mm 0;
      border-top: 2px solid #000;
      padding-top: 3mm;
      font-weight: 700;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '16px' : '13px'};
      margin-bottom: 3mm;
      text-transform: uppercase;
      background: #000;
      color: #fff;
      padding: 3mm 2mm;
      letter-spacing: 1.5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 1.5mm 0;
      font-weight: 900;
      font-size: ${width === 79 ? '13px' : '11px'};
      text-transform: uppercase;
    }
    .bold {
      font-weight: 900;
      text-transform: uppercase;
    }
    .total-row {
      font-size: ${width === 79 ? '18px' : '15px'};
      font-weight: 900;
      margin-top: 3mm;
      padding-top: 3mm;
      border-top: 3px double #000;
    }
    .commercial-banner {
      text-align: center;
      font-size: ${width === 79 ? '13px' : '11px'};
      font-weight: 900;
      margin: 5mm 0;
      padding: 4mm;
      border-top: 3px solid #000;
      border-bottom: 3px solid #000;
      background: #f5f5f5;
      letter-spacing: 1px;
      line-height: 1.6;
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
      margin-top: 3mm;
      padding: 4mm;
      border: 3px solid #000;
      font-size: ${width === 79 ? '10px' : '9px'};
      line-height: 1.6;
      background: #f5f5f5;
      font-weight: 700;
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
    .qr-callout {
      text-align: center;
      font-weight: 900;
      font-size: ${width === 79 ? '12px' : '10px'};
      margin-top: 3mm;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">HAMPTON MOWERPOWER</div>
  <div class="subheader">COLLECTION RECEIPT</div>
  <div class="subheader">ABN 97 161 289 069 | 03-9598-6741</div>
  
  <div class="job-number-label">JOB NUMBER</div>
  <div class="job-id">${escapeHtml(job.jobNumber)}</div>
  
  <div class="section">
    <div class="bold" style="font-size: ${width === 79 ? '14px' : '12px'};">${escapeHtml(job.customer.name.toUpperCase())}</div>
    <div style="font-size: ${width === 79 ? '13px' : '11px'}; font-weight: 900; text-transform: uppercase;">${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}</div>
  </div>
  
  <div class="section">
    <div class="section-title">PAYMENT SUMMARY</div>
    ${paymentAmount > 0 ? `
    <div class="bold" style="font-size: ${width === 79 ? '14px' : '12px'}; text-align: center; margin: 2mm 0; line-height: 1.8;">
      ${paymentLabel}: ${formatCurrency(paymentAmount)}<br>
      <span style="font-size: ${width === 79 ? '11px' : '10px'};">(INCL. ${formatCurrency(paymentGST)} GST)</span>
    </div>
    ` : '<div style="font-size: 12px; font-weight: 900; text-align: center;">No payment recorded</div>'}
  </div>
  
  ${isPaid ? `
  <div class="paid-stamp">✓ PAID IN FULL</div>
  ` : ''}
  
  <div class="commercial-banner">
    COMMERCIAL SPECIAL DISCOUNTS & BENEFITS — ENQUIRE IN-STORE
  </div>
  
  <div class="conditions">
    <div class="conditions-title">REPAIR CONTRACT CONDITIONS</div>
    <div style="margin-bottom: 2mm; line-height: 1.7;">
      <strong>1.</strong> All quotes are valid for 30 days from date of issue. This does not limit your rights under the Australian Consumer Law.<br><br>
      <strong>2.</strong> All domestic customer service work is guaranteed for 90 days from completion date. All commercial customer service work is covered by floor warranty only (as provided by the manufacturer or distributor).<br><br>
      <strong>3.</strong> We are not responsible for consequential damage or loss of use, to the extent permitted by law.<br><br>
      <strong>4.</strong> Payment is due upon collection unless account terms are agreed.<br><br>
      <strong>5.</strong> If goods are uncollected after notice, we may act under applicable Uncollected Goods legislation to sell or dispose of them and account for proceeds.
    </div>
  </div>
  
  ${qrCodeBase64 ? `
  <div style="text-align: center; margin-top: 5mm;">
    <img src="data:image/png;base64,${qrCodeBase64}" alt="Website QR Code" style="width: ${width === 79 ? '35mm' : '28mm'}; height: ${width === 79 ? '35mm' : '28mm'}; margin: 0 auto;" />
  </div>
  <div class="qr-callout">Shop online — scan to purchase</div>
  ` : ''}
  
  <div class="footer">
    <strong>HAMPTON MOWERPOWER</strong><br>
    ABN 97 161 289 069<br>
    03-9598-6741<br>
    GARDEN EQUIPMENT SALES & SERVICE<br>
    87 Ludstone Street, Hampton 3188<br>
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
