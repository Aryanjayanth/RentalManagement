
import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Payment } from './generateRentDueRecords';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Update Payment - {tenantName}
            </DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              {payment.month} {payment.year} • Due {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </DialogHeader>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{payment.amount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  payment.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">Update Payment Status</h3>
              <RadioGroup 
                value={selectedStatus} 
                onValueChange={(value: PaymentStatus) => setSelectedStatus(value)} 
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="Paid" id="paid" className="mt-1" />
                  <Label htmlFor="paid" className="flex-1">
                    <div className="font-medium text-gray-900">Mark as Paid</div>
                    <p className="text-sm text-gray-500 mt-0.5">Full payment received</p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="Partial" id="partial" className="mt-1" />
                  <Label htmlFor="partial" className="flex-1">
                    <div className="font-medium text-gray-900">Partial Payment</div>
                    <p className="text-sm text-gray-500 mt-0.5">Received partial amount</p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="Unpaid" id="unpaid" className="mt-1" />
                  <Label htmlFor="unpaid" className="flex-1">
                    <div className="font-medium text-gray-900">Mark as Unpaid</div>
                    <p className="text-sm text-gray-500 mt-0.5">No payment received</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(selectedStatus === 'Paid' || selectedStatus === 'Partial') && (
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">💵 Cash</SelectItem>
                      <SelectItem value="UPI">📱 UPI</SelectItem>
                      <SelectItem value="Bank Transfer">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="Check">📋 Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-2">Date Paid</Label>
                  <Input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-1">Total Due</div>
                      <div className="text-lg font-semibold text-gray-900">₹{totalDue.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs font-medium text-blue-600 mb-1">Amount Paid</div>
                      <div className="text-lg font-semibold text-blue-800">
                        {amountPaid > 0 ? `₹${amountPaid.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">
                      Amount to Pay Now (₹)
                    </Label>
                    <Input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setActualAmount(value);
                      if (!value) return;
                      
                      const paid = Number(value);
                      const totalPaid = amountPaid + paid;
                      
                      if (totalPaid >= totalDue) {
                        setSelectedStatus('Paid');
                      } else if (paid > 0) {
                        setSelectedStatus('Partial');
                      } else {
                        setSelectedStatus('Unpaid');
                      }
                    }}
                    placeholder={`Remaining: ₹${remainingDue.toLocaleString()}`}
                    max={remainingDue}
                    min={0}
                    step="0.01"
                  />
                  
                  {selectedStatus === 'Partial' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-amber-800">Remaining Balance</span>
                        <span className="font-semibold text-amber-900">₹{remainingDue.toLocaleString()}</span>
                      </div>
                      {amountPaid > 0 && (
                        <div className="mt-1 text-xs text-amber-700">
                          (Including previous payment of ₹{amountPaid.toLocaleString()})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {selectedStatus === 'Unpaid' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Payment Pending</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>This payment is currently marked as unpaid. You can send a payment reminder to the tenant.</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNotify}
                        className="inline-flex items-center bg-white text-amber-700 hover:bg-amber-50 border-amber-300"
                      >
                        <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Send Payment Reminder
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-gray-600 hover:bg-transparent hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Update Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentUpdateDialog;
