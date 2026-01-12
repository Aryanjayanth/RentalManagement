
import { Button } from '@/components/ui/button';
import { Tenant, Property } from '../tenant/types';
import { Payment } from './generateRentDueRecords';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';

interface RentTrackingHeaderProps {
  generateRentDueRecords: () => void;
  tenants: Tenant[];
  properties: Property[];
  payments: Payment[];
  savePayments: (payments: Payment[]) => void;
  getPropertyName: (tenantId: string) => string;
  getTenantName: (tenantId: string) => string;
}

const RentTrackingHeader = ({
  generateRentDueRecords,
  payments,
  getTenantName,
  getPropertyName,
  tenants,
  properties
}: RentTrackingHeaderProps) => {
  
  const exportToCSV = () => {
    // Prepare CSV content
    const headers = [
      'Tenant Name',
      'Property',
      'Month',
      'Year',
      'Amount (₹)',
      'Status',
      'Payment Method',
      'Paid Date',
      'Due Date'
    ];

    const rows = payments.map(payment => {
      const dueDate = new Date(payment.year, new Date(`${payment.month} 1, ${payment.year}`).getMonth(), 5);
      return [
        `"${getTenantName(payment.tenantId) || 'N/A'}"`,
        `"${getPropertyName(payment.tenantId) || 'N/A'}"`,
        `"${payment.month}"`,
        `"${payment.year}"`,
        `"${payment.amount.toLocaleString('en-IN')}"`,
        `"${payment.status}"`,
        `"${payment.paymentMethod || 'N/A'}"`,
        `"${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN') : 'N/A'}"`,
        `"${dueDate.toLocaleDateString('en-IN')}"`
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `rent-payments-${new Date().toISOString().split('T')[0]}.csv`);
  };
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl opacity-10"></div>
      <div className="relative p-8 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Rent Tracking
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage all rent payments efficiently</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={generateRentDueRecords} 
              variant="outline" 
              className="bg-blue-50 hover:bg-blue-100"
            >
              🔄 Generate Rent Due
            </Button>
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              disabled={payments.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentTrackingHeader;
