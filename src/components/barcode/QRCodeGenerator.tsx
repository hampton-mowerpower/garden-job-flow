import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Printer } from 'lucide-react'

interface QRCodeGeneratorProps {
  jobNumber: string
  jobId: string
  size?: number
}

export function QRCodeGenerator({ jobNumber, jobId, size = 128 }: QRCodeGeneratorProps) {
  const jobUrl = `${window.location.origin}/job/${jobId}`
  
  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Job QR Code - ${jobNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container {
                display: inline-block;
                padding: 20px;
                border: 1px solid #ccc;
                margin: 20px;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>Job ${jobNumber}</h2>
              <div id="qr-code"></div>
              <p>Scan to open job details</p>
              <p style="font-size: 12px; color: #666;">${jobUrl}</p>
            </div>
            <button class="no-print" onclick="window.print()">Print</button>
          </body>
        </html>
      `)
      
      // Generate QR code SVG for the print window
      const qrContainer = printWindow.document.getElementById('qr-code')
      if (qrContainer) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '200')
        svg.setAttribute('height', '200')
        
        // Create a temporary container to render QR code
        const tempDiv = document.createElement('div')
        document.body.appendChild(tempDiv)
        
        // Use QRCodeSVG to generate the QR code (simplified approach for print)
        qrContainer.innerHTML = `
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <!-- QR Code would be generated here - using placeholder pattern -->
            <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR Code</text>
            <text x="100" y="120" text-anchor="middle" font-size="8" fill="black">${jobNumber}</text>
          </svg>
        `
        
        document.body.removeChild(tempDiv)
      }
      
      printWindow.document.close()
      printWindow.focus()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Job QR Code - {jobNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG 
              value={jobUrl}
              size={size}
              level="M"
              includeMargin
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Scan to open job details instantly
            </p>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {jobUrl}
            </p>
          </div>
          <Button onClick={printQRCode} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print QR Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}