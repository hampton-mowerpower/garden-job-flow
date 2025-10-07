import React from 'react';
import { Job } from '@/types/job';
import { COMPANY_DETAILS, getCompanyHeader } from '@/constants/company';
import QRCode from 'qrcode';
import { format } from 'date-fns';

interface ServiceLabel79mmProps {
  job: Job;
  dueDate?: string;
  printRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Service Label for 79mm thermal printers
 * Displays job info, customer details, and QR code for tracking
 */
export const ServiceLabel79mm: React.FC<ServiceLabel79mmProps> = ({
  job,
  dueDate,
  printRef
}) => {
  const [qrCode, setQrCode] = React.useState<string>('');
  const companyHeader = getCompanyHeader('thermal');

  React.useEffect(() => {
    // Generate QR code for job tracking
    const jobUrl = `${window.location.origin}/job/${job.id}`;
    QRCode.toDataURL(jobUrl, {
      width: 128,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(setQrCode).catch(console.error);
  }, [job.id]);

  // Truncate long text with ellipsis
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <div
      ref={printRef}
      className="bg-white text-black p-4"
      style={{
        width: '79mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4'
      }}
    >
      {/* Company Header - centered */}
      <div className="text-center mb-4 border-b-2 border-black pb-2">
        <div className="font-bold text-sm">{companyHeader.line1}</div>
        <div className="text-xs">{companyHeader.line2}</div>
        <div className="text-xs">{companyHeader.line3}</div>
      </div>

      {/* Job Info */}
      <div className="mb-3">
        <div className="font-bold text-base mb-1">
          JOB #{job.jobNumber}
        </div>
        {dueDate && (
          <div className="text-sm">
            <strong>DUE:</strong> {dueDate}
          </div>
        )}
        {job.requestedFinishDate && (
          <div className="bg-yellow-100 border-2 border-yellow-600 p-2 mt-2">
            <div className="font-bold text-sm">
              REQUESTED FINISH: {format(new Date(job.requestedFinishDate), 'dd MMM yyyy')}
            </div>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="mb-3 border-b border-gray-400 pb-2">
        <div className="font-bold">{truncate(job.customer.name, 35)}</div>
        <div className="text-sm">{job.customer.phone}</div>
      </div>

      {/* Machine Info */}
      <div className="mb-3 border-b border-gray-400 pb-2">
        <div className="font-bold">{job.machineCategory.toUpperCase()}</div>
        <div className="text-sm">
          {truncate(`${job.machineBrand} ${job.machineModel}`, 35)}
        </div>
        {job.machineSerial && (
          <div className="text-xs">S/N: {truncate(job.machineSerial, 30)}</div>
        )}
      </div>

      {/* Problem Description */}
      <div className="mb-3 border-b border-gray-400 pb-2">
        <div className="font-bold text-xs mb-1">PROBLEM:</div>
        <div className="text-xs whitespace-pre-wrap">
          {truncate(job.problemDescription, 120)}
        </div>
      </div>

      {/* Additional Notes (if any) */}
      {job.additionalNotes && (
        <div className="mb-3 border-b border-gray-400 pb-2">
          <div className="font-bold text-xs mb-1">ADDITIONAL NOTES:</div>
          <div className="text-xs whitespace-pre-wrap">
            {truncate(job.additionalNotes, 120)}
          </div>
        </div>
      )}
      
      {/* Staff Notes (if any) */}
      {job.notes && (
        <div className="mb-3 border-b border-gray-400 pb-2">
          <div className="font-bold text-xs mb-1">STAFF NOTES:</div>
          <div className="text-xs whitespace-pre-wrap">
            {truncate(job.notes, 120)}
          </div>
        </div>
      )}

      {/* QR Code for tracking */}
      {qrCode && (
        <div className="flex justify-center mt-4">
          <img src={qrCode} alt="Job QR Code" style={{ width: '96px', height: '96px' }} />
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs mt-3 pt-2 border-t border-gray-400">
        Scan QR for job details
      </div>
    </div>
  );
};

/**
 * Print the service label
 */
export const printServiceLabel = (labelRef: React.RefObject<HTMLDivElement>) => {
  if (!labelRef.current) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print labels');
    return;
  }

  const labelHTML = labelRef.current.innerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Service Label</title>
        <style>
          @media print {
            @page {
              size: 79mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: monospace;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${labelHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};