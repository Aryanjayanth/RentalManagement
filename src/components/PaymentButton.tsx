import React from 'react';
import { Button } from './ui/button';
import { ReceiptText } from 'lucide-react';
import useReceipt from '@/hooks/useReceipt';

interface PaymentButtonProps {
  orderId: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod?: string;
  onPaymentSuccess?: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderId,
  customerName,
  items,
  total,
  paymentMethod = 'Cash',
  onPaymentSuccess,
  children,
}) => {
  const { showReceipt } = useReceipt();

  const handlePayment = () => {
    // Here you would typically process the payment
    // For now, we'll just show the receipt
    showReceipt({
      orderId,
      customerName,
      items,
      total,
      paymentMethod,
    });
    
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      className="bg-green-600 hover:bg-green-700"
    >
      <ReceiptText className="mr-2 h-4 w-4" />
      {children || 'Complete Payment'}
    </Button>
  );
};

export default PaymentButton;
