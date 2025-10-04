
import TenantCard from "./TenantCard";
import { Tenant, Property, Lease } from "./types";

interface TenantListProps {
  tenants: Tenant[];
  leases: Lease[];
  properties: Property[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onTenantClick?: (tenant: Tenant) => void;
  tenantRemainingDues?: Record<string, number>;
}

const getTenantPropertyNames = (
  tenantId: string,
  leases: Lease[],
  properties: Property[]
): string[] => {
  const leasesForTenant = leases.filter(l => l.tenantId === tenantId);
  const propertyNames = leasesForTenant
    .map(l => properties.find(p => p.id === l.propertyId)?.name)
    .filter(Boolean) as string[];
  return Array.from(new Set(propertyNames));
};

const TenantList = ({
  tenants,
  leases,
  properties,
  onEdit,
  onDelete,
  onTenantClick,
  tenantRemainingDues = {}
}: TenantListProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {tenants.map((tenant) => {
      const propertyNames = getTenantPropertyNames(tenant.id, leases, properties);
      return (
        <TenantCard
          key={tenant.id}
          tenant={tenant}
          propertyNames={propertyNames}
          onEdit={onEdit}
          onDelete={onDelete}
          onTenantClick={onTenantClick}
          remainingDue={tenantRemainingDues[tenant.id] || 0}
        />
      );
    })}
  </div>
);

export default TenantList;
