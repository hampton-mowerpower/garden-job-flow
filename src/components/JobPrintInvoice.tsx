import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      font-size: 10pt; 
      line-height: 1.4; 
      color: #1a1a1a;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #000;
    }
    .logo { max-width: 220px; height: auto; margin-bottom: 8px; }
    .company-details {
      font-size: 8pt;
      color: #444;
      line-height: 1.5;
    }
    .invoice-title {
      background: #000;
      color: white;
      padding: 8px 24px;
      font-size: 26pt;
      font-weight: bold;
      margin-bottom: 12px;
      display: inline-block;
    }
    .invoice-info {
      font-size: 9pt;
      line-height: 1.8;
    }
    .invoice-info div { margin-bottom: 4px; }
    .info-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .panel {
      border: 2px solid #ddd;
      padding: 12px;
      background: #f9fafb;
    }
    .panel-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
      color: #000;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }
    .panel-content {
      font-size: 9pt;
      line-height: 1.7;
    }
    .panel-content p { margin-bottom: 4px; }
    .equipment-section {
      margin-bottom: 20px;
      border: 2px solid #ddd;
      padding: 12px;
      background: #fffbeb;
    }
    .concern-section {
      margin-bottom: 20px;
      border: 2px solid #ddd;
      padding: 12px;
      background: #fef2f2;
    }
    .concern-section .panel-title {
      color: #dc2626;
      border-bottom-color: #dc2626;
    }
    .checklist-section {
      margin-bottom: 20px;
      border: 2px solid #ddd;
      padding: 12px;
      background: #f0fdf4;
      page-break-inside: avoid;
    }
    .checklist-section .panel-title {
      color: #16a34a;
      border-bottom-color: #16a34a;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-top: 10px;
    }
    .checklist-item {
      font-size: 8pt;
      padding: 5px;
      background: white;
      border: 1px solid #ccc;
      line-height: 1.3;
    }
    .checklist-item::before {
      content: '☐';
      margin-right: 6px;
      color: #16a34a;
      font-size: 10pt;
    }
    .parts-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 9pt;
    }
    .parts-table thead {
      background: #000;
      color: white;
    }
    .parts-table th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
    }
    .parts-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .totals-card {
      min-width: 380px;
      border: 3px solid #000;
      background: #fff;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
      font-size: 10pt;
    }
    .totals-row.subtotal {
      background: #f9fafb;
    }
    .totals-row.total {
      background: #000;
      color: white;
      font-weight: bold;
      font-size: 13pt;
      border-bottom: none;
    }
    .totals-row.deposit {
      background: #fef3c7;
      color: #92400e;
      font-weight: 600;
    }
    .totals-row.balance {
      background: #16a34a;
      color: white;
      font-weight: bold;
      font-size: 13pt;
      border-bottom: none;
    }
    .payment-badge {
      background: #dc2626;
      color: white;
      padding: 10px 15px;
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
    }
    .terms-section {
      margin-bottom: 20px;
      padding: 12px;
      border: 2px solid #ddd;
      background: #f9fafb;
      font-size: 8pt;
      line-height: 1.6;
    }
    .terms-section h3 {
      font-size: 10pt;
      margin-bottom: 6px;
    }
    .invoice-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 3px solid #000;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-size: 8pt;
    }
    .invoice-footer h4 {
      font-size: 10pt;
      margin-bottom: 6px;
    }
    .thank-you {
      text-align: center;
      margin-top: 15px;
      font-size: 10pt;
      font-style: italic;
      color: #666;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .checklist-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="header-left">
        <img src="${hamptonLogo}" alt="Hampton Mowerpower" class="logo"/>
        <div class="company-details">
          <strong>Hampton Mowerpower</strong><br>
          ABN 97 161 289 069<br>
          87 Ludstone Street, Hampton, VIC 3188, Australia<br>
          📧 hamptonmowerpower@gmail.com · ☎ 03-9598-6741<br>
          🌐 www.hamptonmowerpower.com.au
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-info">
          <div><strong>Invoice #:</strong> ${escapeHtml(job.jobNumber)}</div>
          <div><strong>Work Order #:</strong> ${escapeHtml(job.jobNumber)}</div>
          <div><strong>Issue Date:</strong> ${format(issueDate, 'dd MMM yyyy')}</div>
          <div><strong>Due Date:</strong> ${format(dueDate, 'dd MMM yyyy')}</div>
        </div>
      </div>
    </div>

    <!-- Customer & Job Info Panels -->
    <div class="info-panels">
      <div class="panel">
        <div class="panel-title">BILL TO</div>
        <div class="panel-content">
          <p><strong>${escapeHtml(job.customer.name)}</strong></p>
          ${job.customer.email ? `<p>📧 ${escapeHtml(job.customer.email)}</p>` : ''}
          <p>☎ ${escapeHtml(job.customer.phone)}</p>
          <p>${escapeHtml(job.customer.address)}</p>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">JOB SUMMARY</div>
        <div class="panel-content">
          <p><strong>Job Type:</strong> Service & Repair</p>
          <p><strong>Status:</strong> ${job.status.toUpperCase()}</p>
          <p><strong>Booking Date:</strong> ${format(job.createdAt, 'dd MMM yyyy')}</p>
          ${job.completedAt ? `<p><strong>Completed:</strong> ${format(job.completedAt, 'dd MMM yyyy')}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Equipment Details -->
    <div class="equipment-section">
      <div class="panel-title">EQUIPMENT DETAILS</div>
      <div class="panel-content">
        <p><strong>Category:</strong> ${escapeHtml(job.machineCategory)}</p>
        <p><strong>Brand/Make:</strong> ${escapeHtml(job.machineBrand)}</p>
        <p><strong>Model:</strong> ${escapeHtml(job.machineModel)}</p>
        ${job.machineSerial ? `<p><strong>Serial/VIN:</strong> ${escapeHtml(job.machineSerial)}</p>` : ''}
      </div>
    </div>

    <!-- Customer Concern & Diagnosis -->
    ${job.problemDescription ? `
    <div class="concern-section">
      <div class="panel-title">CUSTOMER CONCERN & DIAGNOSIS</div>
      <div class="panel-content">
        <p><strong>Customer Complaint:</strong></p>
        <p>${escapeHtml(job.problemDescription)}</p>
        ${job.servicePerformed ? `
        <p style="margin-top:12px;"><strong>Technician's Findings:</strong></p>
        <p>${escapeHtml(job.servicePerformed)}</p>
        ` : ''}
        ${job.recommendations ? `
        <p style="margin-top:12px;"><strong>Recommendations:</strong></p>
        <p>${escapeHtml(job.recommendations)}</p>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Service Checklist -->
    ${relevantChecklist.length > 0 ? `
    <div class="checklist-section">
      <div class="panel-title">SERVICE CHECKLIST - ${escapeHtml(job.machineCategory.toUpperCase())}</div>
      <div class="checklist-grid">
        ${SERVICE_CHECKLISTS.universal.map(item => `<div class="checklist-item">${escapeHtml(item)}</div>`).join('')}
        ${relevantChecklist.map(item => `<div class="checklist-item">${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>
    ` : `
    <div class="checklist-section">
      <div class="panel-title">SERVICE CHECKLIST - UNIVERSAL CHECKS</div>
      <div class="checklist-grid">
        ${SERVICE_CHECKLISTS.universal.map(item => `<div class="checklist-item">${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>
    `}

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

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-card">
        <div class="totals-row subtotal">
          <span>Subtotal (ex GST):</span>
          <span>${formatCurrency(job.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>GST (10%):</span>
          <span>${formatCurrency(job.gst)}</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL (inc GST):</span>
          <span>${formatCurrency(job.grandTotal)}</span>
        </div>
        ${job.serviceDeposit > 0 ? `
        <div class="totals-row deposit">
          <span>Less: Deposit/Prepayment:</span>
          <span>-${formatCurrency(job.serviceDeposit)}</span>
        </div>
        <div class="totals-row balance">
          <span>BALANCE DUE:</span>
          <span>${formatCurrency(balanceDue)}</span>
        </div>
        ` : ''}
        <div class="payment-badge">${paymentBadge}</div>
      </div>
    </div>

    <!-- Payment Terms -->
    <div class="terms-section">
      <h3>Payment Terms & Methods</h3>
      <p><strong>Payment Terms:</strong> ${paymentTerms}</p>
      <p><strong>Accepted Methods:</strong> Cash, EFTPOS, Credit Card, Bank Transfer</p>
      <p>Please reference Invoice #${escapeHtml(job.jobNumber)} with all payments.</p>
      <p style="margin-top:8px;"><strong>Repair Contract Conditions:</strong> All repairs are guaranteed for 30 days from date of collection. Customer is responsible for equipment after collection. Uncollected items may be disposed of after 90 days.</p>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div>
        <h4>Hampton Mowerpower</h4>
        <p>ABN 97 161 289 069<br>
        87 Ludstone Street<br>
        Hampton, VIC 3188<br>
        Australia</p>
      </div>
      <div>
        <h4>Contact Us</h4>
        <p>📧 hamptonmowerpower@gmail.com<br>
        ☎ 03-9598-6741<br>
        🌐 www.hamptonmowerpower.com.au</p>
      </div>
    </div>

    <div class="thank-you">
      Thank you for your business! · Invoice #${escapeHtml(job.jobNumber)}
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
      <Printer className="h-4 w-4 mr-2" />
      Print Invoice
    </Button>
  );
};
