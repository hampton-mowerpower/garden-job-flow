import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import hamptonLogo from '@/assets/hampton-logo.png';

interface JobPrintInvoiceProps {
  job: Job;
}

// Comprehensive service checklist data for all equipment categories
const SERVICE_CHECKLISTS = {
  universal: [
    'Engine compression test',
    'Adjust carb/tune (idle/high)',
    'Flush/replace stale fuel; clean tank',
    'Charge/test battery (where fitted)',
    'Verify operating performance under load',
    'Inspect all electrical wiring/connectors',
    'Check oil level/quality; inspect for leaks',
    'Inspect/clean/replace air filter',
    'Inspect/replace spark plug; gap check',
    'Check coil/ignition output',
    'Check/adjust governor spring/linkage',
    'Inspect throttle cable & return spring',
    'Inspect brake/stop switch operation',
    'Check belt condition/tension (if fitted)',
    'Grease gearbox/shaft points (if fitted)',
    'Inspect fasteners/mounts for vibration',
    'Test safety features (stops/guards)',
    'Document recommendations/parts required'
  ],
  'lawn-mower': [
    'Blade condition & balance; secure blade carrier',
    'Deck clean; chute & catcher fitment',
    'Height adjuster operation',
    'Wheel/tyre/bearings; handle locks and cables'
  ],
  'lawn-mowers': [
    'Blade condition & balance; secure blade carrier',
    'Deck clean; chute & catcher fitment',
    'Height adjuster operation',
    'Wheel/tyre/bearings; handle locks and cables'
  ],
  'ride-on': [
    'Deck spindle/bearing noise; blade set & torque',
    'Deck level/cut height calibration',
    'PTO clutch engagement/disengagement',
    'Hydrostatic drive performance; leaks',
    'Steering/controls neutral & tracking',
    'Battery/charging system (stator/rectifier)',
    'Seat switch & all safety interlocks',
    'Tyre pressures; wheel nuts; tow hitch'
  ],
  'ride-on-mower': [
    'Deck spindle/bearing noise; blade set & torque',
    'Deck level/cut height calibration',
    'PTO clutch engagement/disengagement',
    'Hydrostatic drive performance; leaks',
    'Steering/controls neutral & tracking',
    'Battery/charging system (stator/rectifier)',
    'Seat switch & all safety interlocks',
    'Tyre pressures; wheel nuts; tow hitch'
  ],
  'trimmers': [
    'Head/line feed; guard condition',
    'Shaft/gearbox grease; anti-vibe mounts',
    'Trigger/throttle cable smoothness'
  ],
  'brushcutters': [
    'Head/line feed; guard condition',
    'Shaft/gearbox grease; anti-vibe mounts',
    'Trigger/throttle cable smoothness',
    'Blade/disc guard & fixings'
  ],
  'line-trimmer': [
    'Head/line feed; guard condition',
    'Shaft/gearbox grease; anti-vibe mounts',
    'Trigger/throttle cable smoothness'
  ],
  'chainsaw': [
    'Chain sharpness, depth gauges; bar wear',
    'Chain tension; oiler flow & oil pump drive',
    'Chain brake function; clutch/sprocket condition',
    'AV mounts; choke/primer operation'
  ],
  'chainsaws': [
    'Chain sharpness, depth gauges; bar wear',
    'Chain tension; oiler flow & oil pump drive',
    'Chain brake function; clutch/sprocket condition',
    'AV mounts; choke/primer operation'
  ],
  'blower': [
    'Impeller/fan housing clearance & damage',
    'Cruise control/trigger; vac bag/zip condition'
  ],
  'blowers': [
    'Impeller/fan housing clearance & damage',
    'Cruise control/trigger; vac bag/zip condition'
  ],
  'hedge-trimmer': [
    'Blade sharpness; gear case lubrication',
    'Blade timing/clearance; tip guard'
  ],
  'hedge-trimmers': [
    'Blade sharpness; gear case lubrication',
    'Blade timing/clearance; tip guard'
  ],
  'pole-pruner': [
    'Pole locks; drive couplings; chain/bar/oiler'
  ],
  'pole-pruners': [
    'Pole locks; drive couplings; chain/bar/oiler'
  ],
  'edger': [
    'Blade wear & guard; belt tension; height adjuster'
  ],
  'edgers': [
    'Blade wear & guard; belt tension; height adjuster'
  ],
  'demo-saw': [
    'Belt tension; water kit flow; guard; decompressor'
  ],
  'power-cutter': [
    'Belt tension; water kit flow; guard; decompressor'
  ],
  'tiller': [
    'Tine wear/bent shafts; gearbox oil/grease',
    'Drive belts/chains; safety lever'
  ],
  'tillers': [
    'Tine wear/bent shafts; gearbox oil/grease',
    'Drive belts/chains; safety lever'
  ],
  'cultivator': [
    'Tine wear/bent shafts; gearbox oil/grease',
    'Drive belts/chains; safety lever'
  ],
  'cultivators': [
    'Tine wear/bent shafts; gearbox oil/grease',
    'Drive belts/chains; safety lever'
  ],
  'shredder': [
    'Knife/shredder flail condition & torque',
    'Feed chute/safety switch; discharge guard'
  ],
  'chipper': [
    'Knife/shredder flail condition & torque',
    'Feed chute/safety switch; discharge guard'
  ],
  'automower': [
    'Blade disc & blades; wheel motors',
    'Firmware/boundary settings; base station power',
    'Battery health (diagnostics); sensor tests'
  ],
  'generator': [
    'Output voltage/frequency at load',
    'AVR operation; fuel & oil leaks',
    'Recoil/electric start; low-oil shutdown'
  ],
  'generators': [
    'Output voltage/frequency at load',
    'AVR operation; fuel & oil leaks',
    'Recoil/electric start; low-oil shutdown'
  ],
  'pressure-washer': [
    'Pump pressure & leaks; unloader valve',
    'Hose/lance/nozzle integrity; detergent pickup'
  ],
  'pressure-washers': [
    'Pump pressure & leaks; unloader valve',
    'Hose/lance/nozzle integrity; detergent pickup'
  ],
  'water-pump': [
    'Prime test; flow rate; seals/leaks',
    'Suction screen; impeller wear'
  ],
  'water-pumps': [
    'Prime test; flow rate; seals/leaks',
    'Suction screen; impeller wear'
  ],
  'engine': [
    'Compression; governor setup; oil/fuel leaks',
    'Throttle/choke; charging coil output'
  ],
  'engines': [
    'Compression; governor setup; oil/fuel leaks',
    'Throttle/choke; charging coil output'
  ]
};

