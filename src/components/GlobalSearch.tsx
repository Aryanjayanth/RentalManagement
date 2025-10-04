
import { useState, useEffect } from 'react';
import { Search, User, Home, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'tenant' | 'property' | 'lease';
  data: any;
}

interface GlobalSearchProps {
  onNavigate?: (type: string, data: any) => void;
}

export const GlobalSearch = ({ onNavigate }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Search across all data
    const properties = JSON.parse(localStorage.getItem('rental_properties') || '[]');
    const tenants = JSON.parse(localStorage.getItem('rental_tenants') || '[]');
    const leases = JSON.parse(localStorage.getItem('rental_leases') || '[]');

    const searchResults: SearchResult[] = [];

    // Search properties
    properties.forEach((property: any) => {
      if (property.name.toLowerCase().includes(query.toLowerCase()) ||
          property.address.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({
          id: property.id,
          title: property.name,
          subtitle: property.address,
          type: 'property',
          data: property
        });
      }
    });

    // Search tenants
    tenants.forEach((tenant: any) => {
      if (tenant.name.toLowerCase().includes(query.toLowerCase()) ||
          (tenant.email && tenant.email.toLowerCase().includes(query.toLowerCase()))) {
        searchResults.push({
          id: tenant.id,
          title: tenant.name,
          subtitle: tenant.email || tenant.phone,
          type: 'tenant',
          data: tenant
        });
      }
    });

    // Search leases
    leases.forEach((lease: any) => {
      const tenant = tenants.find((t: any) => t.id === lease.tenantId);
      const property = properties.find((p: any) => p.id === lease.propertyId);
      if (tenant && property) {
        const searchText = `${tenant.name} ${property.name}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          searchResults.push({
            id: lease.id,
            title: `${tenant.name} - ${property.name}`,
            subtitle: `Lease: ${lease.startDate} to ${lease.endDate}`,
            type: 'lease',
            data: lease
          });
        }
      }
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'tenant': return <User className="h-4 w-4" />;
      case 'property': return <Home className="h-4 w-4" />;
      case 'lease': return <FileText className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (onNavigate) {
      onNavigate(result.type, result.data);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-7 w-32 h-8 text-xs"
          />
        </div>
      </PopoverTrigger>
      {results.length > 0 && isOpen && (
        <PopoverContent className="w-80 p-2" align="start">
          <div className="space-y-1">
            {results.map((result) => (
              <Card key={result.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleResultClick(result)}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    {getIcon(result.type)}
                    <div>
                      <p className="font-medium text-sm">{result.title}</p>
                      <p className="text-xs text-gray-600">{result.subtitle}</p>
                      <p className="text-xs text-blue-600 capitalize">{result.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};
