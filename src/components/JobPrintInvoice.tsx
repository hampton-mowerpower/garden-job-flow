import React, { useRef, useState, useEffect } from 'react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import hamptonLogo from '@/assets/hampton-logo-new.jpg';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface JobPrintInvoiceProps {
  job: Job;
}

interface Payment {
  id: string;
  amount: number;
  gst_component: number;
  method: string;
  paid_at: string;
  reference?: string;
  notes?: string;
}

// Invoice Content Component
const InvoiceContent = React.forwardRef<HTMLDivElement, { job: Job; payments: Payment[] }>(
  ({ job, payments }, ref) => {
    // Calculate payment due date (30 days if account customer)
    const issueDateObj = new Date(job.createdAt);
    const dueDate = job.hasAccount 
      ? new Date(issueDateObj.getTime() + 30 * 24 * 60 * 60 * 1000)
      : issueDateObj;

    // Calculate balance from payments
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = Math.max(0, job.grandTotal - totalPaid);
    const isPaid = balanceDue === 0;

    // Get checked checklist items only
    const checkedUniversal = (job.checklistUniversal || []).filter(item => item.checked);
    const checkedCategory = (job.checklistCategory || []).filter(item => item.checked);
    const categoryName = job.equipmentCategory || '';

    return (
      <div ref={ref} className="invoice-print-wrapper">
        {/* Page 1: Invoice */}
        <div className="invoice-page" style={styles.page}>
          {/* Header */}
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <img 
                src={hamptonLogo} 
                alt="Hampton Mowerpower" 
                style={styles.logo}
              />
              <div style={styles.companyLine}>
                Hampton Mowerpower · ABN 97 161 289 069 · 
                87 Ludstone Street, Hampton VIC 3188, Australia · 
                hamptonmowerpower@gmail.com · 03-95986741 · 
                www.hamptonmowerpower.com.au
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.invoiceTitle}>TAX INVOICE</div>
              <div style={styles.invoiceGrid}>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Invoice #:</span>
                  <span style={styles.gridValue}>{job.jobNumber}</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Issue Date:</span>
                  <span style={styles.gridValue}>
                    {format(issueDateObj, 'dd MMM yyyy')}
                  </span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Due Date:</span>
                  <span style={styles.gridValue}>
                    {format(dueDate, 'dd MMM yyyy')}
                  </span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Work Order:</span>
                  <span style={styles.gridValue}>{job.jobNumber}</span>
                </div>
              </div>
              <div style={styles.paymentBadge}>
                {job.hasAccount 
                  ? 'PAYMENT DUE: 30 DAYS (ACCOUNT)'
                  : 'PAYMENT DUE: ON COLLECTION'}
              </div>
            </div>
          </header>

          {/* Info Panels */}
          <div style={styles.panelsGrid}>
            {/* Bill To */}
            <div style={styles.panel}>
              <div style={styles.panelTitle}>BILL TO</div>
              <div style={styles.panelContent}>
                <div style={styles.panelText}><strong>{job.customer.name}</strong></div>
                {job.customer.email && (
                  <div style={styles.panelText}>{job.customer.email}</div>
                )}
                <div style={styles.panelText}>{job.customer.phone}</div>
                <div style={styles.panelText}>{job.customer.address}</div>
              </div>
            </div>

            {/* Job Summary */}
            <div style={styles.panel}>
              <div style={styles.panelTitle}>JOB SUMMARY</div>
              <div style={styles.panelContent}>
                <div style={styles.panelText}>
                  <strong>Work Order:</strong> {job.jobNumber}
                </div>
                <div style={styles.panelText}>
                  <strong>Job Type:</strong> Service/Repair
                </div>
                <div style={styles.panelText}>
                  <strong>Drop-off:</strong> {format(new Date(job.createdAt), 'dd MMM yyyy, HH:mm')}
                </div>
                {job.requestedFinishDate && (
                  <div style={{
                    ...styles.panelText,
                    backgroundColor: '#fef3c7',
                    border: '2px solid #f59e0b',
                    padding: '8px',
                    marginTop: '8px',
                    fontWeight: 700
                  }}>
                    <strong>REQUESTED FINISH:</strong> {format(new Date(job.requestedFinishDate), 'dd MMM yyyy')}
                  </div>
                )}
                <div style={styles.panelText}>
                  <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{job.status}</span>
                </div>
              </div>
            </div>

            {/* Equipment Details */}
            <div style={styles.panel}>
              <div style={styles.panelTitle}>EQUIPMENT DETAILS</div>
              <div style={styles.panelContent}>
                <div style={styles.panelText}>
                  <strong>Category:</strong> {job.machineCategory}
                </div>
                <div style={styles.panelText}>
                  <strong>Brand/Make:</strong> {job.machineBrand}
                </div>
                <div style={styles.panelText}>
                  <strong>Model:</strong> {job.machineModel}
                </div>
                {job.machineSerial && (
                  <div style={styles.panelText}>
                    <strong>Serial:</strong> {job.machineSerial}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Concern & Diagnosis */}
          {job.problemDescription && (
            <div style={styles.concernSection}>
              <div style={styles.concernTitle}>CUSTOMER CONCERN</div>
              <div style={styles.concernText}>{job.problemDescription}</div>
            </div>
          )}

          {job.additionalNotes && (
            <div style={styles.concernSection}>
              <div style={styles.concernTitle}>ADDITIONAL NOTES</div>
              <div style={styles.concernText}>{job.additionalNotes}</div>
            </div>
          )}

          {job.servicePerformed && (
            <div style={styles.concernSection}>
              <div style={styles.concernTitle}>TECHNICIAN DIAGNOSIS</div>
              <div style={styles.concernText}>{job.servicePerformed}</div>
            </div>
          )}

          {job.recommendations && (
            <div style={styles.concernSection}>
              <div style={styles.concernTitle}>RECOMMENDATIONS</div>
              <div style={styles.concernText}>{job.recommendations}</div>
            </div>
          )}

          {/* Parts & Labour Table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{...styles.tableHeader, ...styles.alignLeft}}>Type</th>
                <th style={{...styles.tableHeader, ...styles.alignLeft}}>Description</th>
                <th style={{...styles.tableHeader, ...styles.alignRight}}>Qty/Hours</th>
                <th style={{...styles.tableHeader, ...styles.alignRight}}>Unit Price</th>
                <th style={{...styles.tableHeader, ...styles.alignRight}}>Line GST</th>
                <th style={{...styles.tableHeader, ...styles.alignRight}}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Parts Section */}
              {job.parts.length > 0 && (
                <>
                  <tr style={{...styles.tableRow, ...styles.groupHeader}}>
                    <td colSpan={6} style={{...styles.tableCell, ...styles.alignLeft, fontWeight: 700}}>
                      PARTS
                    </td>
                  </tr>
                  {job.parts.map((part, index) => {
                    const unitExGST = part.unitPrice / 1.1;
                    const lineTotal = unitExGST * part.quantity;
                    const lineGST = lineTotal * 0.1;
                    return (
                      <tr key={part.id || index} style={styles.tableRow}>
                        <td style={{...styles.tableCell, ...styles.alignLeft}}>Parts</td>
                        <td style={{...styles.tableCell, ...styles.alignLeft}}>{part.partName}</td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>{part.quantity}</td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(unitExGST)}
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(lineGST)}
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{...styles.tableRow, ...styles.subtotalRow}}>
                    <td colSpan={5} style={{...styles.tableCell, ...styles.alignRight, fontWeight: 700}}>
                      Parts Subtotal (ex GST):
                    </td>
                    <td style={{...styles.tableCell, ...styles.alignRight, fontWeight: 700}}>
                      {formatCurrency(job.partsSubtotal / 1.1)}
                    </td>
                  </tr>
                </>
              )}

              {/* Labour Section */}
              {job.labourHours > 0 && (
                <>
                  <tr style={{...styles.tableRow, ...styles.groupHeader}}>
                    <td colSpan={6} style={{...styles.tableCell, ...styles.alignLeft, fontWeight: 700}}>
                      LABOUR
                    </td>
                  </tr>
                  {(() => {
                    const labourExGST = job.labourTotal / 1.1;
                    const labourGST = labourExGST * 0.1;
                    return (
                      <tr style={styles.tableRow}>
                        <td style={{...styles.tableCell, ...styles.alignLeft}}>Labour</td>
                        <td style={{...styles.tableCell, ...styles.alignLeft}}>
                          Service & Repair Work
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {job.labourHours.toFixed(2)}
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(job.labourRate / 1.1)}
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(labourGST)}
                        </td>
                        <td style={{...styles.tableCell, ...styles.alignRight}}>
                          {formatCurrency(labourExGST)}
                        </td>
                      </tr>
                    );
                  })()}
                  <tr style={{...styles.tableRow, ...styles.subtotalRow}}>
                    <td colSpan={5} style={{...styles.tableCell, ...styles.alignRight, fontWeight: 700}}>
                      Labour Subtotal (ex GST):
                    </td>
                    <td style={{...styles.tableCell, ...styles.alignRight, fontWeight: 700}}>
                      {formatCurrency(job.labourTotal / 1.1)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Totals Card */}
          <div style={styles.totalsWrapper}>
            <div style={styles.totalsCard}>
              <div style={styles.totalsRow}>
                <span style={styles.totalsLabel}>Subtotal (Parts + Labour, ex GST):</span>
                <span style={styles.totalsValue}>
                  {formatCurrency((job.partsSubtotal + job.labourTotal) / 1.1)}
                </span>
              </div>
              {job.discountValue && job.discountValue > 0 && (
                <div style={{...styles.totalsRow, color: '#16a34a'}}>
                  <span style={styles.totalsLabel}>
                    Discount {job.discountType === 'PERCENT' ? `(${job.discountValue}%)` : ''}:
                  </span>
                  <span style={styles.totalsValue}>
                    -{formatCurrency(job.discountType === 'PERCENT' ? ((job.partsSubtotal + job.labourTotal) / 1.1) * (job.discountValue / 100) : job.discountValue)}
                  </span>
                </div>
              )}
              <div style={styles.totalsRow}>
                <span style={styles.totalsLabel}>GST Total (sum of line GST):</span>
                <span style={styles.totalsValue}>
                  {formatCurrency(job.gst)}
                </span>
              </div>
              <div style={{...styles.totalsRow, ...styles.totalsBold}}>
                <span style={styles.totalsLabel}>Grand Total (inc GST):</span>
                <span style={styles.totalsValue}>
                  {formatCurrency(job.grandTotal)}
                </span>
              </div>
              {job.serviceDeposit > 0 && (
                <div style={{...styles.totalsRow, color: '#16a34a'}}>
                  <span style={styles.totalsLabel}>Deposit Applied:</span>
                  <span style={styles.totalsValue}>
                    -{formatCurrency(job.serviceDeposit)}
                  </span>
                </div>
              )}
              {payments.length > 0 && (
                <>
                  <div style={{...styles.totalsRow, borderTop: '2px solid #e5e7eb', marginTop: '8px', paddingTop: '8px'}}>
                    <span style={{...styles.totalsLabel, fontWeight: 700}}>PAYMENT HISTORY:</span>
                    <span></span>
                  </div>
                  {payments.map((payment, idx) => (
                    <div key={payment.id} style={styles.totalsRow}>
                      <span style={styles.totalsLabel}>
                        {format(new Date(payment.paid_at), 'dd MMM yyyy')} - {payment.method}
                        {payment.reference && ` (${payment.reference})`}:
                      </span>
                      <span style={styles.totalsValue}>
                        -{formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </>
              )}
              <div style={{...styles.totalsRow, ...styles.totalsBold, ...styles.balanceDue}}>
                <span style={styles.totalsLabel}>Balance Due:</span>
                <span style={styles.totalsValue}>
                  {formatCurrency(Math.max(0, balanceDue - (job.serviceDeposit || 0)))}
                </span>
              </div>
              {isPaid && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '2px',
                  borderRadius: '4px',
                  border: '3px solid #059669'
                }}>
                  ✓ PAID IN FULL
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div style={styles.paymentDetails}>
            <div style={styles.paymentTitle}>PAYMENT DETAILS</div>
            <div style={styles.paymentGrid}>
              <div>
                <strong>Bank Transfer:</strong><br />
                National Australia Bank<br />
                BSB: 083-004<br />
                Account: 87-542-9876
              </div>
              <div>
                <strong>Accepted Payment Methods:</strong><br />
                Cash, EFTPOS, Credit Card, Bank Transfer<br />
                <em>Please reference Invoice # {job.jobNumber} with payment</em>
              </div>
            </div>
          </div>

          {/* Terms & Warranty */}
          <div style={styles.terms}>
            <div style={styles.termsTitle}>TERMS & CONDITIONS</div>
            <p style={styles.termsText}>
              Most invoices are paid on collection. Account customers have 30-day payment terms. 
              Please reference the Invoice # with all payments.
            </p>
            <p style={styles.termsText}>
              <strong>Warranty:</strong> All domestic customer service work is guaranteed for 90 days from completion date. 
              All commercial customer service work is covered by floor warranty only (as provided by the manufacturer or distributor).
            </p>
          </div>

          {/* Footer */}
          <footer style={styles.footer}>
            <div style={styles.footerGrid}>
              <div>
                <strong>Hampton Mowerpower</strong><br />
                ABN 97 161 289 069<br />
                87 Ludstone Street, Hampton VIC 3188, Australia
              </div>
              <div style={styles.footerRight}>
                <strong>Contact</strong><br />
                hamptonmowerpower@gmail.com<br />
                03-95986741<br />
                www.hamptonmowerpower.com.au
              </div>
            </div>
            <div style={styles.footerThankYou}>
              <span>Thank you for your business.</span>
              <span>Invoice #{job.jobNumber}</span>
            </div>
          </footer>
        </div>

        {/* Page 2: Service Checklist (if any items checked) */}
        {(checkedUniversal.length > 0 || checkedCategory.length > 0) && (
          <div className="checklist-page" style={styles.page}>
            <div style={styles.checklistHeader}>
              <h2 style={styles.checklistMainTitle}>SERVICE CHECKLIST RESULTS</h2>
              <div style={styles.checklistSubtitle}>
                Work Order: {job.jobNumber} | {job.customer.name} | 
                {' '}{job.machineBrand} {job.machineModel}
              </div>
            </div>

            {checkedUniversal.length > 0 && (
              <div style={styles.checklistSection}>
                <h3 style={styles.checklistTitle}>Universal Checks</h3>
                <ul style={styles.checklistList}>
                  {checkedUniversal.map((item, idx) => (
                    <li key={idx} style={styles.checklistItem}>
                      <span style={styles.checkMark}>✓</span> {item.label}
                      {item.note && (
                        <div style={styles.checklistNote}>{item.note}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {checkedCategory.length > 0 && (
              <div style={styles.checklistSection}>
                <h3 style={styles.checklistTitle}>
                  Category: {categoryName}
                </h3>
                <ul style={styles.checklistList}>
                  {checkedCategory.map((item, idx) => (
                    <li key={idx} style={styles.checklistItem}>
                      <span style={styles.checkMark}>✓</span> {item.label}
                      {item.note && (
                        <div style={styles.checklistNote}>{item.note}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer on checklist page */}
            <footer style={styles.footer}>
              <div style={styles.footerGrid}>
                <div>
                  <strong>Hampton Mowerpower</strong><br />
                  ABN 97 161 289 069<br />
                  87 Ludstone Street, Hampton VIC 3188, Australia
                </div>
                <div style={styles.footerRight}>
                  <strong>Contact</strong><br />
                  hamptonmowerpower@gmail.com<br />
                  03-95986741<br />
                  www.hamptonmowerpower.com.au
                </div>
              </div>
              <div style={styles.footerThankYou}>
                <span>Thank you for your business.</span>
                <span>Invoice #{job.jobNumber}</span>
              </div>
            </footer>
          </div>
        )}
      </div>
    );
  }
);

InvoiceContent.displayName = 'InvoiceContent';

// Professional Workshop Palette - Minimal, Print-Ready
var styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4',
    color: '#0F172A',
    background: '#FFFFFF',
    padding: '12mm',
    maxWidth: '210mm',
    margin: '0 auto',
    pageBreakAfter: 'auto',
  },
  
  // Header
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '16px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E2E8F0',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  logo: {
    maxWidth: '240px',
    height: 'auto',
  },
  companyLine: {
    fontSize: '10px',
    color: '#64748B',
    lineHeight: '1.3',
  },
  headerRight: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '12px',
  },
  invoiceGrid: {
    display: 'grid',
    gap: '6px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  gridRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  gridLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  gridValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  paymentBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#0F172A',
  },

  // Panels
  panelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  panel: {
    padding: '10px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    background: '#FAFBFC',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  panelTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  panelText: {
    fontSize: '13px',
    color: '#0F172A',
  },

  // Concern Sections
  concernSection: {
    marginBottom: '12px',
    padding: '10px',
    paddingLeft: '14px',
    borderLeft: '3px solid #0F172A',
    background: '#F8FAFC',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  concernTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  concernText: {
    fontSize: '13px',
    color: '#0F172A',
    lineHeight: '1.6',
  },

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
    fontSize: '12px',
  },
  tableHeaderRow: {
    background: '#F8FAFC',
  },
  tableHeader: {
    padding: '7px 6px',
    borderBottom: '2px solid #E2E8F0',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  tableRow: {
    borderBottom: '1px solid #E2E8F0',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  groupHeader: {
    backgroundColor: '#F8FAFC',
    borderTop: '2px solid #CBD5E1',
  },
  subtotalRow: {
    backgroundColor: '#F1F5F9',
    fontWeight: '600',
  },
  tableCell: {
    padding: '7px 6px',
    color: '#0F172A',
  },
  alignLeft: {
    textAlign: 'left',
  },
  alignRight: {
    textAlign: 'right',
  },

  // Totals
  totalsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  totalsCard: {
    width: '300px',
    padding: '14px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    background: '#FAFBFC',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    fontSize: '12px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  totalsLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  totalsValue: {
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
  },
  totalsBold: {
    fontWeight: '700',
    fontSize: '15px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '10px',
    marginTop: '6px',
  },
  balanceDue: {
    borderTop: '2px solid #0F172A',
    paddingTop: '10px',
    marginTop: '6px',
  },

  // Payment Details
  paymentDetails: {
    marginBottom: '14px',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    background: '#F8FAFC',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  paymentTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    fontSize: '12px',
    lineHeight: '1.6',
  },

  // Terms
  terms: {
    marginBottom: '12px',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    background: '#FAFBFC',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  termsTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  termsText: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: '1.6',
    margin: '4px 0',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0',
    marginBottom: '0',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    fontSize: '11px',
    lineHeight: '1.6',
    color: '#64748B',
    marginBottom: '12px',
  },
  footerRight: {
    textAlign: 'right',
  },
  footerThankYou: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#64748B',
    paddingTop: '8px',
    borderTop: '1px solid #E2E8F0',
  },

  // Checklist Page
  checklistHeader: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #E2E8F0',
  },
  checklistMainTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '8px',
  },
  checklistSubtitle: {
    fontSize: '13px',
    color: '#64748B',
  },
  checklistSection: {
    marginBottom: '24px',
  },
  checklistTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #E2E8F0',
  },
  checklistList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  checklistItem: {
    padding: '8px 0',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '13px',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  checkMark: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: '16px',
  },
  checklistNote: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#64748B',
    fontStyle: 'italic',
    paddingLeft: '24px',
  },
};

// Main Export - Button Component with Print Handler
export const JobPrintInvoice: React.FC<JobPrintInvoiceProps> = ({ job }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (job.id) {
      jobBookingDB.getPayments(job.id).then(setPayments).catch(console.error);
    }
  }, [job.id]);
  
  const handlePrint = () => {
    const printContent = componentRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${job.jobNumber}</title>
          <meta charset="UTF-8">
          <style>
            /* Print-optimized CSS for pagination control */
            @page { 
              size: A4; 
              margin: 12mm;
            }
            
            @media print {
              body { 
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Prevent splits - keep elements together */
              table { 
                page-break-inside: auto;
              }
              
              tr, td, th { 
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .line, .amount, .total-row { 
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              /* Keep totals block together */
              .totals, .totals * { 
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              /* Prevent header orphans */
              h1, h2, h3, .section-title { 
                break-after: avoid;
                page-break-after: avoid;
              }
              
              /* Keep sections together */
              .notes, .footer { 
                break-inside: avoid;
              }
              
              /* Widow/orphan control */
              p, .amount { 
                orphans: 2;
                widows: 2;
              }
              
              /* Remove extra page breaks at the end */
              .invoice-page:last-child,
              .checklist-page:last-child {
                page-break-after: auto !important;
              }
              
              /* Ensure last element has no bottom margin */
              footer {
                margin-bottom: 0 !important;
              }
            }
            
            ${Array.from(document.styleSheets)
              .map(styleSheet => {
                try {
                  return Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
                } catch {
                  return '';
                }
              })
              .join('\n')}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPDF = () => {
    const printContent = componentRef.current;
    if (!printContent) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    // Create a print window for PDF download
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Please allow popups to download PDF.',
        variant: 'destructive'
      });
      return;
    }

    const fileName = `INVOICE_${job.jobNumber}.pdf`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <meta charset="UTF-8">
          <style>
            @page { 
              size: A4; 
              margin: 12mm;
            }
            
            @media print {
              body { 
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              table { 
                page-break-inside: auto;
              }
              
              tr, td, th { 
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .line, .amount, .total-row { 
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              .totals, .totals * { 
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              h1, h2, h3, .section-title { 
                break-after: avoid;
                page-break-after: avoid;
              }
              
              .notes, .footer { 
                break-inside: avoid;
              }
              
              p, .amount { 
                orphans: 2;
                widows: 2;
              }
              
              .invoice-page:last-child,
              .checklist-page:last-child {
                page-break-after: auto !important;
              }
              
              footer {
                margin-bottom: 0 !important;
              }
            }
            
            ${Array.from(document.styleSheets)
              .map(styleSheet => {
                try {
                  return Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
                } catch {
                  return '';
                }
              })
              .join('\n')}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Trigger print dialog which allows "Save as PDF"
    setTimeout(() => {
      printWindow.print();
      // Don't auto-close so user can save as PDF
    }, 250);
    
    toast({
      title: 'PDF Ready',
      description: `Use "Save as PDF" in the print dialog to download ${fileName}`,
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Print Invoice
      </Button>
      <Button
        onClick={handleDownloadPDF}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Download PDF
      </Button>
      <div style={{ display: 'none' }}>
        <InvoiceContent ref={componentRef} job={job} payments={payments} />
      </div>
    </div>
  );
};

export default JobPrintInvoice;
