
import { User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface TenantHeaderProps {
  tenantCount: number;
  propertyCount: number;
  onAdd: () => void;
  children: React.ReactNode; // Should contain the TenantFormDialog trigger+content
}

const TenantHeader = ({
  tenantCount,
  propertyCount,
  onAdd,
  children,
}: TenantHeaderProps) => (
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 p-8 text-white shadow-2xl">
    <div className="absolute inset-0 bg-black/10"></div>
    <div className="relative flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold mb-2">Tenant Management</h1>
        <p className="text-blue-100 text-lg">Manage all your tenants efficiently</p>
        <div className="flex items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span className="text-sm">{tenantCount} Total Tenants</span>
          </div>
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span className="text-sm">{propertyCount} Properties</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

export default TenantHeader;
