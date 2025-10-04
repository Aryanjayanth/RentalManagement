
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Tenant as TenantType, Property as PropertyType, Lease as LeaseType } from '../tenant/types';
import { Payment as RentDuePayment } from './generateRentDueRecords';

interface RentPaymentFormDialogProps {
  tenants: TenantType[];
  properties: PropertyType[];
  leases: LeaseType[];
  payments: RentDuePayment[];
  savePayments: (payments: RentDuePayment[]) => void;
  getPropertyName: (tenantId: string) => string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const RentPaymentFormDialog = ({
  tenants,
  properties,
  leases,
  payments,
  savePayments,
  getPropertyName,
  open,
  setOpen,
}: RentPaymentFormDialogProps) => {
  const [formData, setFormData] = useState({
    tenantId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Paid' as 'Paid' | 'Unpaid' | 'Partial',
    month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'Cash' as 'Cash' | 'UPI' | 'Bank Transfer' | 'Check'
  });

  const resetForm = () => {
    setFormData({
      tenantId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: 'Cash'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month] = formData.month.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let targetMonth = monthNames[parseInt(month) - 1];
    let targetYear = parseInt(year);
    let redirect = false;

    // Enhanced chronological payment enforcement for both Paid and Partial statuses
    if (formData.status === 'Paid' || formData.status === 'Partial') {
      // Get all unpaid or partial payments for this tenant, sorted chronologically
      const tenantPendingPayments = payments
        .filter(
          p =>
            p.tenantId === formData.tenantId &&
            (p.status === 'Unpaid' || p.status === 'Partial') &&
            // Only consider payments that are not for the current month being processed
            !(p.month === targetMonth && p.year === targetYear)
        )
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });

      const selectedMonthIndex = (targetYear * 12) + monthNames.indexOf(targetMonth);

      // Check each pending payment to see if it's earlier than the selected month
      for (const pendingPayment of tenantPendingPayments) {
        const pendingMonthIndex = (pendingPayment.year * 12) + monthNames.indexOf(pendingPayment.month);
        
        if (pendingMonthIndex < selectedMonthIndex) {
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

    // Check if a payment record already exists for the target month/year and tenant
    const existingPaymentIndex = payments.findIndex(p => 
      p.tenantId === formData.tenantId && 
      p.month === targetMonth && 
      p.year === targetYear
    );

    let updatedPayments;

    if (existingPaymentIndex !== -1) {
      // Update existing payment record
      updatedPayments = payments.map((payment, index) => 
        index === existingPaymentIndex 
          ? {
              ...payment,
              amount: Number(formData.amount),
              date: formData.date,
              status: formData.status,
              paymentMethod: formData.paymentMethod,
              paidDate: formData.status === 'Paid' ? formData.date : undefined
            }
          : payment
      );
    } else {
      // Get the tenant's active lease and property
      const tenant = tenants.find(t => t.id === formData.tenantId);
      const lease = leases.find(l => l.tenantId === formData.tenantId && 
        new Date(l.startDate) <= new Date() && 
        new Date(l.endDate) >= new Date());
      
      if (!lease) {
        toast({
          title: "Error",
          description: "Could not find an active lease for this tenant.",
          variant: "destructive",
        });
        return;
      }

      // Create new payment record only if none exists
      const paymentData: RentDuePayment = {
        id: Date.now().toString(),
        tenantId: formData.tenantId,
        leaseId: lease.id,
        propertyId: lease.propertyId || '',
        amount: Number(formData.amount),
        date: formData.date,
        status: formData.status,
        month: targetMonth,
        year: targetYear,
        paymentMethod: formData.status === 'Paid' ? formData.paymentMethod : undefined,
        paidDate: formData.status === 'Paid' ? formData.date : undefined
      };
      updatedPayments = [...payments, paymentData];
    }

    savePayments(updatedPayments);
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForm} size="lg" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg">
          ➕ Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Rent Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tenant</label>
            <Select value={formData.tenantId} onValueChange={(value) => setFormData(prev => ({ ...prev, tenantId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} - {getPropertyName(tenant.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <Select value={formData.paymentMethod} onValueChange={(value: 'Cash' | 'UPI' | 'Bank Transfer' | 'Check') => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
              <SelectTrigger>
                <SelectValue />
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
            <label className="block text-sm font-medium mb-2">Payment Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">For Month/Year</label>
            <Input
              type="month"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'Paid' | 'Unpaid' | 'Partial') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">✅ Paid (Full Amount)</SelectItem>
                <SelectItem value="Partial">💰 Partial Payment</SelectItem>
                <SelectItem value="Unpaid">❌ Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">Record Payment</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RentPaymentFormDialog;
