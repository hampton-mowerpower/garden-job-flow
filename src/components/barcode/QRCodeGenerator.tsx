import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  jobNumber: string;
  jobId: string;
  size?: number;
}

export function QRCodeGenerator({ jobNumber, jobId, size = 200 }: QRCodeGeneratorProps) {
  const jobUrl = `${window.location.origin}/job/${jobId}`;

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
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
                margin: 0;
              }
              .qr-container { 
                display: inline-block; 
                border: 2px solid #000; 
                padding: 20px; 
                margin: 20px;
              }
              h1 { font-size: 24px; margin-bottom: 10px; }
              p { font-size: 16px; margin: 10px 0; }
              .job-url { font-size: 12px; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Job: ${jobNumber}</h1>
              <div id="qr-code"></div>
              <p class="job-url">${jobUrl}</p>
            </div>
            <script>
              // QR Code will be inserted here
              window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

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
          <div className="bg-white p-4 rounded-lg border">
            <QRCodeSVG
              value={jobUrl}
              size={size}
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center break-all">
            {jobUrl}
          </p>
          <Button onClick={printQRCode} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}