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
  <title>Tax Invoice ${escapeHtml(job.jobNumber)} - Hampton Mowerpower</title>
  <style>
    @page { size: A4; margin: 12mm 18mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif; 
      font-size: 14px; 
      line-height: 1.5; 
      color: #0f172a;
      background: #ffffff;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .logo { max-width: 200px; height: auto; margin-bottom: 6px; }
    .company-line {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      margin-top: 4px;
    }
    .invoice-title-section {
      text-align: right;
    }
    .invoice-title {
      background: #111827;
      color: white;
      padding: 6px 20px;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .invoice-meta {
      font-size: 12px;
      line-height: 1.6;
      color: #0f172a;
    }
    .invoice-meta-row {
      display: grid;
      grid-template-columns: 110px 1fr;
      margin-bottom: 2px;
    }
    .invoice-meta-label {
      font-weight: 600;
      color: #64748b;
    }
    .info-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .panel {
      border: 1px solid #e2e8f0;
      padding: 12px;
      background: #ffffff;
    }
    .panel-title {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: #0f172a;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .panel-content {
      font-size: 12px;
      line-height: 1.6;
      color: #0f172a;
    }
    .panel-content p { margin-bottom: 3px; }
    .panel-content strong { font-weight: 600; color: #0f172a; }
    .equipment-section {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      padding: 12px;
      background: #ffffff;
    }
    .problem-section {
      margin-bottom: 16px;
      border-left: 3px solid #f59e0b;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px;
      background: #ffffff;
    }
    .problem-section .panel-title {
      color: #b45309;
      border-bottom-color: #fef3c7;
    }
    .checklist-section {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      padding: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .checklist-section .panel-title {
      color: #0f172a;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
      margin-top: 8px;
    }
    .checklist-item {
      font-size: 10px;
      padding: 4px 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      line-height: 1.3;
      color: #0f172a;
    }
    .checklist-item::before {
      content: '☐';
      margin-right: 4px;
      color: #64748b;
      font-size: 11px;
    }
    .parts-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .parts-table thead {
      background: #0f172a;
      color: white;
    }
    .parts-table th {
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .parts-table td {
      padding: 6px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .totals-card {
      min-width: 360px;
      border: 1px solid #e2e8f0;
      background: #fff;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #0f172a;
    }
    .totals-row.subtotal {
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
      background: #fef3c7;
      color: #92400e;
      font-weight: 600;
    }
    .totals-row.balance {
      background: #0f172a;
      color: white;
      font-weight: 700;
      font-size: 16px;
      border-bottom: none;
    }
    .payment-badge {
      background: #111827;
      color: white;
      padding: 8px 12px;
      text-align: center;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .terms-section {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 11px;
      line-height: 1.7;
      color: #0f172a;
    }
    .terms-section h3 {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .terms-section ol {
      margin-left: 18px;
      margin-top: 6px;
    }
    .terms-section li {
      margin-bottom: 4px;
      color: #64748b;
    }
    .invoice-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-size: 11px;
      color: #64748b;
    }
    .invoice-footer h4 {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #0f172a;
    }
    .thank-you {
      text-align: center;
      margin-top: 12px;
      font-size: 11px;
      color: #64748b;
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
        <div class="company-line">
          <strong>Hampton Mowerpower</strong> · ABN 97 161 289 069 · 87 Ludstone Street, Hampton, VIC 3188 · hamptonmowerpower@gmail.com · 03-9598-6741 · www.hamptonmowerpower.com.au
        </div>
      </div>
      <div class="invoice-title-section">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice #:</span>
            <span>${escapeHtml(job.jobNumber)}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Work Order #:</span>
            <span>${escapeHtml(job.jobNumber)}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Issue Date:</span>
            <span>${format(issueDate, 'dd/MM/yyyy')}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Due Date:</span>
            <span>${format(dueDate, 'dd/MM/yyyy')}</span>
          </div>
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

    <!-- Problem Description -->
    ${job.problemDescription ? `
    <div class="problem-section">
      <div class="panel-title">PROBLEM DESCRIPTION</div>
      <div class="panel-content">
        <p>${escapeHtml(job.problemDescription)}</p>
        ${job.servicePerformed ? `
        <p style="margin-top:10px;"><strong>Service Performed:</strong> ${escapeHtml(job.servicePerformed)}</p>
        ` : ''}
        ${job.recommendations ? `
        <p style="margin-top:8px;"><strong>Recommendations:</strong> ${escapeHtml(job.recommendations)}</p>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${job.partsRequired ? `
    <div style="margin-bottom:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;">
      <strong style="color:#0f172a;">Parts Required:</strong> <span style="color:#64748b;">${escapeHtml(job.partsRequired)}</span>
    </div>
    ` : ''}

    <!-- Service Checklist -->
    ${relevantChecklist.length > 0 ? `
    <div class="checklist-section">
      <div class="panel-title">SERVICE CHECKLIST - ${escapeHtml((job.machineCategory || '').toUpperCase())}</div>
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
    </div>

    <!-- Repair Contract Conditions -->
    <div class="terms-section">
      <h3>Repair Contract Conditions</h3>
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
      <FileText className="h-4 w-4 mr-2" />
      Print Invoice
    </Button>
  );
};
