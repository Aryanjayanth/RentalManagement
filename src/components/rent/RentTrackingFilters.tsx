import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tenant, Property } from '../tenant/types';

interface RentTrackingFiltersProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  selectedTenant: string;
  setSelectedTenant: (tenantId: string) => void;
  selectedProperty: string;
  setSelectedProperty: (propertyId: string) => void;
  monthsPending: string;
  setMonthsPending: (months: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tenants: Tenant[];
  properties: Property[];
}

const RentTrackingFilters = ({
  filterStatus,
  setFilterStatus,
  selectedTenant,
  setSelectedTenant,
  selectedProperty,
  setSelectedProperty,
  monthsPending,
  setMonthsPending,
  searchTerm,
  setSearchTerm,
  tenants,
  properties,
}: RentTrackingFiltersProps) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* ✅ Premium Search Box */}
          <div className="w-full max-w-xl">
            <label className="block text-sm font-medium mb-2">Search Payments</label>

            <div className="relative group">
              {/* background glow */}
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 blur opacity-0 group-focus-within:opacity-100 transition duration-500" />

              <div
                className={cn(
                  'relative flex items-center rounded-full border',
                  'bg-background/60 backdrop-blur-xl',
                  'border-border/60 hover:border-primary/40 transition-colors',
                  'px-3 py-2'
                )}
              >
                {/* Icon bubble */}
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/60 border border-border/50">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>

                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by tenant, property, status..."
                  className={cn(
                    'border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
                    'h-9 px-3 text-sm placeholder:text-muted-foreground/70',
                    'flex-1'
                  )}
                />

                {/* Clear button */}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center',
                      'text-muted-foreground hover:text-foreground',
                      'hover:bg-muted/60 transition-colors'
                    )}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
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

            {/* Tenant Filter */}
            <div className="min-w-48">
              <label className="block text-sm font-medium mb-2">Filter by Tenant</label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="👥 All Tenants" />
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

            {/* Property Filter */}
            <div className="min-w-48">
              <label className="block text-sm font-medium mb-2">Filter by Property</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="🏠 All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏠 All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Months Pending */}
            <div className="min-w-48">
              <label className="block text-sm font-medium mb-2">Months Pending</label>
              <Input
                type="number"
                min="0"
                value={monthsPending}
                onChange={(e) => setMonthsPending(e.target.value)}
                placeholder="Months pending"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentTrackingFilters;
