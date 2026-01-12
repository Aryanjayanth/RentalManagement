import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTenants } from "@/data/tenants";
import { PageSearch } from "@/components/search/PageSearch";
import { SearchResults } from "@/components/search/SearchResults";

export function TenantsList() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return mockTenants;
    
    const query = searchQuery.toLowerCase();
    return mockTenants.filter(tenant => 
      tenant.name.toLowerCase().includes(query) ||
      tenant.email.toLowerCase().includes(query) ||
      tenant.phone.includes(query) ||
      tenant.propertyName.toLowerCase().includes(query) ||
      tenant.status.toLowerCase().includes(query) ||
      tenant.rentAmount.toString().includes(query)
    );
  }, [searchQuery]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your tenants and their information
          </p>
        </div>
        <PageSearch
          placeholder="Search tenants..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          className="w-full sm:w-auto"
        />
      </div>

      <SearchResults
        items={filteredTenants}
        emptyMessage="No tenants found matching your search."
        renderItem={(tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <CardDescription className="mt-1">{tenant.email}</CardDescription>
                </div>
                <Badge className={getStatusVariant(tenant.status)}>
                  {tenant.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span>{tenant.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent:</span>
                  <span>₹{tenant.rentAmount.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lease:</span>
                  <span>
                    {new Date(tenant.leaseStart).toLocaleDateString()} - {new Date(tenant.leaseEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{tenant.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}
