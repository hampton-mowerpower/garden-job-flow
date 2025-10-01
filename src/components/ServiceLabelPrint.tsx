import React from 'react';
import { Job } from '@/types/job';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface ServiceLabelPrintProps {
  job: Job;
  template: 'thermal-large' | 'thermal-small' | 'a4';
  quantity: number;
}

export const printServiceLabel = async ({ job, template, quantity }: ServiceLabelPrintProps) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const jobUrl = `${window.location.origin}/jobs/${job.id}`;

  // Generate QR code data URI
  let qrCodeImage = '';
  try {
    qrCodeImage = await QRCode.toDataURL(jobUrl, { 
      width: 200, 
      margin: 1,
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    qrCodeImage = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  }

  // Format parts required
  const partsRequired = job.parts && job.parts.length > 0
    ? job.parts.map(p => `${p.partName} × ${p.quantity}`).join(', ')
    : 'None';

  // Check if quotation was requested
  const hasQuotation = job.quotationAmount && job.quotationAmount > 0;

  // Thermal Large (62×100mm) - Updated with sections like PDF 222
  const thermalLargeLabel = `
    <div style="width: 100mm; padding: 5mm; font-family: Arial, sans-serif; font-size: 10px; border: 2px solid #000; box-sizing: border-box; page-break-after: always;">
      <div style="text-align: center; margin-bottom: 4mm;">
        <div style="font-size: 18px; font-weight: bold; border: 2px solid #000; padding: 3mm;">${escapeHtml(job.jobNumber)}</div>
      </div>
      
      <div style="margin-bottom: 3mm; font-size: 11px;">
        <strong>Customer:</strong> ${escapeHtml(job.customer.name)}<br>
        <strong>Phone:</strong> ${escapeHtml(job.customer.phone)}
      </div>
      
      <div style="margin-bottom: 3mm; padding: 2mm; background: #f5f5f5; border-left: 4px solid #333;">
        <strong>Machine Details:</strong><br>
        ${escapeHtml(job.machineCategory)} - ${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}
        ${job.machineSerial ? `<br><strong>Serial:</strong> ${escapeHtml(job.machineSerial)}` : ''}
      </div>
      
      ${job.servicePerformed ? `
      <div style="margin-bottom: 3mm; padding: 2mm; background: #e3f2fd; border-left: 4px solid #2196F3;">
        <strong>Service Notes:</strong><br>
        ${escapeHtml(job.servicePerformed)}
      </div>
      ` : ''}
      
      ${job.parts && job.parts.length > 0 ? `
      <div style="margin-bottom: 3mm; padding: 2mm; background: #f3e5f5; border-left: 4px solid #9c27b0;">
        <strong>Parts Required:</strong><br>
        ${escapeHtml(partsRequired)}
      </div>
      ` : ''}
      
      ${job.problemDescription ? `
      <div style="margin-bottom: 3mm; padding: 2mm; background: #fff3e0; border-left: 4px solid #ff9800;">
        <strong>Problem/Fault:</strong><br>
        ${escapeHtml(job.problemDescription)}
      </div>
      ` : ''}
      
      ${hasQuotation ? `
      <div style="margin-bottom: 3mm; padding: 2mm; background: #ffeb3b; border: 2px solid #f57f17; font-weight: bold;">
        ⚠️ QUOTATION REQUESTED: $${job.quotationAmount?.toFixed(2)}
      </div>
      ` : ''}
      
      <div style="text-align: center; font-size: 8px; margin-top: 3mm; padding-top: 2mm; border-top: 1px solid #ccc;">
        <strong>Hampton Mowerpower</strong><br>
        87 Ludstone Street, Hampton VIC 3188<br>
        03-95986741 | ABN: 97 161 289 069<br>
        hamptonmowerpower@gmail.com<br>
        Created: ${format(new Date(job.createdAt), 'dd/MM/yyyy')}
      </div>
    </div>
  `;

  // Thermal Small (58×40mm) - Compact version
  const thermalSmallLabel = `
    <div style="width: 58mm; padding: 2mm; font-family: Arial, sans-serif; font-size: 8px; border: 1px solid #000; box-sizing: border-box; page-break-after: always;">
      <div style="font-weight: bold; font-size: 11px; text-align: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm;">
        ${escapeHtml(job.jobNumber)}
      </div>
      <div style="font-size: 8px; margin-bottom: 1mm;">
        <strong>${escapeHtml(job.customer.name)}</strong><br>
        ${escapeHtml(job.customer.phone)}
      </div>
      <div style="font-size: 7px; background: #f0f0f0; padding: 1mm; margin-bottom: 1mm;">
        ${escapeHtml(job.machineCategory)} - ${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}
      </div>
      ${job.problemDescription ? `
      <div style="font-size: 7px; background: #fff3e0; padding: 1mm; margin-bottom: 1mm;">
        <strong>Issue:</strong> ${escapeHtml(job.problemDescription.substring(0, 50))}${job.problemDescription.length > 50 ? '...' : ''}
      </div>
      ` : ''}
      ${hasQuotation ? `
      <div style="font-size: 7px; background: #ffeb3b; padding: 1mm; font-weight: bold;">
        QUOTATION: $${job.quotationAmount?.toFixed(2)}
      </div>
      ` : ''}
    </div>
  `;

  // A4 Sticker (4 labels per page)
  const a4Label = `
    <div style="width: 210mm; min-height: 297mm; padding: 10mm;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
        ${Array(Math.min(quantity, 4)).fill(thermalLargeLabel).join('')}
      </div>
    </div>
  `;

  let labelHTML = '';
  let pageSize = '';

  switch (template) {
    case 'thermal-large':
      labelHTML = Array(quantity).fill(thermalLargeLabel).map((label, i) => 
        `<div style="page-break-after: ${i < quantity - 1 ? 'always' : 'auto'};">${label}</div>`
      ).join('');
      pageSize = '100mm 62mm';
      break;
    case 'thermal-small':
      labelHTML = Array(quantity).fill(thermalSmallLabel).map((label, i) => 
        `<div style="page-break-after: ${i < quantity - 1 ? 'always' : 'auto'};">${label}</div>`
      ).join('');
      pageSize = '58mm 40mm';
      break;
    case 'a4':
      labelHTML = a4Label;
      pageSize = 'A4';
      break;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Service Label - ${escapeHtml(job.jobNumber)}</title>
        <style>
          @media print {
            @page { 
              size: ${pageSize};
              margin: 0;
            }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${labelHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// Helper to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
