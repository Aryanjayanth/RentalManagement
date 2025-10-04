import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import TenantHeader from "../tenant/TenantHeader";
import TenantList from "../tenant/TenantList";
import TenantFormDialog from "../tenant/TenantFormDialog";
import { getInitialFormData } from "../tenant/tenantFormUtils";
import { Tenant, Property, Lease } from "../tenant/types";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import TenantReportView from "../tenant/TenantReportView";

const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [tenantRemainingDues, setTenantRemainingDues] = useState<Record<string, number>>({});
  
  // Calculate remaining due for each tenant when payments change
  useEffect(() => {
    const dues: Record<string, number> = {};
    
    payments.forEach(payment => {
      if (!dues[payment.tenantId]) {
        dues[payment.tenantId] = 0;
      }
      
      if (payment.status === 'Unpaid' || (payment.status === 'Paid' && payment.amount < (payment.originalAmount || payment.amount))) {
        const paidAmount = payment.status === 'Paid' ? payment.amount : 0;
        const originalAmount = payment.originalAmount || payment.amount;
        dues[payment.tenantId] += (originalAmount - paidAmount);
      }
    });
    
    setTenantRemainingDues(dues);
  }, [payments]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddTenant: () => {
      resetForm();
      setIsAddDialogOpen(true);
    },
  });

  useEffect(() => {
    const savedTenants = localStorage.getItem('rental_tenants');
    const savedProperties = localStorage.getItem('rental_properties');
    const savedLeases = localStorage.getItem('rental_leases');
    const savedPayments = localStorage.getItem('rental_payments');
    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    }
    if (savedProperties) {
      setProperties(JSON.parse(savedProperties));
    }
    if (savedLeases) {
      setLeases(JSON.parse(savedLeases));
    }
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    }
  }, []);

  const saveTenants = (updatedTenants: Tenant[]) => {
    localStorage.setItem('rental_tenants', JSON.stringify(updatedTenants));
    setTenants(updatedTenants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tenantData: Tenant = {
      id: editingTenant?.id || Date.now().toString(),
      name: formData.name,
      email: formData.email?.trim() ? formData.email : undefined,
      phone: formData.phone,
      moveInDate: "",
      securityDeposit: 0,
      emergencyContact: formData.emergencyContact,
      propertyId: "", // Remains empty string as required by Tenant interface
    };

    let updatedTenants;
    if (editingTenant) {
      updatedTenants = tenants.map(t => t.id === editingTenant.id ? tenantData : t);
      toast({ title: "Tenant updated successfully!" });
    } else {
      updatedTenants = [...tenants, tenantData];
      toast({ title: "Tenant added successfully!" });
    }

    saveTenants(updatedTenants);
    resetForm();
    setIsAddDialogOpen(false);
    setEditingTenant(null);
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      email: tenant.email ?? '',
      phone: tenant.phone,
      emergencyContact: tenant.emergencyContact || { name: '', phone: '', relationship: '' },
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      const updatedTenants = tenants.filter(t => t.id !== id);
      saveTenants(updatedTenants);
      toast({ title: "Tenant deleted successfully!" });
    }
  };

  const handleTenantClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  const renderTenantFormDialog = () => (
    <TenantFormDialog
      open={isAddDialogOpen}
      onOpenChange={setIsAddDialogOpen}
      editingTenant={editingTenant}
      formData={formData}
      onFormChange={setFormData}
      onSubmit={handleSubmit}
      onCancel={() => {
        setIsAddDialogOpen(false);
        setEditingTenant(null);
        resetForm();
      }}
      onReset={resetForm}
    />
  );

  // If viewing a specific tenant report, show the detailed view
  if (selectedTenant) {
    return (
      <TenantReportView
        tenant={selectedTenant}
        onBack={() => setSelectedTenant(null)}
        properties={properties}
        leases={leases}
        payments={payments}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <TenantHeader
          tenantCount={tenants.length}
          propertyCount={properties.length}
          onAdd={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
        >
          {renderTenantFormDialog()}
        </TenantHeader>
        <TenantList
          tenants={tenants}
          leases={leases}
          properties={properties}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTenantClick={handleTenantClick}
          tenantRemainingDues={tenantRemainingDues}
        />

        {tenants.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
              <User className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">No Tenants Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start building your tenant portfolio by adding your first tenant to the system.
            </p>
            <Button 
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <User className="h-5 w-5 mr-2" />
              Add Your First Tenant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantManagement;
