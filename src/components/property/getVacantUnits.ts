
import type { Property } from "../pages/PropertyManagement";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  status?: string;
  monthlyRent?: number;
  units?: number;
}

/**
 * Returns the number of vacant units for a given property based on active leases.
 */
export function getVacantUnits(property: Property): number {
  try {
    // Get active leases from localStorage
    const leasesData = localStorage.getItem('rental_leases');
    const leases: Lease[] = leasesData ? JSON.parse(leasesData) : [];
    
    // Count total units occupied by active leases for this property
    const totalOccupiedUnits = leases
      .filter(lease => 
        lease.propertyId === property.id && 
        (!lease.status || lease.status === 'Active') &&
        new Date(lease.endDate) >= new Date()
      )
      .reduce((sum, lease) => sum + (lease.units || 1), 0);
    
    const totalUnits = Number(property.totalFlats) || 0;
    
    console.log(`[DEBUG] Property ${property.name}: ${totalOccupiedUnits} units occupied out of ${totalUnits} total units`);
    
    return Math.max(totalUnits - totalOccupiedUnits, 0);
  } catch (error) {
    console.error('Error calculating vacant units:', error);
    // Fallback to original calculation if there's an error
    const total = Number(property.totalFlats) || 0;
    const occupied = Number(property.occupiedFlats) || 0;
    return Math.max(total - occupied, 0);
  }
}

/**
 * Returns the number of occupied units for a given property based on active leases.
 */
export function getOccupiedUnits(property: Property): number {
  try {
    const leasesData = localStorage.getItem('rental_leases');
    const leases: Lease[] = leasesData ? JSON.parse(leasesData) : [];
    
    const totalOccupiedUnits = leases
      .filter(lease => 
        lease.propertyId === property.id && 
        (!lease.status || lease.status === 'Active') &&
        new Date(lease.endDate) >= new Date()
      )
      .reduce((sum, lease) => sum + (lease.units || 1), 0);
    
    return totalOccupiedUnits;
  } catch (error) {
    console.error('Error calculating occupied units:', error);
    return Number(property.occupiedFlats) || 0;
  }
}
