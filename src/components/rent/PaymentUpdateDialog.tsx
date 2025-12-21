
import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Payment } from './generateRentDueRecords';
import Receipt from '@/components/Receipt';
import useReceipt from '@/hooks/useReceipt';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface PaymentUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  tenantName: string;
  onUpdate: (paymentId: string, newStatus: 'Paid' | 'Unpaid' | 'Partial', updateData?: {
    paymentMethod?: string;
    actualDate?: string;
    amount?: number;
    remainingDue?: number;
  }) => void;
  onNotifyTenant: (payment: Payment, tenantName: string) => void;
  allPayments: Payment[];
}

const PaymentUpdateDialog = ({
  open,
  onOpenChange,
  payment,
  tenantName,
  onUpdate,
  onNotifyTenant,
  allPayments,
}: PaymentUpdateDialogProps) => {
  type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualAmount, setActualAmount] = useState('');
  
  // Receipt functionality
  const { isOpen, receiptData, showReceipt, hideReceipt } = useReceipt();
  
  // Initialize form when payment changes
  React.useEffect(() => {
    if (payment) {
      if (payment.status === 'Partial' && payment.remainingDue) {
        setSelectedStatus('Partial');
        const paidAmount = (payment.originalAmount || payment.amount) - payment.remainingDue;
        setActualAmount(paidAmount.toString());
      } else if (payment.status === 'Paid') {
        setSelectedStatus('Paid');
        setActualAmount(payment.amount.toString());
      } else {
        setSelectedStatus('Unpaid');
        setActualAmount('');
      }
      
      if (payment.paymentMethod) {
        setPaymentMethod(payment.paymentMethod);
      }
      
      if (payment.paidDate) {
        setActualDate(payment.paidDate);
      }
    }
  }, [payment]);
  
  // Calculate payment summary
  const { totalDue, amountPaid, remainingDue, isPaymentComplete } = React.useMemo(() => {
    if (!payment) return { totalDue: 0, amountPaid: 0, remainingDue: 0, isPaymentComplete: false };
    
    const totalDue = payment.originalAmount || payment.amount;
    const previousPaid = payment.status === 'Partial' 
      ? (payment.originalAmount || payment.amount) - (payment.remainingDue || 0) 
      : 0;
    
    const currentPayment = Number(actualAmount) || 0;
    const totalPaid = previousPaid + currentPayment;
    const remaining = Math.max(0, totalDue - totalPaid);
    
    return {
      totalDue,
      amountPaid: totalPaid,
      remainingDue: remaining,
      isPaymentComplete: totalPaid >= totalDue
    };
  }, [payment, actualAmount]);

  const handleSubmit = () => {
    if (!payment) return;

    if ((selectedStatus === 'Paid' || selectedStatus === 'Partial') && !actualAmount) {
      return;
    }

    // Check for chronological order when making a payment
    if (selectedStatus === 'Paid' || selectedStatus === 'Partial') {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      // Get all unpaid/partial payments for this tenant, excluding the current one being edited
      const tenantPendingPayments = allPayments
        .filter(p => 
          p.tenantId === payment.tenantId && 
          p.id !== payment.id &&
          (p.status === 'Unpaid' || p.status === 'Partial') &&
          // Only consider payments that are not for the current month being processed
          !(p.month === payment.month && p.year === payment.year)
        )
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });

      const paymentMonthIndex = (payment.year * 12) + monthNames.indexOf(payment.month);

      // Check all pending payments to ensure none are earlier than the current payment
      for (const pendingPayment of tenantPendingPayments) {
        const pMonthIndex = (pendingPayment.year * 12) + monthNames.indexOf(pendingPayment.month);
        
        if (pMonthIndex < paymentMonthIndex) {
          // Found an earlier pending payment, show error
          toast({
            title: "Cannot Record Payment",
            description: `There is an earlier ${pendingPayment.status.toLowerCase()} payment for ${pendingPayment.month} ${pendingPayment.year}. Please clear pending dues in chronological order first.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    const paymentAmount = Number(actualAmount);
    const originalAmount = payment.originalAmount || payment.amount;
    
    if (selectedStatus === 'Partial' && (!actualAmount || paymentAmount <= 0)) {
      return;
    }
    
    // Calculate the total paid amount including any previous payments
    const previousPaid = payment.status === 'Partial' ? (payment.originalAmount || payment.amount) - (payment.remainingDue || 0) : 0;
    const totalPaid = previousPaid + paymentAmount;
    const remainingAmount = Math.max(0, originalAmount - totalPaid);
    
    // Determine the final status based on the payment
    let finalStatus: 'Paid' | 'Partial' | 'Unpaid' = selectedStatus;
    let finalAmount = paymentAmount;
    
    // If paying the remaining balance or more
    if (totalPaid >= originalAmount) {
      finalStatus = 'Paid';
      finalAmount = originalAmount; // Cap at the original amount
    } else if (totalPaid > 0) {
      finalStatus = 'Partial';
    } else {
      finalStatus = 'Unpaid';
    }
    
    const updateData = {
      paymentMethod: (finalStatus === 'Paid' || finalStatus === 'Partial') ? paymentMethod : undefined,
      actualDate: (finalStatus === 'Paid' || finalStatus === 'Partial') ? actualDate : undefined,
      amount: finalStatus === 'Partial' ? totalPaid : finalAmount,
      originalAmount: finalStatus === 'Partial' ? originalAmount : undefined,
      remainingDue: finalStatus === 'Partial' ? remainingAmount : 0
    };
    
    // This completes a partial payment
    
    onUpdate(payment.id, finalStatus, updateData);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const paymentDate = new Date(actualDate).toLocaleDateString('en-IN');
    
    // Payment update processed

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStatus('Paid');
    setPaymentMethod('Cash');
    setActualDate(new Date().toISOString().split('T')[0]);
    setActualAmount('');
  };

  const handleNotify = () => {
    if (payment) {
      onNotifyTenant(payment, tenantName);
    }
  };

  if (!payment) return null;

  // Calculate due date (5th of the next month after rental period)
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = monthNames.indexOf(payment.month);
  const dueDate = new Date(payment.year, monthIndex + 1, 5);

  return (
    <>
      {isOpen && receiptData && (
        <Receipt
          {...receiptData}
          onClose={hideReceipt}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle>Update Payment - {tenantName}</DialogTitle>
            {payment?.status === 'Paid' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => showReceiptForPayment(payment)}
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
            )}
          </DialogHeader>

          <div className="text-sm text-gray-600 space-y-1">
            <p>{payment.month} {payment.year} - ₹{payment.amount.toLocaleString()}</p>
            <p className="text-xs">Due Date: {dueDate.toLocaleDateString('en-IN')}</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Payment Status</Label>
              <RadioGroup 
                value={selectedStatus} 
                onValueChange={(value: PaymentStatus) => setSelectedStatus(value)} 
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Paid" id="paid" />
                  <Label htmlFor="paid">Paid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Unpaid" id="unpaid" />
                  <Label htmlFor="unpaid">Unpaid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Partial" id="partial" />
                  <Label htmlFor="partial">Partial Payment</Label>
                </div>
              </RadioGroup>
              
              {selectedStatus === 'Partial' && (
                <div className="mt-4">
                  <Label htmlFor="amount">Amount Paid</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="amount"
                      type="number"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(e.target.value)}
                      className="pl-8"
                      min={0}
                      max={payment?.amount}
                      step="1"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Total Due: <span className="font-medium">₹{payment?.amount.toLocaleString()}</span></div>
                    <div>Remaining: <span className="font-medium">₹{remainingDue.toLocaleString()}</span></div>
                    {amountPaid > 0 && (
                      <div className="mt-1 text-xs text-amber-600">
                        (Including previous payment of ₹{amountPaid.toLocaleString()})
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedStatus === 'Unpaid' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                You can notify the tenant about all pending payments via WhatsApp
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleNotify}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                📱 Send Payment Reminder
              </Button>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Update Payment
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentUpdateDialog;
