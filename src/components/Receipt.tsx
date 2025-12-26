import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  dueDate?: string;
  status?: string;
}

interface PendingDue {
  month: string;
  year: number;
  dueDate: string;
  amount: number;
}

interface ReceiptProps {
  orderId: string;
  date: string | Date;
  customerName: string;
  paymentMethod: string;
  items: ReceiptItem[];
  remainingDues?: PendingDue[];
  onClose: () => void;
}

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ 
  orderId, 
  date, 
  customerName, 
  paymentMethod, 
  items, 
  remainingDues, 
  onClose 
}, ref) => {
  const componentRef = React.useRef<HTMLDivElement>(null);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '', 'width=600,height=600');
      if (!printWindow) return;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${orderId}</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
                .receipt-print { width: 100%; max-width: 80mm; margin: 0 auto; }
              }
              body { font-family: Arial, sans-serif; }
              .receipt-content { font-size: 12px; }
            </style>
          </head>
          <body onload="window.print(); window.onafterprint = function() { window.close(); }">
            <div class="receipt-print">
              ${componentRef.current?.innerHTML || ''}
            </div>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-[320px] my-8" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
          <h2 className="text-lg font-semibold text-gray-800 text-center">Rental Receipt</h2>
        </div>

        {/* Receipt Content */}
        <div className="receipt-content p-0" ref={componentRef}>
          {/* Company Info */}
          <div className="text-center py-3 px-2 border-b border-dashed border-gray-300">
            <h1 className="text-sm font-bold uppercase tracking-tight">RENTAL MANAGEMENT</h1>
            <p className="text-[10px] mt-1">123 Rental Street, City, State</p>
            <p className="text-[10px]">GST: 22AAAAA0000A1Z5</p>
            <p className="text-[10px] mb-1">Ph: +91 98765 43210</p>
          </div>

          {/* Receipt Info */}
          <div className="py-3 px-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-y-0.5 text-[10px] py-1">
              <div className="text-gray-600 font-medium">Receipt #:</div>
              <div className="text-right font-semibold text-gray-800">{orderId}</div>
              <div className="text-gray-600 font-medium">Date:</div>
              <div className="text-right text-gray-700">{formatDate(date)}</div>
              <div className="text-gray-600 font-medium">Customer:</div>
              <div className="text-right font-semibold text-gray-800">{customerName}</div>
              <div className="text-gray-600 font-medium">Payment Method:</div>
              <div className="text-right text-gray-700">{paymentMethod}</div>
            </div>
          </div>

          {/* Items */}
          <div className="py-2 px-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold uppercase mb-1 border-b border-dashed border-gray-300 py-1">
              <div>DESCRIPTION</div>
              <div className="text-center">QTY</div>
              <div className="text-right">AMOUNT (₹)</div>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-1 text-[10px] py-1 border-b border-dashed border-gray-100 last:border-0">
                <div className="break-words">
                  <div className="font-semibold">{item.name}</div>
                  {item.dueDate && (
                    <div className="text-[9px] mt-0.5">
                      Due: {item.dueDate} {item.status === 'Paid' && <span className="font-bold">(Paid)</span>}
                    </div>
                  )}
                </div>
                <div className="text-center self-center">{item.quantity}</div>
                <div className="text-right self-center font-bold">
                  ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 px-2 border-t-2 border-b-2 border-dashed border-gray-300 my-2">
            <div className="flex justify-between text-[11px] py-0.5">
              <span>Subtotal:</span>
              <span className="font-bold">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[12px] font-extrabold py-0.5">
              <span>TOTAL PAID:</span>
              <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Pending Dues */}
          {remainingDues && remainingDues.length > 0 && (
            <div className="py-2 px-2 border border-dashed border-amber-300 my-2">
              <h3 className="font-bold text-[11px] uppercase mb-1">Pending Dues:</h3>
              <div className="space-y-1 text-[10px]">
                {remainingDues.map((due, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div>
                      <span className="font-semibold">{due.month} {due.year}</span>
                      <span className="block text-[9px]">Due: {due.dueDate}</span>
                    </div>
                    <span className="font-bold">
                      ₹{due.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-extrabold mt-2 pt-1 border-t border-dashed border-amber-200">
                  <span>Total Pending:</span>
                  <span>
                    ₹{remainingDues.reduce((sum, due) => sum + due.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="py-2 text-center text-[9px] mt-2">
            <p className="mb-1">** This is a computer-generated receipt **</p>
            <p className="mb-1">Please keep this receipt for your records</p>
            <div className="border-t border-dashed border-gray-300 my-1"></div>
            <p>For any queries, contact:</p>
            <p className="font-semibold">support@rentalmanagement.com</p>
          </div>
        </div>

        {/* Action Buttons - Only visible on screen */}
        <div className="p-4 border-t border-gray-200 bg-white flex gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300 hover:bg-gray-50"
          >
            Done
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;