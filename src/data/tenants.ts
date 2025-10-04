export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  status: 'Active' | 'Inactive' | 'Pending';
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  image?: string;
}

export const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(123) 456-7890',
    propertyId: '1',
    propertyName: 'Sunny Apartment',
    status: 'Active',
    rentAmount: 1200,
    leaseStart: '2023-01-01',
    leaseEnd: '2024-12-31',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(123) 456-7891',
    propertyId: '3',
    propertyName: 'Family House',
    status: 'Active',
    rentAmount: 2500,
    leaseStart: '2023-03-15',
    leaseEnd: '2024-03-14',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '(123) 456-7892',
    propertyId: '2',
    propertyName: 'Downtown Loft',
    status: 'Pending',
    rentAmount: 1500,
    leaseStart: '2023-04-01',
    leaseEnd: '2024-03-31',
  },
];
