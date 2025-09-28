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

    // Helper function to escape HTML content
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Generate parts table rows
    const partsRows = job.parts.map(part => 
      `<tr>
        <td>${escapeHtml(part.partName)}</td>
        <td class="qty">${part.quantity}</td>
        <td class="price">${formatCurrency(part.unitPrice)}</td>
        <td class="price">${formatCurrency(part.totalPrice)}</td>
      </tr>`
    ).join('');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${escapeHtml(job.jobNumber)}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
              body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
            }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
              line-height: 1.5;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              background: white;
              margin: 0 auto;
            }
            .invoice-title {
              background: #f8fafc;
              padding: 10px;
              margin: 20px 0;
              border-radius: 4px;
              text-align: center;
            }
            .invoice-title h2 {
              margin: 0;
              font-size: 20px;
              color: #1e40af;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .customer-machine {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            .customer-info, .machine-info {
              width: 48%;
              background: #f9fafb;
              padding: 15px;
              border-radius: 4px;
            }
            .customer-info h3, .machine-info h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #1e40af;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .customer-info p, .machine-info p {
              margin: 3px 0;
              font-size: 11px;
            }
            .problem-section {
              background: #fef3c7;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
              border-left: 4px solid #f59e0b;
            }
            .service-section {
              background: #dcfce7;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
              border-left: 4px solid #22c55e;
            }
            .parts-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .parts-table th, .parts-table td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              text-align: left;
            }
            .parts-table th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            .parts-table .qty, .parts-table .price {
              text-align: right;
            }
            .totals {
              float: right;
              width: 300px;
              margin-top: 20px;
            }
            .totals table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .totals td {
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals .total-label {
              font-weight: 500;
              text-align: right;
              color: #374151;
            }
            .totals .total-amount {
              text-align: right;
              font-weight: 600;
            }
            .grand-total {
              background: #1e40af;
              color: white;
              font-size: 14px;
            }
            .grand-total td {
              border-bottom: none;
            }
            .terms-section {
              clear: both;
              margin-top: 40px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .terms-title {
              font-size: 14px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 10px;
              text-align: center;
            }
            .terms-content {
              font-size: 10px;
              line-height: 1.4;
              color: #4b5563;
            }
            .terms-content ol {
              margin: 0;
              padding-left: 15px;
            }
            .terms-content li {
              margin-bottom: 4px;
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

            <div class="invoice-title">
              <h2>TAX INVOICE</h2>
            </div>

            <div class="invoice-meta">
              <div>
                <strong>Job Number:</strong> ${escapeHtml(job.jobNumber)}<br>
                <strong>Invoice Date:</strong> ${new Date(job.createdAt).toLocaleDateString('en-AU')}<br>
                <strong>Status:</strong> ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </div>
              <div style="text-align: right;">
                ${job.completedAt ? `<strong>Completion Date:</strong> ${new Date(job.completedAt).toLocaleDateString('en-AU')}` : ''}
              </div>
            </div>

            <div class="customer-machine">
              <div class="customer-info">
                <h3>Customer Details</h3>
                <p><strong>${escapeHtml(job.customer.name)}</strong></p>
                <p>${escapeHtml(job.customer.phone)}</p>
                <p>${escapeHtml(job.customer.address)}</p>
                ${job.customer.email ? `<p>${escapeHtml(job.customer.email)}</p>` : ''}
              </div>
              <div class="machine-info">
                <h3>Equipment Details</h3>
                <p><strong>Type:</strong> ${escapeHtml(job.machineCategory)}</p>
                <p><strong>Brand:</strong> ${escapeHtml(job.machineBrand)}</p>
                <p><strong>Model:</strong> ${escapeHtml(job.machineModel)}</p>
                ${job.machineSerial ? `<p><strong>Serial:</strong> ${escapeHtml(job.machineSerial)}</p>` : ''}
              </div>
            </div>

            <div class="problem-section">
              <h3 style="margin-top: 0; color: #92400e;">Problem Description</h3>
              <p>${escapeHtml(job.problemDescription)}</p>
              ${job.notes ? `<p><strong>Additional Notes:</strong> ${escapeHtml(job.notes)}</p>` : ''}
            </div>

            ${(job.servicePerformed || job.recommendations) ? `
            <div class="service-section">
              <h3 style="margin-top: 0; color: #16a34a;">Service Completed</h3>
              ${job.servicePerformed ? `<p><strong>Work Performed:</strong> ${escapeHtml(job.servicePerformed)}</p>` : ''}
              ${job.recommendations ? `<p><strong>Recommendations:</strong> ${escapeHtml(job.recommendations)}</p>` : ''}
            </div>
            ` : ''}

            ${job.parts.length > 0 ? `
            ${job.partsRequired ? `<p style="margin-bottom: 15px;"><strong>Parts Required:</strong> ${escapeHtml(job.partsRequired)}</p>` : ''}
            <h3 style="color: #1e40af; margin-bottom: 10px;">Parts & Materials</h3>
            <table class="parts-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="qty">Qty</th>
                  <th class="price">Unit Price</th>
                  <th class="price">Total</th>
                </tr>
              </thead>
              <tbody>
                ${partsRows}
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
                  <tr>
                    <td class="total-label">Subtotal (excl. GST):</td>
                    <td class="total-amount">${formatCurrency(job.subtotal)}</td>
                  </tr>
                  <tr>
                    <td class="total-label">GST (10%):</td>
                    <td class="total-amount">${formatCurrency(job.gst)}</td>
                  </tr>
                  <tr class="grand-total">
                    <td class="total-label">TOTAL AMOUNT DUE:</td>
                    <td class="total-amount">${formatCurrency(job.grandTotal)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-title">REPAIR CONTRACT CONDITIONS</div>
              <div class="terms-content">
                <ol>
                  <li>All domestic customer service work is guaranteed for 90 days from completion date.</li>
                  <li>All commercial customer service work is covered by floor warranty only (as provided by the manufacturer or distributor).</li>
                  <li>Customer machines left for more than 30 days after completion may incur storage charges.</li>
                  <li>Estimates are valid for 30 days. Additional charges may apply for work beyond original estimate.</li>
                  <li>Payment is due upon completion unless prior arrangements have been made.</li>
                  <li>We are not responsible for machines left unattended on premises.</li>
                  <li>Customer agrees to pay all repair costs even if machine proves economically unviable to repair.</li>
                  <li>Used parts may be supplied unless specifically requested otherwise.</li>
                  <li>Warranty does not cover abuse, normal wear, or damage caused by poor maintenance.</li>
                </ol>
              </div>
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