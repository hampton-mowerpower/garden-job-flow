import React from 'react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface JobPrintLabelProps {
  job: Job;
}

export const JobPrintLabel: React.FC<JobPrintLabelProps> = ({ job }) => {
  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Create Service Notes string from notes
    const serviceNotes = job.notes?.trim() || '';

    // Use computed Parts Required from job or generate it
    const partsRequired = job.partsRequired || job.parts
      .filter(part => part.partName?.trim() && part.quantity > 0)
      .map(part => `${part.partName} × ${part.quantity || 1}`)
      .join(', ');

    const labelHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Label - ${job.jobNumber}</title>
          <style>
            @media print {
              @page { size: A5; margin: 10mm; }
              body { font-family: Arial, sans-serif; font-size: 12px; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
            }
            .label-container {
              border: 2px solid #000;
              padding: 15px;
              max-width: 400px;
              background: white;
            }
            .job-number {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              border: 2px solid #000;
              padding: 10px;
              margin-bottom: 15px;
              background: #f0f0f0;
            }
            .section {
              margin-bottom: 12px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 8px;
            }
            .section:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              display: inline-block;
              width: 80px;
            }
            .machine-info {
              background: #f9f9f9;
              padding: 8px;
              border-left: 4px solid #333;
            }
            .service-notes {
              background: #e3f2fd;
              padding: 8px;
              border-left: 4px solid #2196f3;
              margin-top: 10px;
            }
            .parts-required {
              background: #f3e5f5;
              padding: 8px;
              border-left: 4px solid #9c27b0;
              margin-top: 10px;
            }
            .problem {
              background: #fff3cd;
              padding: 8px;
              border-left: 4px solid #ffc107;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 15px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="job-number">JOB #${job.jobNumber}</div>
            
            <div class="section">
              <div><span class="label">Customer:</span> ${job.customer.name}</div>
              <div><span class="label">Phone:</span> ${job.customer.phone}</div>
            </div>
            
            <div class="machine-info">
              <div><strong>Machine Details:</strong></div>
              <div>${job.machineCategory} - ${job.machineBrand} ${job.machineModel}</div>
              ${job.machineSerial ? `<div>Serial: ${job.machineSerial}</div>` : ''}
            </div>
            
            ${serviceNotes ? `
            <div class="service-notes">
              <div><strong>Service Notes:</strong></div>
              <div>${serviceNotes}</div>
            </div>
            ` : ''}
            
            ${partsRequired ? `
            <div class="parts-required">
              <div><strong>Parts Required:</strong></div>
              <div>${partsRequired}</div>
            </div>
            ` : ''}
            
            <div class="problem">
              <div><strong>Problem/Fault:</strong></div>
              <div>${job.problemDescription}</div>
            </div>
            
            <div class="footer">
              <strong>HAMPTON MOWERPOWER</strong><br>
              Garden Equipment Sales & Service<br>
              87 Ludstone Street, Hampton 3188<br>
              (03) 9598 6741 | ABN: 97 161 289 069<br>
              Created: ${new Date(job.createdAt).toLocaleDateString('en-AU')}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Button
      onClick={handlePrintLabel}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print Label
    </Button>
  );
};