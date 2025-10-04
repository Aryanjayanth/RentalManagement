
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant } from '../tenant/types';

interface RentTrackingFiltersProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  selectedTenant: string;
  setSelectedTenant: (tenantId: string) => void;
  tenants: Tenant[];
}

const RentTrackingFilters = ({
  filterStatus,
  setFilterStatus,
  selectedTenant,
  setSelectedTenant,
  tenants,
}: RentTrackingFiltersProps) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-48">
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">🔍 All Status</SelectItem>
                <SelectItem value="Paid">✅ Paid Only</SelectItem>
                <SelectItem value="Unpaid">❌ Unpaid Only</SelectItem>
                <SelectItem value="Advance">⬆️ Advance Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="min-w-48">
            <label className="block text-sm font-medium mb-2">Filter by Tenant</label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentTrackingFilters;
