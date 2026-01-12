import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Languages, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showLanguageDialog, setShowLanguageDialog] = React.useState(false);
  const [printLanguage, setPrintLanguage] = React.useState<'en' | 'te'>('en');
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Translations
  const translations = {
    en: {
      receiptTitle: "RENT PAYMENT RECEIPT",
      receipt: "Receipt #",
      date: "Date",
      customer: "Customer",
      paymentMethod: "Payment Method",
      description: "DESCRIPTION",
      qty: "QTY",
      amount: "AMOUNT (₹)",
      subtotal: "Subtotal:",
      totalPaid: "TOTAL PAID:",
      pendingDues: "Pending Dues:",
      totalPending: "Total Pending:",
      generatedReceipt: "** This is a computer-generated receipt **",
      keepReceipt: "Please keep this receipt for your records",
      contact: "For any queries, contact:",
      due: "Due:",
      paid: "(Paid)",
      selectLanguage: "Select Language",
      english: "English",
      telugu: "తెలుగు",
      printIn: "Print in",
      close: "Close",
      print: "Print"
    },
    te: {
      receiptTitle: "భాడా చెల్లింపు రసీదు",
      receipt: "రసీదు #",
      date: "తేదీ",
      customer: "కస్టమర్",
      paymentMethod: "చెల్లింపు పద్ధతి",
      description: "వివరణ",
      qty: "పరిమాణం",
      amount: "మొత్తం (₹)",
      subtotal: "ఉపసర్గ:",
      totalPaid: "మొత్తం చెల్లించినది:",
      pendingDues: "బాకీ ఉన్నవి:",
      totalPending: "మొత్తం బాకీ:",
      generatedReceipt: "** ఇది కంప్యూటర్ ద్వారా సృష్టించబడిన రసీదు **",
      keepReceipt: "దయచేసి మీ రికార్డ్‌ల కోసం ఈ రసీదును ఉంచుకోండి",
      contact: "ఏవైనా ప్రశ్నలకు, సంప్రదించండి:",
      due: "గడువు:",
      paid: "(చెల్లించబడినవి)",
      selectLanguage: "భాషను ఎంచుకోండి",
      english: "ఆంగ్లం",
      telugu: "తెలుగు",
      printIn: "దీనిలో ప్రింట్ చేయి",
      close: "మూసివెయ్యి",
      print: "ప్రింట్ చేయి"
    }
  };

  const t = translations[printLanguage];
  
  // Get current date and time for the receipt
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = (language: 'en' | 'te' = 'en') => {
    setPrintLanguage(language);
    setShowLanguageDialog(false);
    
    // Small delay to allow state update
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank', 'width=380,height=600');
        if (!printWindow) return;

        // Get the receipt content
        const receiptContent = componentRef.current?.innerHTML || '';
        
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${t.receiptTitle} - ${orderId}</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 0;
                  padding: 0;
                  width: 80mm;
                }
                @media print {
                  body {
                    width: 80mm;
                    margin: 0 auto;
                    padding: 5mm;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    color: #000;
                    background: #fff;
                    direction: ${language === 'te' ? 'rtl' : 'ltr'};
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .receipt-print {
                    width: 100%;
                    max-width: 80mm;
                    margin: 0 auto;
                    padding: 0;
                  }
                  .no-print, .print\\:hidden, header, footer, nav, .print-hide {
                    display: none !important;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    box-sizing: border-box;
                  }
                  .text-center { text-align: center; }
                  .text-right { text-align: right; }
                  .font-bold { font-weight: bold; }
                  .border-b { border-bottom: 1px dashed #000; }
                  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                  .mb-1 { margin-bottom: 0.25rem; }
                  .text-xs { font-size: 10px; }
                  .text-sm { font-size: 11px; }
                  .text-base { font-size: 12px; }
                  .w-full { width: 100%; }
                  .flex { display: flex; }
                  .justify-between { justify-content: space-between; }
                  .items-center { align-items: center; }
                }
                body { font-family: Arial, sans-serif; }
                .receipt-content { font-size: 12px; }
              </style>
            </head>
              <body onload="window.print(); window.onafterprint = function() { window.close(); }">
              <div class="receipt-print" style="width: 80mm; margin: 0 auto; font-family: monospace; font-size: 12px; line-height: 1.2; padding: 5mm;">
                ${receiptContent}
              </div>
            </body>
          </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
      }
    }, 100);
  };

  const handlePrintClick = () => {
    setShowLanguageDialog(true);
  };

  // Format date based on language
  const formatReceiptDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(printLanguage === 'te' ? 'te-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t.selectLanguage}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="justify-start h-14 text-lg"
              onClick={() => handlePrint('en')}
            >
              <span className="mr-2">🇬🇧</span>
              <div className="text-left">
                <div className="font-medium">English</div>
                <div className="text-sm text-muted-foreground">English</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-14 text-lg"
              onClick={() => handlePrint('te')}
            >
              <span className="mr-2">🇮🇳</span>
              <div className="text-right" dir="rtl">
                <div className="font-medium">తెలుగు</div>
                <div className="text-sm text-muted-foreground" dir="ltr">Telugu</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto" 
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-[320px] my-8" 
          onClick={e => e.stopPropagation()}
          dir={printLanguage === 'te' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {printLanguage === 'te' ? 'రసీదు' : 'Rental Receipt'}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Receipt Content */}
          <div className="receipt-content p-0 font-mono text-sm" ref={componentRef} dir={printLanguage === 'te' ? 'rtl' : 'ltr'}>
            {/* Company Info */}
            <div className="text-center py-2 border-b border-dashed border-black">
              <h1 className="text-sm font-bold uppercase tracking-tight mb-1">RENTAL MANAGEMENT</h1>
              <p className="text-xs">123 Rental Street, City, State</p>
              <p className="text-xs">GST: 22AAAAA0000A1Z5 | Ph: +91 98765 43210</p>
              <p className="text-xs mt-1">${formattedDate}</p>
            </div>

            {/* Receipt Info */}
            <div className="py-2 px-2 border-b border-dashed border-black">
              <div className="grid grid-cols-2 gap-y-0 text-xs">
                <div className="font-medium">{t.receipt}</div>
                <div className="text-right font-bold">{orderId}</div>
                <div className="font-medium">{t.date}:</div>
                <div className="text-right">{formatReceiptDate(date)}</div>
                <div className="font-medium">{t.customer}:</div>
                <div className="text-right font-bold">{customerName}</div>
                <div className="font-medium">{t.paymentMethod}:</div>
                <div className="text-right">{paymentMethod}</div>
              </div>
            </div>

            {/* Items */}
            <div className="py-1 px-2">
              <div className="grid grid-cols-3 text-xs font-bold uppercase py-1 border-b border-dashed border-black">
                <div>{t.description}</div>
                <div className="text-center">{t.qty}</div>
                <div className="text-right">{t.amount}</div>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-3 text-xs py-1 border-b border-dashed border-gray-300 last:border-0">
                  <div className="break-words">
                    <div className="font-semibold">{item.name}</div>
                    {item.dueDate && (
                      <div className="text-[10px] mt-0.5">
                        {t.due} {item.dueDate} {item.status === 'Paid' && <span className="font-bold">({t.paid})</span>}
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
            <div className="py-1 px-2 my-1 border-t-2 border-b-2 border-dashed border-black">
              <div className="flex justify-between text-xs py-0.5">
                <span className="font-medium">{t.subtotal}</span>
                <span className="font-bold">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold py-0.5">
                <span>{t.totalPaid}</span>
                <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Pending Dues */}
            {remainingDues && remainingDues.length > 0 && (
              <div className="py-1 px-2 border border-dashed border-black my-2">
                <h3 className="font-bold text-xs uppercase mb-1">{t.pendingDues}</h3>
                <div className="space-y-1 text-xs">
                  {remainingDues.map((due, index) => (
                    <div key={index} className="flex justify-between items-center py-0.5">
                      <div>
                        <span className="font-semibold">{due.month} {due.year}</span>
                        <span className="block text-[10px]">{t.due} {due.dueDate}</span>
                      </div>
                      <span className="font-bold">
                        ₹{due.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-extrabold mt-1 pt-1 border-t border-dashed border-black">
                    <span>{t.totalPending}</span>
                    <span>
                      ₹{remainingDues.reduce((sum, due) => sum + due.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="py-2 text-center text-[10px] mt-2">
              <p className="mb-1">--------------------------------</p>
              <p className="mb-1">{t.generatedReceipt}</p>
              <p className="mb-1">{t.keepReceipt}</p>
              <p className="mt-2">{t.contact}</p>
              <p className="font-semibold">support@rentalmanagement.com</p>
              <p className="mt-2">--------------------------------</p>
              <p className="text-xs mt-1">Thank you for your business!</p>
              <p className="text-[8px] mt-2">Printed on: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Action Buttons - Only visible on screen */}
          <div className="p-4 border-t border-gray-200 bg-white flex gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t.close}
            </Button>
            <Button
              onClick={handlePrintClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              {t.print}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;