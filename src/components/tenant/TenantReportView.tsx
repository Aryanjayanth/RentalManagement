
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Calendar, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';
import { Tenant, Property, Lease } from "./types";

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid' | 'Advance';
  month: string;
  year: number;
  paymentMethod?: string;
}

interface TenantReportViewProps {
  tenant: Tenant;
  onBack: () => void;
  properties: Property[];
  leases: Lease[];
  payments: Payment[];
}

const TenantReportView = ({ tenant, onBack, properties, leases, payments }: TenantReportViewProps) => {
  // Get tenant's leases
  const tenantLeases = leases.filter(lease => lease.tenantId === tenant.id);
  
  // Get tenant's properties through leases
  const tenantProperties = tenantLeases.map(lease => 
    properties.find(property => property.id === lease.propertyId)
  ).filter(Boolean) as Property[];

  // Get tenant's payments
  const tenantPayments = payments.filter(payment => payment.tenantId === tenant.id);
  
  // Calculate dues
  const unpaidPayments = tenantPayments.filter(payment => payment.status === 'Unpaid');
  const totalDues = unpaidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = tenantPayments.filter(payment => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);

  // Get active lease (fallback if status doesn't exist)
  const activeLease = tenantLeases.find(lease => lease.status === 'Active') || tenantLeases[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{tenant.name} - Tenant Report</h1>
            <p className="text-gray-600">Complete overview of tenant details and payment history</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Outstanding Dues</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalDues.toLocaleString()}</div>
              <p className="text-gray-600 text-sm">{unpaidPayments.length} unpaid bills</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CreditCard className="h-5 w-5" />
                <span>Total Paid</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
              <p className="text-gray-600 text-sm">Lifetime payments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-blue-600">
                <Home className="h-5 w-5" />
                <span>Properties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{tenantProperties.length}</div>
              <p className="text-gray-600 text-sm">Associated properties</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 w-24">Name:</span>
                  <span className="font-medium">{tenant.name}</span>
                </div>
                {tenant.email && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span className="font-medium">{tenant.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 w-24">Phone:</span>
                  <span className="font-medium">{tenant.phone}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 w-32">Emergency Contact:</span>
                  <span className="font-medium">
                    {tenant.emergencyContact ? 
                      `${tenant.emergencyContact.name} (${tenant.emergencyContact.phone}) - ${tenant.emergencyContact.relationship}` : 
                      'Not provided'
                    }
                  </span>
                </div>
                {activeLease?.monthlyRent && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500 w-32">Monthly Rent:</span>
                    <span className="font-medium text-green-600">₹{activeLease.monthlyRent.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Associated Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {tenantProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenantProperties.map((property) => {
                  const lease = tenantLeases.find(l => l.propertyId === property.id);
                  return (
                    <div key={property.id} className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-lg">{property.name}</h4>
                      {property.address && (
                        <p className="text-gray-600 text-sm">{property.address}</p>
                      )}
                      {lease && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Lease: {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</span>
                          </div>
                          <Badge variant={lease.status === 'Active' ? 'default' : 'secondary'}>
                            {lease.status || 'Unknown'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No properties assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {tenantPayments.length > 0 ? (
              <div className="space-y-3">
                {tenantPayments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{payment.month} {payment.year}</span>
                          <Badge 
                            variant={payment.status === 'Paid' ? 'default' : payment.status === 'Unpaid' ? 'destructive' : 'secondary'}
                          >
                            {payment.status === 'Paid' ? '✅' : payment.status === 'Unpaid' ? '❌' : '⬆️'} {payment.status}
                          </Badge>
                          {payment.paymentMethod && (
                            <Badge variant="outline">{payment.paymentMethod}</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${payment.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{payment.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">No payment records found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantReportView;
