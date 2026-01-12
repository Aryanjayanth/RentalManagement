
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import LeaseTerminationDialog from '../lease/LeaseTerminationDialog';
import { Calendar, MapPin, User, DollarSign, FileText, Plus, Building2, Users } from 'lucide-react';

interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Expired' | 'Terminated';
  terms: string;
  units?: number;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  totalFlats: number;
  occupiedFlats: number;
  floors: number;
  status: 'Fully Occupied' | 'Partially Occupied' | 'Vacant';
  description: string;
  image?: string;
  createdAt: string;
}

interface LeaseManagementProps {
  onNavigateToRentTracking: () => void;
}

const LeaseManagement = ({ onNavigateToRentTracking }: LeaseManagementProps) => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [terminationDialogOpen, setTerminationDialogOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  const [formData, setFormData] = useState({
    tenantId: '',
    propertyId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    terms: '',
    units: '1'
  });

  useEffect(() => {
    const savedLeases = localStorage.getItem('rental_leases');
    const savedTenants = localStorage.getItem('rental_tenants');
    const savedProperties = localStorage.getItem('rental_properties');
    
    if (savedLeases) setLeases(JSON.parse(savedLeases));
    if (savedTenants) setTenants(JSON.parse(savedTenants));
    if (savedProperties) setProperties(JSON.parse(savedProperties));
  }, []);

  const saveLeases = (updatedLeases: Lease[]) => {
    localStorage.setItem('rental_leases', JSON.stringify(updatedLeases));
    setLeases(updatedLeases);
  };

  const resetForm = () => {
    setFormData({
      tenantId: '',
      propertyId: '',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      terms: '',
      units: '1'
    });
    setEditingLease(null);
  };

  // Function to get available units for a property
  const getAvailableUnits = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return 0;
    
    // Get all active leases for this property
    const activeLeases = leases.filter(
      lease => lease.propertyId === propertyId && lease.status === 'Active'
    );
    
    // Calculate total units already leased
    const totalLeasedUnits = activeLeases.reduce(
      (sum, lease) => sum + (lease.units || 1), 0
    );
    
    // Return available units
    return Math.max(0, property.totalFlats - totalLeasedUnits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId || !formData.propertyId || !formData.startDate || !formData.endDate || !formData.monthlyRent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const unitsToLease = Number(formData.units) || 1;
    const availableUnits = getAvailableUnits(formData.propertyId);
    
    // If editing, add back the current lease's units to available units
    const editingLeaseUnits = editingLease?.units || 0;
    const actualAvailable = editingLease 
      ? availableUnits + editingLeaseUnits 
      : availableUnits;
    
    if (unitsToLease > actualAvailable) {
      toast({
        title: "Error",
        description: `Only ${actualAvailable} unit(s) available in this property.`,
        variant: "destructive"
      });
      return;
    }

    const lease: Lease = {
      id: editingLease?.id || Date.now().toString(),
      tenantId: formData.tenantId,
      propertyId: formData.propertyId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit) || 0,
      status: editingLease?.status || 'Active',
      terms: formData.terms,
      units: Number(formData.units) || 1,
      createdAt: editingLease?.createdAt || new Date().toISOString()
    };

    let updatedLeases;
    if (editingLease) {
      updatedLeases = leases.map(l => l.id === lease.id ? lease : l);
    } else {
      updatedLeases = [...leases, lease];
    }

    saveLeases(updatedLeases);
    
    toast({
      title: editingLease ? "Lease Updated" : "Lease Created",
      description: `Lease has been ${editingLease ? 'updated' : 'created'} successfully.`
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setFormData({
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      startDate: lease.startDate,
      endDate: lease.endDate,
      monthlyRent: lease.monthlyRent.toString(),
      securityDeposit: lease.securityDeposit.toString(),
      terms: lease.terms,
      units: (lease.units || 1).toString()
    });
    setIsAddDialogOpen(true);
  };

  const handleTerminate = (lease: Lease) => {
    setSelectedLease(lease);
    setTerminationDialogOpen(true);
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return '✅';
      case 'Expired': return '⏰';
      case 'Terminated': return '❌';
      default: return '⚪';
    }
  };

  const isLeaseExpiringSoon = (endDate: string) => {
    const today = new Date();
    const leaseEnd = new Date(endDate);
    const daysUntilExpiry = Math.ceil((leaseEnd.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const activeLeases = leases.filter(l => l.status === 'Active').length;
  const expiredLeases = leases.filter(l => l.status === 'Expired').length;
  const terminatedLeases = leases.filter(l => l.status === 'Terminated').length;
  const totalRentCollected = leases.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.monthlyRent, 0);
  const totalUnitsLeased = leases.filter(l => l.status === 'Active').reduce((sum, l) => sum + (l.units || 1), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-3 h-8 w-8 text-blue-600" />
            Lease Management
          </h2>
          <p className="text-gray-600 mt-1">Manage rental agreements and lease terms</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Lease
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLease ? 'Edit Lease' : 'Create New Lease'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tenant *</label>
                <Select value={formData.tenantId} onValueChange={(value) => setFormData(prev => ({ ...prev, tenantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Property *</label>
                <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Units</label>
                  {formData.propertyId && (
                    <span className="text-xs text-gray-500">
                      Available: {getAvailableUnits(formData.propertyId) + (editingLease?.units || 0)}
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  min="1"
                  max={formData.propertyId ? getAvailableUnits(formData.propertyId) + (editingLease?.units || 0) : undefined}
                  value={formData.units}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (Number(value) > 0 && (!formData.propertyId || Number(value) <= getAvailableUnits(formData.propertyId) + (editingLease?.units || 0)))) {
                      setFormData(prev => ({ ...prev, units: value }));
                    }
                  }}
                  placeholder="Number of units"
                  className="w-full"
                  disabled={!formData.propertyId}
                />
                {formData.propertyId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getAvailableUnits(formData.propertyId) + (editingLease?.units || 0)} unit(s) available
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Rent (₹) *</label>
                  <Input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Security Deposit (₹)</label>
                  <Input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
                <Input
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Additional lease terms..."
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLease ? 'Update Lease' : 'Create Lease'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Leases</p>
                <p className="text-3xl font-bold text-green-600">{activeLeases}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Units Leased</p>
                <p className="text-3xl font-bold text-blue-600">{totalUnitsLeased}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-3xl font-bold text-purple-600">₹{totalRentCollected.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-3xl font-bold text-yellow-600">{expiredLeases}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Terminated</p>
                <p className="text-3xl font-bold text-red-600">{terminatedLeases}</p>
              </div>
              <User className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Lease Cards */}
      <div className="space-y-6">
        {leases.length > 0 ? (
          leases
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((lease) => (
              <Card key={lease.id} className={`border-0 shadow-xl transition-all hover:shadow-2xl bg-gradient-to-r from-white to-gray-50 ${isLeaseExpiringSoon(lease.endDate) ? 'ring-2 ring-orange-500' : ''}`}>
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {getTenantName(lease.tenantId).charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900">{getTenantName(lease.tenantId)}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <Badge className={`${getStatusColor(lease.status)} text-sm font-semibold`}>
                              {getStatusIcon(lease.status)} {lease.status}
                            </Badge>
                            {isLeaseExpiringSoon(lease.endDate) && lease.status === 'Active' && (
                              <Badge className="bg-orange-500 text-white text-xs font-bold animate-pulse">
                                🚨 EXPIRING SOON
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">PROPERTY</p>
                              <p className="font-bold text-gray-900">{getPropertyName(lease.propertyId)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">UNITS</p>
                              <p className="font-bold text-gray-900">{lease.units || 1} Unit{(lease.units || 1) > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-purple-600 font-medium">MONTHLY RENT</p>
                              <p className="font-bold text-gray-900">₹{lease.monthlyRent.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="text-xs text-yellow-600 font-medium">START DATE</p>
                              <p className="font-bold text-gray-900">
                                {new Date(lease.startDate).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="text-xs text-red-600 font-medium">END DATE</p>
                              <p className="font-bold text-gray-900">
                                {new Date(lease.endDate).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">SECURITY DEPOSIT</p>
                              <p className="font-bold text-gray-900">₹{lease.securityDeposit.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {lease.terms && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions:</p>
                          <p className="text-sm text-gray-600">{lease.terms}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-3 ml-8">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(lease)}
                        className="w-28 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        Edit Lease
                      </Button>
                      {lease.status === 'Active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleTerminate(lease)}
                          className="w-28"
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Leases Created Yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first lease agreement to start managing tenant relationships and track rental income.</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create First Lease
            </Button>
          </div>
        )}
      </div>

      <LeaseTerminationDialog
        isOpen={terminationDialogOpen}
        onOpenChange={setTerminationDialogOpen}
        onConfirm={(shouldDeleteUnpaidRents: boolean) => {
          if (selectedLease) {
            const updatedLeases = leases.map(lease => 
              lease.id === selectedLease.id 
                ? { ...lease, status: 'Terminated' as const }
                : lease
            );
            saveLeases(updatedLeases);
            
            toast({
              title: "Lease Terminated",
              description: "Lease has been terminated successfully."
            });
          }
        }}
        tenantName={selectedLease ? getTenantName(selectedLease.tenantId) : ''}
      />
    </div>
  );
};

export default LeaseManagement;
