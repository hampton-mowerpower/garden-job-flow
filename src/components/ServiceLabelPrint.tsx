import React from 'react';
import { Job } from '@/types/job';
import { format } from 'date-fns';

interface ServiceLabelPrintProps {
  job: Job;
  template: 'thermal-large' | 'thermal-small' | 'a4';
  quantity: number;
}

export const printServiceLabel = ({ job, template, quantity }: ServiceLabelPrintProps) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const jobUrl = `${window.location.origin}/jobs/${job.id}`;

  // Generate QR code data URI using canvas
  const generateQRCodeDataURI = (text: string): string => {
    // Simple QR-like placeholder - in production, this would use a proper QR library
    // For now, we'll use a data URI placeholder
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="white"/>
        <rect x="10" y="10" width="10" height="10" fill="black"/>
        <rect x="30" y="10" width="10" height="10" fill="black"/>
        <rect x="50" y="10" width="10" height="10" fill="black"/>
        <rect x="70" y="10" width="10" height="10" fill="black"/>
        <rect x="10" y="30" width="10" height="10" fill="black"/>
        <rect x="70" y="30" width="10" height="10" fill="black"/>
        <rect x="10" y="50" width="10" height="10" fill="black"/>
        <rect x="30" y="50" width="10" height="10" fill="black"/>
        <rect x="50" y="50" width="10" height="10" fill="black"/>
        <rect x="70" y="50" width="10" height="10" fill="black"/>
        <rect x="10" y="70" width="10" height="10" fill="black"/>
        <rect x="30" y="70" width="10" height="10" fill="black"/>
        <rect x="50" y="70" width="10" height="10" fill="black"/>
        <rect x="70" y="70" width="10" height="10" fill="black"/>
        <text x="50" y="95" text-anchor="middle" font-size="6" font-family="monospace">${text.substring(0, 20)}</text>
      </svg>
    `)}`;
  };

  const qrCodeImage = generateQRCodeDataURI(jobUrl);

  // Thermal Large (62×100mm)
  const thermalLargeLabel = `
    <div style="width: 100mm; height: 62mm; padding: 4mm; font-family: Arial, sans-serif; font-size: 10px; border: 1px solid #000;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3mm;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 2mm;">WORK ORDER</div>
          <div style="font-size: 16px; font-weight: bold;">${job.jobNumber}</div>
        </div>
        <div style="width: 25mm; height: 25mm; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">
          <img src="${qrCodeImage}" alt="QR Code" style="width: 100%; height: 100%;">
        </div>
      </div>
      <div style="margin-bottom: 2mm;">
        <strong>Customer:</strong> ${escapeHtml(job.customer.name)}<br>
        <strong>Phone:</strong> ${escapeHtml(job.customer.phone)}
      </div>
      <div style="margin-bottom: 2mm; padding: 2mm; background: #f0f0f0; border: 1px solid #ccc;">
        <strong>Equipment:</strong> ${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)}<br>
        ${job.machineSerial ? `<strong>Serial:</strong> ${escapeHtml(job.machineSerial)}<br>` : ''}
        <strong>Category:</strong> ${escapeHtml(job.machineCategory)}
      </div>
      <div style="font-size: 8px; margin-top: 2mm;">
        <strong>Booked:</strong> ${format(new Date(job.createdAt), 'dd MMM yyyy')} 
        ${job.problemDescription ? ' · ⚠ Concern Noted' : ''}
      </div>
    </div>
  `;

  // Thermal Small (58×40mm)
  const thermalSmallLabel = `
    <div style="width: 58mm; height: 40mm; padding: 2mm; font-family: Arial, sans-serif; font-size: 8px; border: 1px solid #000;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2mm;">
        <div>
          <div style="font-weight: bold; font-size: 12px;">${job.jobNumber}</div>
          <div style="margin-top: 1mm;">${escapeHtml(job.customer.name)}</div>
          <div>${escapeHtml(job.customer.phone)}</div>
        </div>
        <div style="width: 15mm; height: 15mm;">
          <img src="${qrCodeImage}" alt="QR Code" style="width: 100%; height: 100%;">
        </div>
      </div>
      <div style="font-size: 7px; background: #f0f0f0; padding: 1mm;">
        ${escapeHtml(job.machineBrand)} ${escapeHtml(job.machineModel)} · ${escapeHtml(job.machineCategory)}
      </div>
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
