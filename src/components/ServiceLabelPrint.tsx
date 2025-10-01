import React from 'react';
import { Job } from '@/types/job';
import { QRCodeSVG } from 'qrcode.react';
import hamptonLogo from '@/assets/hampton-logo.png';
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
  const barcodeValue = job.jobNumber;

  // Thermal Large (62×100mm)
  const thermalLargeLabel = `
    <div style="width: 100mm; height: 62mm; padding: 4mm; font-family: Arial, sans-serif; font-size: 10px; border: 1px solid #000;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3mm;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 2mm;">WORK ORDER</div>
          <div style="font-size: 16px; font-weight: bold;">${job.jobNumber}</div>
        </div>
        <div style="width: 25mm; height: 25mm; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">
          <svg width="90" height="90" viewBox="0 0 100 100">
            ${generateQRCode(jobUrl)}
          </svg>
        </div>
      </div>
      <div style="margin-bottom: 2mm;">
        <strong>Customer:</strong> ${job.customer.name}<br>
        <strong>Phone:</strong> ${job.customer.phone}
      </div>
      <div style="margin-bottom: 2mm; padding: 2mm; background: #f0f0f0; border: 1px solid #ccc;">
        <strong>Equipment:</strong> ${job.machineBrand} ${job.machineModel}<br>
        ${job.machineSerial ? `<strong>Serial:</strong> ${job.machineSerial}<br>` : ''}
        <strong>Category:</strong> ${job.machineCategory}
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
          <div style="margin-top: 1mm;">${job.customer.name}</div>
          <div>${job.customer.phone}</div>
        </div>
        <div style="width: 15mm; height: 15mm;">
          <svg width="56" height="56" viewBox="0 0 100 100">
            ${generateQRCode(jobUrl)}
          </svg>
        </div>
      </div>
      <div style="font-size: 7px; background: #f0f0f0; padding: 1mm;">
        ${job.machineBrand} ${job.machineModel} · ${job.machineCategory}
      </div>
    </div>
  `;

  // A4 Sticker (4 labels per page)
  const a4Label = `
    <div style="width: 210mm; min-height: 297mm; padding: 10mm;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8mm;">
        ${Array(quantity).fill(thermalLargeLabel).join('')}
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
        <title>Service Label - ${job.jobNumber}</title>
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

// Simple QR code SVG generator (using external library in actual component)
function generateQRCode(data: string): string {
  // This is a placeholder - in actual implementation, use QRCodeSVG component
  return `<rect width="100" height="100" fill="white"/><text x="50" y="50" text-anchor="middle" font-size="8">QR</text>`;
}
