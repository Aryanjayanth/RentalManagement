import { useState } from 'react';

export interface ReceiptData {
  orderId: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  date: string;
}

const useReceipt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const showReceipt = (data: Omit<ReceiptData, 'date'>) => {
    setReceiptData({
      ...data,
      date: new Date().toISOString(),
    });
    setIsOpen(true);
  };

  const hideReceipt = () => {
    setIsOpen(false);
    // Small delay to allow the animation to complete
    setTimeout(() => setReceiptData(null), 300);
  };

  return {
    isOpen,
    receiptData,
    showReceipt,
    hideReceipt,
  };
};

export default useReceipt;
