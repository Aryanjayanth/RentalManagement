import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import Receipt from '@/components/Receipt';
import useReceipt from '@/hooks/useReceipt';
import PaymentUpdateDialog from './PaymentUpdateDialog';
import { Payment } from './generateRentDueRecords';

interface RentPaymentsListProps {
  payments: Payment[];
  allPayments: Payment[];
  getTenantName: (tenantId: string) => string;
  getTenantPhone: (tenantId: string) => string;
  getPropertyName: (tenantId: string) => string;
  isOverdue: (payment: Payment) => boolean;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
  getPaymentMethodIcon: (method?: string) => string;
  user?: { role?: string };
  updatePaymentStatus: (paymentId: string, newStatus: Payment['status'], updateData?: any) => void;
}

const RentPaymentsList = ({
  payments,
  allPayments,
  getTenantName,
  getTenantPhone,
  getPropertyName,
  isOverdue,
  getStatusColor,
  getStatusIcon,
  getPaymentMethodIcon,
  user,
  updatePaymentStatus,
}: RentPaymentsListProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  // Receipt functionality
  const { isOpen, receiptData, showReceipt, hideReceipt } = useReceipt();

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleNotifyTenant = (payment: Payment, tenantName: string) => {
    const tenantPhone = getTenantPhone(payment.tenantId);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Get all unpaid payments for this tenant
    const unpaidPayments = allPayments
      .filter(p => p.tenantId === payment.tenantId && p.status === 'Unpaid')
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });

    const propertyName = getPropertyName(payment.tenantId);
    let message = `Dear ${tenantName} (${propertyName}),\n\nThis is a payment reminder for your rental dues:\n\n`;
    
    let totalDue = 0;
    unpaidPayments.forEach((p, index) => {
      const monthIndex = monthNames.indexOf(p.month);
      const dueDate = new Date(p.year, monthIndex + 1, 5);
      
      message += `${index + 1}. ${p.month} ${p.year}: ₹${p.amount.toLocaleString()} (Due: ${dueDate.toLocaleDateString('en-IN')})\n`;
      totalDue += p.amount;
    });

    message += `\nTotal Outstanding: ₹${totalDue.toLocaleString()}\n`;
    message += `\nPlease make the payment at your earliest convenience to avoid any inconvenience.\n\nThank you for your cooperation.\n\n`;
    message += `దయచేసి త్వరలో చెల్లించండి. మీ సహకారానికి ధన్యవాదాలు.`;

    const encodedMessage = encodeURIComponent(message);
    
    // Use tenant's phone number if available, otherwise open generic WhatsApp
    const whatsappUrl = tenantPhone 
      ? `https://wa.me/${tenantPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleUpdatePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handlePaymentSuccess = (payment: Payment, status: string) => {
    console.log('handlePaymentSuccess called with:', { payment, status });
    try {
      if (!payment) {
        console.error('No payment data provided');
        return;
      }
      
      console.log('Payment data:', {
        id: payment.id,
        tenantId: payment.tenantId,
        amount: payment.amount,
        month: payment.month,
        year: payment.year,
        paymentMethod: payment.paymentMethod
      });
      
      const customerName = getTenantName(payment.tenantId);
      console.log('Customer name:', customerName);
      
      // Get all unpaid payments for this tenant
      const unpaidPayments = allPayments.filter(p => 
        p.tenantId === payment.tenantId && 
        p.status !== 'Paid' && 
        p.id !== payment.id
      );
      
      // Format remaining dues
      const remainingDues = unpaidPayments.map(p => ({
        month: p.month,
        year: p.year,
        amount: p.amount,
        dueDate: new Date(p.year, new Date(`${p.month} 1, ${p.year}`).getMonth() + 1, 5).toLocaleDateString('en-IN')
      }));
      
      // Show receipt with payment details
      const receiptData = {
        orderId: `PAY-${payment.id.slice(0, 8).toUpperCase()}`,
        customerName: customerName,
        items: [
          {
            name: `Rent for ${payment.month} ${payment.year}`,
            quantity: 1,
            price: payment.amount,
            dueDate: new Date(payment.year, new Date(`${payment.month} 1, ${payment.year}`).getMonth() + 1, 5).toLocaleDateString('en-IN'),
            status: payment.status
          }
        ],
        total: payment.amount,
        paymentMethod: payment.paymentMethod || 'Cash',
        date: new Date().toISOString(),
        remainingDues: remainingDues
      };
      
      console.log('Calling showReceipt with:', receiptData);
      showReceipt(receiptData);
      console.log('After showReceipt call');
    } catch (error) {
      console.error('Error showing receipt:', error);
    }
  };

  if (!payments.length) {
    return (
      <div className="text-center py-16">
        <div className="text-8xl mb-6">💰</div>
        <h3 className="text-2xl font-bold text-gray-600 mb-4">No Payment Records Found</h3>
        <p className="text-gray-500 mb-6">Start recording rent payments to track tenant payment history.</p>
      </div>
    );
  }

  // Get unique tenant IDs with unpaid payments
  const tenantsWithUnpaid = Array.from(
    new Set(
      allPayments
        .filter(payment => payment.status === 'Unpaid')
        .map(payment => payment.tenantId)
    )
  );

  const handleNotifyAll = () => {
    tenantsWithUnpaid.forEach(tenantId => {
      const tenantPayments = allPayments.filter(
        p => p.tenantId === tenantId && p.status === 'Unpaid'
      );
      if (tenantPayments.length > 0) {
        const tenantName = getTenantName(tenantId);
        handleNotifyTenant(tenantPayments[0], tenantName);
      }
    });
  };

  return (
    <>
      {isOpen && receiptData && (
        <Receipt
          {...receiptData}
          onClose={hideReceipt}
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Rent Payments</h2>
        {tenantsWithUnpaid.length > 0 && (
          <Button
            onClick={handleNotifyAll}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            📢 Notify All Unpaid Tenants
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {payments
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((payment) => {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthIndex = monthNames.indexOf(payment.month);
            const dueDate = new Date(payment.year, monthIndex + 1, 5);
            
            return (
              <Card
                key={payment.id}
                className={`border-0 shadow-lg transition-all hover:shadow-xl ${
                  isOverdue(payment) ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">{getTenantName(payment.tenantId)}</h4>
                        <Badge className={`${getStatusColor(payment.status)} border text-sm`}>
                          {getStatusIcon(payment.status)} {payment.status}
                        </Badge>
                        {payment.paymentMethod && (
                          <Badge variant="outline" className="text-sm">
                            {getPaymentMethodIcon(payment.paymentMethod)} {payment.paymentMethod}
                          </Badge>
                        )}
                        {isOverdue(payment) && (
                          <Badge className="bg-red-500 text-white text-xs font-bold animate-pulse">
                            🚨 OVERDUE
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">🏠 Property:</span>
                          <span className="font-medium">{getPropertyName(payment.tenantId)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">📅 Period:</span>
                          <span className="font-bold text-lg text-blue-600">
                            {payment.month} {payment.year}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">⏰ Due Date:</span>
                          <span className="font-medium text-orange-600">
                            {dueDate.toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        {payment.status === 'Paid' && payment.paymentMethod && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <span className="mr-2">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                            {payment.paymentMethod}
                            {payment.paidDate && ` • ${new Date(payment.paidDate).toLocaleDateString('en-IN')}`}
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">💰 Amount:</span>
                          {payment.status === 'Partial' && payment.originalAmount ? (
                            <div className="flex flex-col">
                              <div className="text-sm text-gray-500 line-through">
                                Original: ₹{payment.originalAmount.toLocaleString()}
                              </div>
                              <div className="font-bold text-lg">
                                Paid: ₹{payment.amount.toLocaleString()}
                              </div>
                              <div className="text-sm font-medium text-red-600">
                                Remaining: ₹{(payment.remainingDue || 0).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="font-bold text-lg">₹{payment.amount.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {user?.role !== 'Staff' && (
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePayment(payment)}
                          className="w-32"
                        >
                          {payment.status === 'Paid' ? 'View Details' : 'Update Status'}
                        </Button>
                        {payment.status === 'Paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePaymentSuccess(payment, payment.status)}
                            className="w-32 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                          >
                            🖨️ Print Receipt
                          </Button>
                        )}
                        {payment.status === 'Unpaid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNotifyTenant(payment, getTenantName(payment.tenantId))}
                            className="w-32 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            📱 Send Reminder
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <PaymentUpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        tenantName={selectedPayment ? getTenantName(selectedPayment.tenantId) : ''}
        onUpdate={updatePaymentStatus}
        onNotifyTenant={handleNotifyTenant}
        allPayments={allPayments}
      />
    </>
  );
};

export default RentPaymentsList;
