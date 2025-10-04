
import { Card, CardContent } from '@/components/ui/card';

interface RentSummaryCardsProps {
  totalPaid: number;
  totalUnpaid: number;
  totalAdvance: number;
}

const RentSummaryCards = ({ totalPaid, totalUnpaid, totalAdvance }: RentSummaryCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600 text-2xl">
            💰
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending Amount</p>
            <p className="text-3xl font-bold text-red-600">₹{totalUnpaid.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-red-100 text-red-600 text-2xl">
            ⚠️
          </div>
        </div>
      </CardContent>
    </Card>
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Advance Payments</p>
            <p className="text-3xl font-bold text-blue-600">₹{totalAdvance.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-2xl">
            📈
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default RentSummaryCards;

