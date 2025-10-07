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

  // Try to open popup - with better error handling
  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank', 'width=800,height=600');
  } catch (error) {
    console.error('Failed to open popup:', error);
  }
  
  if (!printWindow) {
    // Fallback: try using iframe method
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    try {
      const html = type === 'service-label' 
        ? await generateServiceLabelHTML(job, width)
        : await generateCollectionReceiptHTML(job, width, await getQRCodeBase64());
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
        
        iframe.contentWindow?.print();
        
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
        return;
      }
    } catch (error) {
      document.body.removeChild(iframe);
      throw new Error('Failed to print. Please check your browser popup settings.');
    }
    
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
      font-size: ${width === 79 ? '11px' : '9px'};
      line-height: 1.1;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 900;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 1mm;
      font-size: ${width === 79 ? '18px' : '16px'};
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .tagline {
      text-align: center;
      font-size: ${width === 79 ? '14px' : '12px'};
      margin-bottom: 3mm;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
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
      margin: 2mm 0 1mm 0;
      padding-top: 1mm;
      font-weight: 900;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-bottom: 1mm;
      margin-top: 2mm;
      text-transform: uppercase;
      color: #000;
      padding-bottom: 0.5mm;
      letter-spacing: 2px;
      text-align: left;
      border-bottom: 2px solid #000;
    }
    .inline-row {
      display: flex;
      align-items: baseline;
      margin: 0.5mm 0;
      font-weight: 900;
      font-size: ${width === 79 ? '11px' : '9px'};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .inline-label {
      min-width: 30mm;
      max-width: 30mm;
      font-weight: 900;
      flex-shrink: 0;
    }
    .inline-value {
      flex: 1;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      font-weight: 900;
    }
    .list-item {
      display: block;
      margin: 0.5mm 0;
      line-height: 1.1;
      font-weight: 900;
      font-size: ${width === 79 ? '11px' : '9px'};
      text-transform: uppercase;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      letter-spacing: 0.5px;
      padding-left: 0;
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
  <div class="tagline">ONE STOP SHOP</div>
  
  <div class="job-number-label">JOB NUMBER</div>
  <div class="job-id">${escapeHtml(job.jobNumber)}</div>
  
  <div class="section">
    <div class="inline-row">
      <div class="inline-label">CUSTOMER:</div>
      <div class="inline-value">${escapeHtml(job.customer.name)}</div>
    </div>
    <div class="inline-row">
      <div class="inline-label">PHONE:</div>
      <div class="inline-value">${escapeHtml(job.customer.phone)}</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">MACHINE DETAILS</div>
    <div class="inline-row">
      <div class="inline-label">TYPE:</div>
      <div class="inline-value">${escapeHtml(job.machineCategory)}</div>
    </div>
    <div class="inline-row">
      <div class="inline-label">BRAND:</div>
      <div class="inline-value">${escapeHtml(job.machineBrand)}</div>
    </div>
    <div class="inline-row">
      <div class="inline-label">MODEL:</div>
      <div class="inline-value">${escapeHtml(job.machineModel)}</div>
    </div>
    ${job.machineSerial ? `<div class="inline-row"><div class="inline-label">SERIAL:</div><div class="inline-value">${escapeHtml(job.machineSerial)}</div></div>` : ''}
  </div>
  
  ${job.requestedFinishDate ? `
  <div style="background: #ffeb3b; border: 3px solid #000; padding: 3mm; margin: 3mm 0; text-align: center;">
    <div style="font-weight: 900; font-size: ${width === 79 ? '13px' : '11px'}; letter-spacing: 1px;">
      ⚠️ REQUESTED FINISH: ${format(new Date(job.requestedFinishDate), 'dd MMM yyyy')}
    </div>
  </div>
  ` : ''}
  
  <div class="section">
    <div class="section-title">WORK REQUESTED</div>
    ${workRequested.map(item => `<div class="list-item">${escapeHtml(item)}</div>`).join('')}
  </div>
  
  ${job.additionalNotes && job.additionalNotes.trim() ? `
  <div class="section">
    <div class="section-title">ADDITIONAL NOTES</div>
    <div style="white-space: pre-wrap; word-wrap: break-word; font-weight: 900; font-size: ${width === 79 ? '11px' : '9px'}; text-transform: uppercase; padding: 2mm 0;">${escapeHtml(job.additionalNotes)}</div>
  </div>
  ` : ''}
  
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
      font-size: ${width === 79 ? '11px' : '9px'};
      line-height: 1.1;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      hyphens: none;
      color: #000;
      font-weight: 900;
    }
    .header {
      text-align: center;
      font-weight: 900;
      margin-bottom: 1mm;
      font-size: ${width === 79 ? '18px' : '16px'};
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .tagline {
      text-align: center;
      font-size: ${width === 79 ? '14px' : '12px'};
      margin-bottom: 3mm;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .identity-line {
      text-align: center;
      font-size: ${width === 79 ? '13px' : '11px'};
      font-weight: 900;
      margin: 0.5mm 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .subheader {
      text-align: center;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-bottom: 2mm;
      margin-top: 2mm;
      font-weight: 900;
      color: #000;
      padding-bottom: 0.5mm;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
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
      margin: 2mm 0 1mm 0;
      padding-top: 1mm;
      font-weight: 900;
    }
    .section-title {
      font-weight: 900;
      font-size: ${width === 79 ? '15px' : '13px'};
      margin-bottom: 1mm;
      margin-top: 2mm;
      text-transform: uppercase;
      color: #000;
      padding-bottom: 0.5mm;
      letter-spacing: 2px;
      text-align: left;
      border-bottom: 2px solid #000;
    }
    .inline-row {
      display: flex;
      align-items: baseline;
      margin: 0.5mm 0;
      font-weight: 900;
      font-size: ${width === 79 ? '11px' : '9px'};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .inline-label {
      min-width: 30mm;
      max-width: 30mm;
      font-weight: 900;
      flex-shrink: 0;
    }
    .inline-value {
      flex: 1;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      font-weight: 900;
    }
    .bold {
      font-weight: 900;
      text-transform: uppercase;
    }
    .payment-line {
      font-size: ${width === 79 ? '13px' : '11px'};
      font-weight: 900;
      text-align: center;
      margin: 2mm 0;
      line-height: 1.3;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .commercial-banner {
      text-align: center;
      font-size: ${width === 79 ? '11px' : '9px'};
      font-weight: 900;
      margin: 2mm 0;
      padding: 1.5mm;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      background: #fff;
      letter-spacing: 0.5px;
      line-height: 1.2;
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
      margin-top: 2mm;
      padding: 2mm;
      border: 2px solid #000;
      font-size: ${width === 79 ? '9px' : '8px'};
      line-height: 1.3;
      background: #fff;
      font-weight: 700;
    }
    .conditions-title {
      font-weight: 900;
      font-size: ${width === 79 ? '13px' : '11px'};
      margin-bottom: 1mm;
      text-transform: uppercase;
      color: #000;
      padding-bottom: 0.5mm;
      text-align: left;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #000;
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
  <div class="tagline">ONE STOP SHOP</div>
  
  <div class="identity-line">ABN 97 161 289 069</div>
  <div class="identity-line">PHONE: 03-9598-6741</div>
  
  <div class="subheader">COLLECTION RECEIPT</div>
  
  <div class="job-number-label">JOB NUMBER</div>
  <div class="job-id">${escapeHtml(job.jobNumber)}</div>
  
  <div class="section">
    <div class="inline-row">
      <div class="inline-label">CUSTOMER:</div>
      <div class="inline-value">${escapeHtml(job.customer.name)}</div>
    </div>
    <div class="inline-row">
      <div class="inline-label">MODEL:</div>
      <div class="inline-value">${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">PAYMENT SUMMARY</div>
    ${paymentAmount > 0 ? `
    <div class="payment-line">
      ${paymentLabel}: ${formatCurrency(paymentAmount)}<br>
      (INCL. ${formatCurrency(paymentGST)} GST)
    </div>
    ` : '<div class="payment-line">NO PAYMENT RECORDED</div>'}
  </div>
  
  ${isPaid ? `
  <div class="paid-stamp">✓ PAID IN FULL</div>
  ` : ''}
  
  <div class="commercial-banner">
    COMMERCIAL SPECIAL DISCOUNTS & BENEFITS — ENQUIRE IN-STORE
  </div>
  
  <div class="conditions">
    <div class="conditions-title">REPAIR CONTRACT CONDITIONS</div>
    <div style="line-height: 1.3;">
      <strong>1.</strong> All quotes are valid for 30 days from date of issue. This does not limit your rights under the Australian Consumer Law.<br><br>
      <strong>2.</strong> All domestic customer service work is guaranteed for 90 days from completion date. All commercial customer service work is covered by floor warranty only (as provided by the manufacturer or distributor).<br><br>
      <strong>3.</strong> We are not responsible for consequential damage or loss of use, to the extent permitted by law.<br><br>
      <strong>4.</strong> Payment is due upon collection unless account terms are agreed.<br><br>
      <strong>5.</strong> If goods are uncollected after notice, we may act under applicable Uncollected Goods legislation to sell or dispose of them and account for proceeds.
    </div>
  </div>
  
  ${qrCodeBase64 ? `
  <div style="text-align: center; margin-top: 3mm;">
    <img src="data:image/png;base64,${qrCodeBase64}" alt="Website QR Code" style="width: ${width === 79 ? '30mm' : '25mm'}; height: ${width === 79 ? '30mm' : '25mm'}; margin: 0 auto;" />
  </div>
  <div class="qr-callout">SHOP ONLINE — SCAN TO PURCHASE</div>
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
