import React from 'react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface JobPrintInvoiceProps {
  job: Job;
}

export const JobPrintInvoice: React.FC<JobPrintInvoiceProps> = ({ job }) => {
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${job.jobNumber}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 11px; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
              line-height: 1.4;
            }
            .invoice-container {
              max-width: 800px;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-info h1 {
              margin: 0;
              font-size: 28px;
              color: #000;
            }
            .company-info p {
              margin: 5px 0;
              color: #666;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              margin: 0;
              font-size: 24px;
              color: #000;
            }
            .customer-machine {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .customer-info, .machine-info {
              width: 48%;
            }
            .customer-info h3, .machine-info h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #000;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .problem-section {
              background: #f9f9f9;
              padding: 15px;
              margin-bottom: 20px;
              border-left: 4px solid #333;
            }
            .parts-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .parts-table th, .parts-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .parts-table th {
              background: #f5f5f5;
              font-weight: bold;
            }
            .parts-table .qty, .parts-table .price {
              text-align: right;
            }
            .totals {
              float: right;
              width: 300px;
            }
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            .totals .total-label {
              font-weight: bold;
              text-align: right;
            }
            .totals .total-amount {
              text-align: right;
              font-weight: bold;
            }
            .grand-total {
              background: #000;
              color: white;
              font-size: 16px;
            }
            .footer {
              clear: both;
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              color: #666;
              font-size: 10px;
            }
            .clearfix::after {
              content: "";
              display: table;
              clear: both;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <h1>HAMPTON MOWERPOWER</h1>
                <p>Garden Equipment Sales & Service</p>
                <p>87 Ludstone Street, Hampton 3188</p>
                <p>(03) 9598 6741 | https://www.hamptonmowerpower.com.au</p>
                <p>ABN: 97 161 289 069</p>
              </div>
              <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>Job #:</strong> ${job.jobNumber}</p>
                <p><strong>Date:</strong> ${new Date(job.createdAt).toLocaleDateString('en-AU')}</p>
                <p><strong>Status:</strong> ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}</p>
              </div>
            </div>

            <div class="customer-machine">
              <div class="customer-info">
                <h3>Customer Details</h3>
                <p><strong>${job.customer.name}</strong></p>
                <p>${job.customer.phone}</p>
                <p>${job.customer.address}</p>
                ${job.customer.email ? `<p>${job.customer.email}</p>` : ''}
              </div>
              <div class="machine-info">
                <h3>Machine Details</h3>
                <p><strong>Type:</strong> ${job.machineCategory}</p>
                <p><strong>Brand:</strong> ${job.machineBrand}</p>
                <p><strong>Model:</strong> ${job.machineModel}</p>
                ${job.machineSerial ? `<p><strong>Serial:</strong> ${job.machineSerial}</p>` : ''}
              </div>
            </div>

            <div class="problem-section">
              <h3 style="margin-top: 0;">Problem Description</h3>
              <p>${job.problemDescription}</p>
              ${job.notes ? `<p><strong>Notes:</strong> ${job.notes}</p>` : ''}
            </div>

            ${job.parts.length > 0 ? `
            <h3>Parts Used</h3>
            <table class="parts-table">
              <thead>
                <tr>
                  <th>Part Description</th>
                  <th class="qty">Qty</th>
                  <th class="price">Unit Price</th>
                  <th class="price">Total</th>
                </tr>
              </thead>
              <tbody>
                ${job.parts.map(part => `
                  <tr>
                    <td>${part.partName}</td>
                    <td class="qty">${part.quantity}</td>
                    <td class="price">${formatCurrency(part.unitPrice)}</td>
                    <td class="price">${formatCurrency(part.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}

            <div class="clearfix">
              <div class="totals">
                <table>
                  ${job.parts.length > 0 ? `
                  <tr>
                    <td class="total-label">Parts Subtotal:</td>
                    <td class="total-amount">${formatCurrency(job.partsSubtotal)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td class="total-label">Labour (${job.labourHours} hrs @ ${formatCurrency(job.labourRate)}/hr):</td>
                    <td class="total-amount">${formatCurrency(job.labourHours * job.labourRate)}</td>
                  </tr>
                  ${job.labelCharge > 0 ? `
                  <tr>
                    <td class="total-label">Service Charge:</td>
                    <td class="total-amount">${formatCurrency(job.labelCharge)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td class="total-label">Subtotal:</td>
                    <td class="total-amount">${formatCurrency(job.subtotal)}</td>
                  </tr>
                  <tr>
                    <td class="total-label">GST (10%):</td>
                    <td class="total-amount">${formatCurrency(job.gst)}</td>
                  </tr>
                  <tr class="grand-total">
                    <td class="total-label">TOTAL:</td>
                    <td class="total-amount">${formatCurrency(job.grandTotal)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="footer">
              <p><strong>Thank you for choosing Hampton Mowerpower!</strong></p>
              <p><strong>REPAIR CONTRACT CONDITIONS:</strong></p>
              <p style="text-align: left; font-size: 9px; line-height: 1.2;">
                1. All work is guaranteed for 90 days from completion date.<br>
                2. Customer machines left for more than 30 days after completion may incur storage charges.<br>
                3. Estimates are valid for 30 days. Additional charges may apply for work beyond original estimate.<br>
                4. Payment is due upon completion unless prior arrangements have been made.<br>
                5. We are not responsible for machines left unattended on premises.<br>
                6. Customer agrees to pay all repair costs even if machine proves economically unviable to repair.<br>
                7. Used parts may be supplied unless specifically requested otherwise.<br>
                8. Warranty does not cover abuse, normal wear, or damage caused by poor maintenance.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Button
      onClick={handlePrintInvoice}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      Print Invoice
    </Button>
  );
};