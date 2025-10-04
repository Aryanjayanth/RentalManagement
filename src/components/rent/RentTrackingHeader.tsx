
import { Button } from '@/components/ui/button';
import { Tenant, Property } from '../tenant/types';
import { Payment } from './generateRentDueRecords';

interface RentTrackingHeaderProps {
  generateRentDueRecords: () => void;
  tenants: Tenant[];
  properties: Property[];
  payments: Payment[];
  savePayments: (payments: Payment[]) => void;
  getPropertyName: (tenantId: string) => string;
}

const RentTrackingHeader = ({
  generateRentDueRecords,
}: RentTrackingHeaderProps) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentTrackingHeader;