export const JobPrintInvoice: React.FC<JobPrintInvoiceProps> = ({ job }) => {
  const handlePrintInvoice = () => {
    const escapeHtml = (unsafe: string): string => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    
    const isAccountCustomer = job.customer.notes?.toLowerCase().includes('account') || false;
    const issueDate = job.createdAt || new Date();
    const dueDate = isAccountCustomer ? new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000) : issueDate;
    const paymentTerms = isAccountCustomer ? 'Net 30 Days (Account)' : 'Paid on Collection';
    const paymentBadge = isAccountCustomer ? 'PAYMENT DUE: 30 DAYS (ACCOUNT)' : 'PAYMENT DUE: ON COLLECTION';
    const balanceDue = Math.max(0, job.grandTotal - (job.serviceDeposit || 0));
    const categoryKey = job.machineCategory?.toLowerCase().replace(/\s+/g, '-') || '';
    const relevantChecklist = SERVICE_CHECKLISTS[categoryKey as keyof typeof SERVICE_CHECKLISTS] || [];

    const invoiceHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${escapeHtml(job.jobNumber)} - Hampton Mowerpower</title>
  <style>
    @page { size: A4; margin: 12mm 18mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif; 
      font-size: 14px; 
      line-height: 1.45; 
      color: #0f172a;
      background: #ffffff;
    }
    .invoice-header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .logo-container {
      margin-bottom: 4px;
    }
    .logo { 
      max-width: 280px; 
      height: auto;
      display: block;
    }
    .company-line {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .header-right {
      text-align: right;
      min-width: 280px;
    }
    .invoice-title {
      background: #0f172a;
      color: white;
      padding: 10px 24px;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      display: inline-block;
      letter-spacing: 1px;
    }
    .invoice-meta {
      font-size: 13px;
      line-height: 1.7;
      color: #0f172a;
    }
    .invoice-meta-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      margin-bottom: 4px;
      text-align: left;
    }
    .invoice-meta-label {
      font-weight: 600;
      color: #0f172a;
    }
    .payment-due-badge {
      background: #0f172a;
      color: white;
      padding: 8px 16px;
      margin-top: 12px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .info-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .panel {
      border: 1px solid #e2e8f0;
      padding: 16px;
      background: #ffffff;
    }
    .panel-title {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      color: #0f172a;
      padding-bottom: 6px;
      border-bottom: 2px solid #0f172a;
    }
    .panel-content {
      font-size: 13px;
      line-height: 1.6;
      color: #0f172a;
    }
    .panel-content p { margin-bottom: 4px; }
    .panel-content strong { font-weight: 600; color: #0f172a; }
    .equipment-section {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      background: #ffffff;
    }
    .concern-section {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      background: #ffffff;
    }
    .concern-section .section-title {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .concern-section .section-content {
      font-size: 13px;
      line-height: 1.6;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .invoice-details-title {
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      color: #0f172a;
      padding-bottom: 6px;
      border-bottom: 2px solid #0f172a;
    }
    .parts-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .parts-table thead {
      background: #0f172a;
      color: white;
    }
    .parts-table th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .parts-table td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .payment-terms-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      margin-bottom: 20px;
      align-items: start;
    }
    .payment-details {
      border: 1px solid #e2e8f0;
      padding: 16px;
      background: #f8fafc;
    }
    .payment-details h3 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      color: #0f172a;
    }
    .payment-details p {
      font-size: 13px;
      line-height: 1.7;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .payment-details strong {
      font-weight: 600;
      color: #0f172a;
    }
    .totals-card {
      min-width: 360px;
      border: 1px solid #e2e8f0;
      background: #fff;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #0f172a;
    }
    .totals-row.subtotal {
      background: #f8fafc;
      font-weight: 600;
    }
    .totals-row.gst {
      background: #f8fafc;
    }
    .totals-row.total {
      background: #0f172a;
      color: white;
      font-weight: 700;
      font-size: 16px;
      border-bottom: none;
    }
    .totals-row.deposit {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 600;
    }
    .totals-row.paid {
      background: #f8fafc;
      color: #0f172a;
    }
    .totals-row.balance {
      background: #0f172a;
      color: white;
      font-weight: 700;
      font-size: 16px;
      border-bottom: none;
    }
    .invoice-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
    .footer-company {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .thank-you {
      margin-top: 8px;
      font-size: 11px;
      color: #64748b;
    }
    .page-break {
      page-break-before: always;
    }
    .checklist-section {
      margin-top: 20px;
    }
    .checklist-title {
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      color: #0f172a;
      padding-bottom: 8px;
      border-bottom: 2px solid #0f172a;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .checklist-item {
      font-size: 11px;
      padding: 6px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      line-height: 1.4;
      color: #0f172a;
    }
    .checklist-item::before {
      content: '☐';
      margin-right: 6px;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="header-left">
        <div class="logo-container">
          <img src="${hamptonLogo}" alt="Hampton Mowerpower" class="logo"/>
        </div>
        <div class="company-line">
          <strong>ABN 97 161 289 069</strong> · 87 Ludstone Street, Hampton, VIC 3188 · hamptonmowerpower@gmail.com · (03) 9598-6741 · hamptonmowerpower.com.au
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice #:</span>
            <span>${escapeHtml(job.jobNumber)}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Issue date:</span>
            <span>${format(issueDate, 'dd MMM yyyy')}</span>
          </div>
        </div>
        <div class="payment-due-badge">Payment Due: ${paymentBadge.replace('PAYMENT DUE: ', '').toUpperCase()}</div>
      </div>
    </div>

    <!-- Customer & Job Info Panels -->
    <div class="info-panels">
      <div class="panel">
        <div class="panel-title">Bill To</div>
        <div class="panel-content">
          <p><strong>${escapeHtml(job.customer.name)}</strong></p>
          ${job.customer.email ? `<p>${escapeHtml(job.customer.email)} · ${escapeHtml(job.customer.phone)}</p>` : `<p>${escapeHtml(job.customer.phone)}</p>`}
          <p>${escapeHtml(job.customer.address)}</p>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">Job Summary</div>
        <div class="panel-content">
          <p><strong>Work Order:</strong> ${escapeHtml(job.jobNumber)}</p>
          <p><strong>Job Type:</strong> Service & Repair</p>
          <p><strong>Drop-off:</strong> ${format(job.createdAt, 'dd MMM yyyy, h:mmaaa')}</p>
          ${job.completedAt ? `<p><strong>Completed:</strong> ${format(job.completedAt, 'dd MMM yyyy, h:mmaaa')}</p>` : ''}
          <p><strong>Status:</strong> ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}</p>
        </div>
      </div>
    </div>

    <!-- Equipment Details -->
    <div class="equipment-section">
      <div class="panel-title">Equipment Details</div>
      <div class="panel-content">
        <p><strong>Brand/Make:</strong> ${escapeHtml(job.machineBrand)}</p>
        <p><strong>Model:</strong> ${escapeHtml(job.machineModel)}</p>
        ${job.machineSerial ? `<p><strong>Serial:</strong> ${escapeHtml(job.machineSerial)}</p>` : ''}
        <p><strong>Category:</strong> ${escapeHtml(job.machineCategory)}</p>
      </div>
    </div>

    <!-- Customer Concern & Diagnosis -->
    ${job.problemDescription ? `
    <div class="concern-section">
      <div class="section-title">Customer Concern</div>
      <div class="section-content">${escapeHtml(job.problemDescription)}</div>
      ${job.servicePerformed ? `
      <div class="section-title" style="margin-top:12px;">Technician Diagnosis</div>
      <div class="section-content">${escapeHtml(job.servicePerformed)}</div>
      ` : ''}
      ${job.recommendations ? `
      <div class="section-title" style="margin-top:12px;">Recommendations</div>
      <div class="section-content">${escapeHtml(job.recommendations)}</div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Invoice Details -->
    <div class="invoice-details-title">Invoice Details</div>
    
    <!-- Parts & Labour Table -->
    <table class="parts-table">
      <thead>
        <tr>
          <th>Item / SKU</th>
          <th>Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit (ex GST)</th>
          <th class="text-center">GST %</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${job.parts.map(part => {
          const unitExGST = part.unitPrice / 1.10;
          const lineTotal = part.totalPrice;
          return `<tr>
            <td>${escapeHtml(part.partId)}</td>
            <td>${escapeHtml(part.partName)}</td>
            <td class="text-center">${part.quantity}</td>
            <td class="text-right">${formatCurrency(unitExGST)}</td>
            <td class="text-center">10%</td>
            <td class="text-right">${formatCurrency(lineTotal)}</td>
          </tr>`;
        }).join('')}
        ${job.labourHours > 0 ? `
        <tr>
          <td>LABOUR</td>
          <td>Labour (${job.labourHours}h @ ${formatCurrency(job.labourRate)}/hr)</td>
          <td class="text-center">1</td>
          <td class="text-right">${formatCurrency(job.labourTotal / 1.10)}</td>
          <td class="text-center">10%</td>
          <td class="text-right">${formatCurrency(job.labourTotal)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <!-- Payment Terms & Totals -->
    <div class="payment-terms-section">
      <div class="payment-details">
        <h3>Payment Details</h3>
        <p><strong>Bank:</strong> National Australia Bank</p>
        <p><strong>BSB:</strong> 083-004</p>
        <p><strong>Account:</strong> 87-612-4455</p>
        <p><strong>PayID:</strong> hamptonmowerpower@gmail.com</p>
        <p style="margin-top:12px;"><strong>Accepted Methods:</strong> Cash, EFTPOS, Credit Card, Bank Transfer</p>
        <p>Please reference Invoice #${escapeHtml(job.jobNumber)} with all payments.</p>
      </div>
      <div class="totals-card">
        <div class="totals-row subtotal">
          <span>Subtotal (ex GST):</span>
          <span>${formatCurrency(job.subtotal)}</span>
        </div>
        <div class="totals-row gst">
          <span>GST (10%):</span>
          <span>${formatCurrency(job.gst)}</span>
        </div>
        <div class="totals-row total">
          <span>Total:</span>
          <span>${formatCurrency(job.grandTotal)}</span>
        </div>
        ${job.serviceDeposit > 0 ? `
        <div class="totals-row deposit">
          <span>Deposit / Prepayment:</span>
          <span>-${formatCurrency(job.serviceDeposit)}</span>
        </div>
        ` : ''}
        <div class="totals-row paid">
          <span>Amount Paid:</span>
          <span>${formatCurrency(job.serviceDeposit || 0)}</span>
        </div>
        <div class="totals-row balance">
          <span>Balance Due:</span>
          <span>${formatCurrency(balanceDue)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-company">HAMPTON MOWERPOWER · ABN 97 161 289 069 · 87 Ludstone Street, Hampton, VIC 3188</div>
      <div class="thank-you">Thank you for your business · Invoice ${escapeHtml(job.jobNumber)}</div>
    </div>
  </div>

  <!-- Page 2: Service Checklist -->
  <div class="page-break"></div>
  <div class="invoice-container">
    <!-- Header (repeated) -->
    <div class="invoice-header">
      <div class="header-left">
        <div class="logo-container">
          <img src="${hamptonLogo}" alt="Hampton Mowerpower" class="logo"/>
        </div>
        <div class="company-line">
          <strong>ABN 97 161 289 069</strong> · 87 Ludstone Street, Hampton, VIC 3188 · hamptonmowerpower@gmail.com · (03) 9598-6741 · hamptonmowerpower.com.au
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice #:</span>
            <span>${escapeHtml(job.jobNumber)}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Issue date:</span>
            <span>${format(issueDate, 'dd MMM yyyy')}</span>
          </div>
        </div>
        <div class="payment-due-badge">Payment Due: ${paymentBadge.replace('PAYMENT DUE: ', '').toUpperCase()}</div>
      </div>
    </div>

    <!-- Service Checklist -->
    <div class="checklist-section">
      <div class="checklist-title">Service Checklist — Universal</div>
      <div class="checklist-grid">
        ${SERVICE_CHECKLISTS.universal.map(item => `<div class="checklist-item">${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>

    ${relevantChecklist.length > 0 ? `
    <div class="checklist-section">
      <div class="checklist-title">Category: ${escapeHtml(job.machineCategory || '')}</div>
      <div class="checklist-grid">
        ${relevantChecklist.map(item => `<div class="checklist-item">${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-company">HAMPTON MOWERPOWER · ABN 97 161 289 069 · 87 Ludstone Street, Hampton, VIC 3188</div>
      <div class="thank-you">Thank you for your business · Invoice ${escapeHtml(job.jobNumber)}</div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <Button onClick={handlePrintInvoice} variant="default" size="sm">
      <FileText className="h-4 w-4 mr-2" />
      Print Invoice
    </Button>
  );
};
