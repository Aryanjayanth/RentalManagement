
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unitNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  moveInDate?: string;
  notes?: string;
  documents?: string[];
  idProof?: {
    type: string;
    number: string;
    file?: string;
  };
  securityDeposit?: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'Apartment' | 'House' | 'Commercial';
  totalFlats: number;
  occupiedFlats: number;
  monthlyRent: number;
  depositAmount: number;
  amenities: string[];
  images: string[];
  description?: string;
  yearBuilt?: number;
  parking?: number;
  petPolicy?: 'Allowed' | 'Not Allowed' | 'Conditional';
  utilities?: string[];
  nearbyPlaces?: string[];
  rules?: string[];
  status?: 'Active' | 'Inactive' | 'Maintenance' | 'Vacant';
}

export interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Expired' | 'Terminated';
  terms?: string;
  renewalOptions?: string;
  maintenanceResponsibility?: string;
}
