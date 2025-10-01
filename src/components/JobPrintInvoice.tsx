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
              body { font-family: Arial, sans-serif; font-size: 11px; }
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
              line-height: 1.4;
              color: #333;
              font-size: 11px;
            }
            .invoice-container {
              max-width: 800px;
              background: white;
              margin: 0 auto;
              border: 1px solid #e5e7eb;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1e40af;
            }
            .company-info {
              flex: 1;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              margin: 0 0 10px 0;
            }
            .company-details {
              font-size: 10px;
              line-height: 1.6;
              color: #555;
            }
            .company-details strong {
              color: #333;
            }
            .invoice-title-section {
              text-align: right;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #1e40af;
              margin: 0;
            }
            .order-info {
              margin-top: 10px;
              font-size: 10px;
              text-align: right;
            }
            .order-info div {
              margin: 3px 0;
            }
            .addresses-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              gap: 15px;
            }
            .address-box {
              flex: 1;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .address-box h3 {
              margin: 0 0 10px 0;
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
            }
            .address-box p {
              margin: 3px 0;
              font-size: 10px;
              line-height: 1.5;
            }
            .problem-service-section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              margin: 15px 0 8px 0;
              text-transform: uppercase;
            }
            .section-content {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 4px;
              border-left: 3px solid #1e40af;
              font-size: 10px;
              line-height: 1.5;
            }
            .parts-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 10px;
            }
            .parts-table thead {
              background: #1e40af;
              color: white;
            }
            .parts-table th {
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              border: 1px solid #1e40af;
            }
            .parts-table td {
              padding: 8px;
              border: 1px solid #e5e7eb;
              background: white;
            }
            .parts-table tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            .parts-table .qty, .parts-table .tax, .parts-table .price {
              text-align: right;
            }
            .payment-totals {
              display: flex;
              justify-content: flex-end;
              gap: 20px;
              margin-top: 20px;
            }
            .payment-method {
              flex: 1;
              max-width: 200px;
            }
            .payment-method-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .payment-method-value {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
              font-size: 10px;
            }
            .totals-table {
              min-width: 300px;
            }
            .totals-table table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 12px;
              font-size: 11px;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-table .total-label {
              text-align: right;
              font-weight: 500;
              text-transform: uppercase;
            }
            .totals-table .total-amount {
              text-align: right;
              font-weight: 600;
              min-width: 100px;
            }
            .totals-table .subtotal-row {
              background: #f8f9fa;
            }
            .totals-table .total-row {
              background: #1e40af;
              color: white;
              font-size: 13px;
              font-weight: bold;
            }
            .totals-table .total-row td {
              border-bottom: none;
            }
            .totals-table .paid-row {
              background: #22c55e;
              color: white;
              font-weight: bold;
            }
            .totals-table .paid-row td {
              border-bottom: none;
            }
            .totals-table .due-row {
              background: #f59e0b;
              color: white;
              font-size: 14px;
              font-weight: bold;
            }
            .totals-table .due-row td {
              border-bottom: none;
              padding: 12px;
            }
            .totals-table .deposit-row {
              color: #ea580c;
              font-weight: 600;
            }
            .thank-you {
              margin-top: 40px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
              text-align: center;
            }
            .thank-you-title {
              font-size: 14px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .thank-you-text {
              font-size: 10px;
              line-height: 1.6;
              color: #555;
            }
            .terms-section {
              margin-top: 30px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .terms-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
              text-align: center;
              text-transform: uppercase;
            }
            .terms-content {
              font-size: 9px;
              line-height: 1.5;
              color: #555;
            }
            .terms-content ol {
              margin: 0;
              padding-left: 20px;
            }
            .terms-content li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <h1 class="company-name">Mowercentre</h1>
                <div class="company-details">
                  <strong>ABN:</strong> 97 161 289 069<br>
                  <strong>HAMPTON</strong><br>
                  87 Ludstone Street / Hampton<br>
                  VIC 3188 / Australia<br><br>
                  <strong>Email:</strong> hamptonmowerpower@gmail.com<br>
                  <strong>Web:</strong> www.hamptonmowerpower.com.au<br>
                  <strong>Phone:</strong> 03-95986741
                </div>
              </div>
              <div class="invoice-title-section">
                <h2 class="invoice-title">INVOICE</h2>
                <div class="order-info">
                  <div><strong>ORDER NO:</strong> #${escapeHtml(job.jobNumber)}</div>
                  <div><strong>ORDER DATE:</strong> ${new Date(job.createdAt).toLocaleString('en-AU', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: false 
                  }).replace(',', '')}</div>
                  ${job.completedAt ? `<div><strong>COMPLETED:</strong> ${new Date(job.completedAt).toLocaleString('en-AU', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit',
                    hour12: false 
                  })}</div>` : ''}
                  <div><strong>STATUS:</strong> ${job.status.toUpperCase()}</div>
                </div>
              </div>
            </div>

            <!-- Addresses -->
            <div class="addresses-section">
              <div class="address-box">
                <h3>Customer Address</h3>
                <p><strong>${escapeHtml(job.customer.name)}</strong></p>
                <p>${escapeHtml(job.customer.address)}</p>
                ${job.customer.email ? `<p>${escapeHtml(job.customer.email)}</p>` : ''}
                <p>${escapeHtml(job.customer.phone)}</p>
              </div>
              <div class="address-box">
                <h3>Equipment Details</h3>
                <p><strong>Type:</strong> ${escapeHtml(job.machineCategory)}</p>
                <p><strong>Brand:</strong> ${escapeHtml(job.machineBrand)}</p>
                <p><strong>Model:</strong> ${escapeHtml(job.machineModel)}</p>
                ${job.machineSerial ? `<p><strong>Serial:</strong> ${escapeHtml(job.machineSerial)}</p>` : ''}
              </div>
            </div>

            <!-- Problem & Service -->
            <div class="problem-service-section">
              <div class="section-title">Problem Description</div>
              <div class="section-content">
                ${escapeHtml(job.problemDescription)}
                ${job.notes ? `<br><br><strong>Notes:</strong> ${escapeHtml(job.notes)}` : ''}
              </div>
              
              ${(job.servicePerformed || job.recommendations) ? `
              <div class="section-title" style="margin-top: 15px;">Service Completed</div>
              <div class="section-content" style="border-left-color: #22c55e;">
                ${job.servicePerformed ? `<strong>Work Performed:</strong> ${escapeHtml(job.servicePerformed)}` : ''}
                ${job.recommendations ? `<br><br><strong>Recommendations:</strong> ${escapeHtml(job.recommendations)}` : ''}
              </div>
              ` : ''}
            </div>

            <!-- Parts Table -->
            ${job.parts.length > 0 ? `
            <table class="parts-table">
              <thead>
                <tr>
                  <th style="width: 50%;">TITLE</th>
                  <th style="width: 15%;">SKU</th>
                  <th class="qty" style="width: 10%;">QTY</th>
                  <th class="tax" style="width: 10%;">TAX</th>
                  <th class="price" style="width: 15%;">UNIT PRICE</th>
                  <th class="price" style="width: 15%;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${job.parts.map(part => `
                  <tr>
                    <td>${escapeHtml(part.partName)}</td>
                    <td>${escapeHtml(part.partId)}</td>
                    <td class="qty">${part.quantity}</td>
                    <td class="tax">10%</td>
                    <td class="price">${formatCurrency(part.unitPrice)}</td>
                    <td class="price">${formatCurrency(part.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}

            <!-- Payment Method & Totals -->
            <div class="payment-totals">
              <div class="payment-method">
                <div class="payment-method-title">Payment Method</div>
                <div class="payment-method-value">
                  ${job.serviceDeposit > 0 ? 'Partial Payment' : 'Cash / Card'}
                </div>
              </div>
              <div class="totals-table">
                <table>
                  ${job.parts.length > 0 ? `
                  <tr class="subtotal-row">
                    <td class="total-label">Sub Total:</td>
                    <td class="total-amount">${formatCurrency(job.partsSubtotal)}</td>
                  </tr>
                  ` : ''}
                  <tr class="subtotal-row">
                    <td class="total-label">Labour (${job.labourHours}h @ ${formatCurrency(job.labourRate)}/h):</td>
                    <td class="total-amount">${formatCurrency(job.labourHours * job.labourRate)}</td>
                  </tr>
                  <tr class="subtotal-row">
                    <td class="total-label">Tax (GST 10%):</td>
                    <td class="total-amount">${formatCurrency(job.gst)}</td>
                  </tr>
                  <tr class="total-row">
                    <td class="total-label">Total:</td>
                    <td class="total-amount">${formatCurrency(job.grandTotal)}</td>
                  </tr>
                  ${job.serviceDeposit && job.serviceDeposit > 0 ? `
                  <tr class="paid-row">
                    <td class="total-label">Paid:</td>
                    <td class="total-amount">${formatCurrency(job.serviceDeposit)}</td>
                  </tr>
                  <tr class="due-row">
                    <td class="total-label">Amount Due:</td>
                    <td class="total-amount">${formatCurrency(Math.max(0, job.grandTotal - job.serviceDeposit))}</td>
                  </tr>
                  ` : `
                  <tr class="due-row">
                    <td class="total-label">Amount Due:</td>
                    <td class="total-amount">${formatCurrency(job.grandTotal)}</td>
                  </tr>
                  `}
                </table>
              </div>
            </div>

            <!-- Thank You Message -->
            <div class="thank-you">
              <div class="thank-you-title">Thanks for your business.</div>
              <div class="thank-you-text">
                We truly appreciate your trust, and we'll do our best to continue to give you the service you deserve.<br>
                We look forward to serving you again.
              </div>
            </div>

            <!-- Terms -->
            <div class="terms-section">
              <div class="terms-title">Repair Contract Conditions</div>
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