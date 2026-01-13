
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Calendar, DollarSign, CreditCard, AlertTriangle, Printer } from 'lucide-react';

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStatusEmoji = (status: string) => {
  switch(status.toLowerCase()) {
    case 'paid': return '✅';
    case 'unpaid': return '❌';
    case 'advance': return '⬆️';
    default: return '';
  }
};
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
  referenceNumber?: string;
  notes?: string;
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
  
  // Get tenant's properties through leases with enhanced type information
  const tenantProperties = tenantLeases.map(lease => {
    const property = properties.find(p => p.id === lease.propertyId);
    if (!property) return null;
    
    return {
      ...property,
      // Add lease-specific properties we need to access
      propertyName: property.name,
      propertyAddress: property.address,
      // Add lease details to the property for easy access
      leaseStart: lease.startDate,
      leaseEnd: lease.endDate,
      monthlyRent: lease.monthlyRent,
      securityDeposit: lease.securityDeposit,
      status: lease.status
    };
  }).filter(Boolean) as (Property & {
    propertyName: string;
    propertyAddress: string;
    leaseStart?: string;
    leaseEnd?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    status?: string;
  })[];

  // Get tenant's payments
  const tenantPayments = payments.filter(payment => payment.tenantId === tenant.id);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    // Get active lease
    const activeLease = tenantProperties[0] || {
      propertyName: 'N/A',
      propertyAddress: 'N/A',
      monthlyRent: 0
    };

    // Calculate totals
    const totalPaid = tenantPayments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
      
    const totalDues = tenantPayments
      .filter(p => p.status === 'Unpaid')
      .reduce((sum, p) => sum + p.amount, 0);

    // Sort payments by date (newest first)
    const recentPayments = [...tenantPayments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tenant Report - ${tenant.name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
          }
          h2 {
            margin-top: 20px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Tenant Report - ${tenant.name}</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        
        <h2>Tenant Information</h2>
        <table>
          <tr><td>Name</td><td>${tenant.name}</td></tr>
          <tr><td>Phone</td><td>${tenant.phone || 'N/A'}</td></tr>
          ${tenant.email ? `<tr><td>Email</td><td>${tenant.email}</td></tr>` : ''}
          ${tenant.emergencyContact?.name ? `<tr><td>Emergency Contact</td><td>${tenant.emergencyContact.name} (${tenant.emergencyContact.phone || 'N/A'})</td></tr>` : ''}
        </table>
        
        <h2>Property Details</h2>
        <table>
          <tr><td>Property</td><td>${activeLease.propertyName || 'N/A'}</td></tr>
          <tr><td>Address</td><td>${activeLease.propertyAddress || 'N/A'}</td></tr>
          <tr><td>Monthly Rent</td><td>₹${activeLease.monthlyRent?.toLocaleString('en-IN') || '0'}</td></tr>
        </table>
        
        <h2>Payment Summary</h2>
        <table>
          <tr><td>Total Paid</td><td>₹${totalPaid.toLocaleString('en-IN')}</td></tr>
          <tr><td>Total Dues</td><td>₹${totalDues.toLocaleString('en-IN')}</td></tr>
        </table>
        
        <h2>Payment History</h2>
        <table>
          <tr>
            <th>Date</th>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
          ${recentPayments.map(payment => `
            <tr>
              <td>${formatDate(payment.date)}</td>
              <td>${payment.month} ${payment.year}</td>
              <td>₹${payment.amount.toLocaleString('en-IN')}</td>
              <td>${getStatusEmoji(payment.status)} ${payment.status}</td>
            </tr>
          `).join('')}
        </table>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Calculate dues
  const unpaidPayments = tenantPayments.filter(payment => payment.status === 'Unpaid');
  const totalDues = unpaidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = tenantPayments.filter(payment => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0);

  // Get active lease from tenant properties with fallback
  const activeLease = tenantProperties[0] || {
    propertyName: 'N/A',
    propertyAddress: 'N/A',
    monthlyRent: 0,
    securityDeposit: 0,
    status: 'N/A',
    leaseStart: '',
    leaseEnd: ''
  };

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
                            <span>Lease: {formatDate(lease.startDate)} - {formatDate(lease.endDate)}</span>
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
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 gap-2"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenantPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...tenantPayments]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.month} {payment.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                                payment.status === 'Unpaid' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {payment.status === 'Paid' ? '✅' : payment.status === 'Unpaid' ? '❌' : '⬆️'} {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod ? (
                              <Badge variant="outline">{payment.paymentMethod}</Badge>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment Records</h3>
                <p className="text-gray-500">No payment history found for this tenant.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantReportView;
