import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Edit, Trash2, MapPin, Building, Home, Users, User, Calendar, DollarSign, FileText, TrendingUp, BarChart3, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getVacantUnits, getOccupiedUnits } from '../property/getVacantUnits';

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
  owner?: string;
  createdAt: string;
}

interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  units?: number;
  status?: string;
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  propertyIds: string[];
}

interface RentPayment {
  id: string;
  leaseId: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  month: string;
  year: number;
  paymentMethod?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Check';
  originalAmount?: number;
  remainingDue?: number;
}

interface PropertyDetailsViewProps {
  property: Property;
  onBack: () => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const getMonthNumber = (monthName: string) => {
  const months: {[key: string]: number} = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };
  return months[monthName.toLowerCase()] || 0;
};

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? 'N/A' 
      : date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
  } catch (error) {
    return 'N/A';
  }
};

const PropertyDetailsView = ({ property, onBack, onEdit, onDelete }: PropertyDetailsViewProps) => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeChartData, setIncomeChartData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  const [sortBy, setSortBy] = useState<'tenant' | 'period'>('period');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const vacantUnits = getVacantUnits(property);
  const occupiedUnits = getOccupiedUnits(property);
  
  // Calculate the actual status based on occupied units
  const actualStatus = 
    occupiedUnits === 0 ? 'Vacant' :
    occupiedUnits >= (property.totalFlats || 0) ? 'Fully Occupied' :
    'Partially Occupied';
  
  // Create a new property object with the calculated status
  const propertyWithStatus = {
    ...property,
    status: actualStatus as 'Fully Occupied' | 'Partially Occupied' | 'Vacant'
  };

  useEffect(() => {
    // Load leases for this property
    const savedLeases = localStorage.getItem('rental_leases');
    const propertyLeases: Lease[] = [];
    
    if (savedLeases) {
      const allLeases = JSON.parse(savedLeases);
      const filteredLeases = allLeases.filter((lease: Lease) => lease.propertyId === property.id);
      propertyLeases.push(...filteredLeases);
      setLeases(filteredLeases);
    }

    // Load tenants
    const savedTenants = localStorage.getItem('rental_tenants');
    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    }

    // Load rent payments for this property
    const savedPayments = localStorage.getItem('rental_payments');
    if (savedPayments) {
      const allPayments = JSON.parse(savedPayments);
      const propertyPayments = allPayments.filter((payment: RentPayment) => payment.propertyId === property.id);
      setRentPayments(propertyPayments);

      // Calculate total income (all paid payments)
      const totalPaid = propertyPayments
        .filter((payment: RentPayment) => payment.status === 'Paid')
        .reduce((sum: number, payment: RentPayment) => sum + payment.amount, 0);
      setTotalIncome(totalPaid);

      // Calculate monthly income (current month's rent from active leases)
      const currentDate = new Date();
      
      const monthlyRent = propertyLeases
        .filter((lease: Lease) => 
          !lease.status || lease.status === 'Active' &&
          new Date(lease.endDate) >= currentDate
        )
        .reduce((sum: number, lease: Lease) => sum + (lease.monthlyRent || 0), 0);
      setMonthlyIncome(monthlyRent);

      // Prepare income chart data (last 6 months)
      const incomeByMonth: { [key: string]: number } = {};
      propertyPayments
        .filter((payment: RentPayment) => payment.status === 'Paid')
        .forEach((payment: RentPayment) => {
          const key = `${payment.month} ${payment.year}`;
          incomeByMonth[key] = (incomeByMonth[key] || 0) + payment.amount;
        });

      const chartData = Object.entries(incomeByMonth)
        .map(([month, amount]) => ({ month, amount }))
        .slice(-6);
      setIncomeChartData(chartData);

      // Prepare occupancy data
      const occupancyStats = [
        { name: 'Occupied', value: occupiedUnits, color: '#22c55e' },
        { name: 'Vacant', value: vacantUnits, color: '#ef4444' }
      ];
      setOccupancyData(occupancyStats);
    }
  }, [property.id, occupiedUnits, vacantUnits]);

  const handleEdit = () => {
    onEdit(property);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      onDelete(property.id);
      onBack();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fully Occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'Partially Occupied': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Vacant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPropertyTenants = () => {
    const propertyTenantIds = leases.map(lease => lease.tenantId);
    return tenants.filter(tenant => propertyTenantIds.includes(tenant.id));
  };

  const sortedAndFilteredPayments = useMemo(() => {
    return [...rentPayments]
      .filter(payment => {
        if (paymentFilter === 'all') return true;
        if (paymentFilter === 'unpaid') {
          return payment.status !== 'Paid' && payment.status !== 'Partial';
        }
        // For 'paid' and 'partial' filters, ensure case-insensitive comparison
        return payment.status.toLowerCase() === paymentFilter.toLowerCase();
      })
      .sort((a, b) => {
        if (sortBy === 'tenant') {
          const tenantA = tenants.find(t => t.id === a.tenantId)?.name || '';
          const tenantB = tenants.find(t => t.id === b.tenantId)?.name || '';
          return sortOrder === 'asc' 
            ? tenantA.localeCompare(tenantB)
            : tenantB.localeCompare(tenantA);
        } else { // sort by period
          const dateA = new Date(Number(a.year), getMonthNumber(a.month));
          const dateB = new Date(Number(b.year), getMonthNumber(b.month));
          return sortOrder === 'asc' 
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }
      });
  }, [rentPayments, paymentFilter, sortBy, sortOrder, tenants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{property.name}</h2>
            <p className="text-gray-600">{property.address}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleEdit} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleDelete} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>


      {/* Property Image */}
      {property.image && (
        <Card>
          <CardContent className="p-6">
            <img 
              src={property.image} 
              alt={property.name}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Units</p>
                <p className="text-3xl font-bold text-blue-600">{property.totalFlats}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupied</p>
                <p className="text-3xl font-bold text-green-600">{occupiedUnits}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Vacant</p>
                <p className="text-3xl font-bold text-yellow-600">{vacantUnits}</p>
              </div>
              <Home className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Income</p>
                <p className="text-3xl font-bold text-purple-600">₹{monthlyIncome.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Income Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Income']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Occupancy Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Income (All Time)</span>
              <span className="font-bold text-green-600">₹{totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Monthly Rent Potential</span>
              <span className="font-bold text-blue-600">₹{monthlyIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Occupancy Rate</span>
              <span className="font-bold text-purple-600">
                {property.totalFlats > 0 ? Math.round((occupiedUnits / property.totalFlats) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Average Rent per Unit</span>
              <span className="font-bold text-indigo-600">
                ₹{occupiedUnits > 0 ? Math.round(monthlyIncome / occupiedUnits).toLocaleString() : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {property.owner && (
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <span>Owner: {property.owner}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>{property.address}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <span>{property.type}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(propertyWithStatus.status)}>
              {propertyWithStatus.status} ({occupiedUnits}/{property.totalFlats || 0} units)
            </Badge>
            </div>
            {property.description && (
              <div className="pt-4">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{property.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Current Tenants ({getPropertyTenants().length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getPropertyTenants().length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Lease End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPropertyTenants().map((tenant) => {
                  const tenantLease = leases.find(lease => lease.tenantId === tenant.id);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.phone}</TableCell>
                      <TableCell>{tenant.email || 'N/A'}</TableCell>
                      <TableCell>{tenantLease?.units || 1}</TableCell>
                      <TableCell>${tenantLease?.monthlyRent?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>
                        {tenantLease?.endDate ? new Date(tenantLease.endDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tenants currently assigned to this property
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rent Payment History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Rent Payment History
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Select 
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as 'all' | 'paid' | 'unpaid' | 'partial')}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={sortBy}
                  onValueChange={(value: 'tenant' | 'period') => {
                    if (value === sortBy) {
                      // Toggle sort order if same sort option is selected
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      // Set new sort option with default order
                      setSortBy(value);
                      setSortOrder(value === 'period' ? 'desc' : 'asc');
                    }
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="period">
                      {sortBy === 'period' ? (sortOrder === 'asc' ? '↑ ' : '↓ ') : ''}Period
                    </SelectItem>
                    <SelectItem value="tenant">
                      {sortBy === 'tenant' ? (sortOrder === 'asc' ? '↑ ' : '↓ ') : ''}Tenant
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    // Get the current filtered and sorted payments
                    const filteredPayments = [...rentPayments]
                      .filter(payment => {
                        if (paymentFilter === 'all') return true;
                        if (paymentFilter === 'unpaid') {
                          return payment.status !== 'Paid' && payment.status !== 'Partial';
                        }
                        return payment.status.toLowerCase() === paymentFilter.toLowerCase();
                      })
                      .sort((a, b) => {
                        if (sortBy === 'tenant') {
                          const tenantA = tenants.find(t => t.id === a.tenantId)?.name || '';
                          const tenantB = tenants.find(t => t.id === b.tenantId)?.name || '';
                          return sortOrder === 'asc' 
                            ? tenantA.localeCompare(tenantB)
                            : tenantB.localeCompare(tenantA);
                        } else {
                          const dateA = new Date(Number(a.year), getMonthNumber(a.month));
                          const dateB = new Date(Number(b.year), getMonthNumber(b.month));
                          return sortOrder === 'asc' 
                            ? dateA.getTime() - dateB.getTime()
                            : dateB.getTime() - dateA.getTime();
                        }
                      });

                    const printDate = new Date().toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric'
                    });

                    const printContent = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Payment History - ${property.name}</title>
                          <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .header { text-align: center; margin-bottom: 15px; }
                            .property-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                            .payment-history-header { 
                              text-align: center; 
                              margin: 20px 0;
                              font-size: 18px;
                              font-weight: 600;
                            }
                            .print-date { text-align: right; margin: 10px 0; color: #666; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            th { text-align: left; background: #f5f5f5; padding: 8px; border: 1px solid #ddd; }
                            td { padding: 8px; border: 1px solid #ddd; }
                            .status { padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block; }
                            .status-Paid { background: #dcfce7; color: #166534; }
                            .status-Pending { background: #fef9c3; color: #854d0e; }
                            .status-Overdue { background: #fee2e2; color: #991b1b; }
                            .status-Partial { background: #fef3c7; color: #92400e; }
                            .status-Unpaid { background: #f3f4f6; color: #4b5563; }
                            .amount { white-space: nowrap; }
                            .original-amount { text-decoration: line-through; color: #6b7280; font-size: 0.9em; display: block; }
                            .remaining-due { color: #dc2626; font-size: 0.9em; display: block; }
                            .payment-method { color: #4b5563; font-size: 0.9em; display: block; }
                            .footer {
                              margin-top: 40px;
                              text-align: right;
                              padding-top: 20px;
                              border-top: 1px solid #eee;
                            }
                            .owned-by {
                              font-weight: 600;
                              color: #444;
                              font-size: 15px;
                            }
                            @media print {
                              @page { size: auto; margin: 1cm; }
                              .no-print { display: none !important; }
                              .footer {
                                position: fixed;
                                bottom: 20px;
                                right: 20px;
                                border: none;
                              }
                            }
                            h3 { 
                              margin: 15px 0 5px 0; 
                              font-size: 18px;
                              font-weight: 600;
                              text-align: left;
                              border-bottom: 2px solid #eee;
                              padding-bottom: 5px;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div class="property-name">S.N.B Residency</div>
                            <div>Old Royal School Building, Near Radham Centre</div>
                          </div>
                          <div class="payment-history-header">
                            PAYMENT HISTORY, ${printDate}
                          </div>
                          <div class="footer">
                            <div class="owned-by">Owned By: ${property.owner || 'S.N.B Residency'}</div>
                          </div>
                          ${filteredPayments.length > 0 ? `
                            <table>
                              <thead>
                                <tr>
                                  <th>Tenant</th>
                                  <th>Period</th>
                                  <th>Amount</th>
                                  <th>Paid On</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${filteredPayments.map(payment => {
                                  const tenant = tenants.find(t => t.id === payment.tenantId);
                                  const isPartial = payment.status === 'Partial' || 
                                                  (payment.originalAmount && payment.originalAmount !== payment.amount);
                                  const lease = leases.find(l => l.id === payment.leaseId);
                                  const dueDate = payment.dueDate || lease?.startDate;
                                  
                                  return `
                                    <tr>
                                      <td>${tenant?.name || 'Unknown Tenant'}</td>
                                      <td>${payment.month} ${payment.year}</td>
                                      <td class="amount">
                                        ${isPartial && payment.originalAmount ? `
                                          <div>₹${payment.amount.toLocaleString()}</div>
                                          <span class="original-amount">Original: ₹${payment.originalAmount.toLocaleString()}</span>
                                          ${payment.remainingDue ? `
                                            <span class="remaining-due">Remaining: ₹${payment.remainingDue.toLocaleString()}</span>
                                          ` : ''}
                                        ` : `₹${payment.amount.toLocaleString()}`}
                                      </td>
                                      <td>
                                        ${payment.paidDate ? `
                                          <div>${formatDate(payment.paidDate)}</div>
                                          ${payment.paymentMethod ? `
                                            <span class="payment-method">via ${payment.paymentMethod}</span>
                                          ` : ''}
                                        ` : 'N/A'}
                                      </td>
                                      <td>
                                        <span class="status status-${payment.status}">
                                          ${payment.status}
                                        </span>
                                      </td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                          ` : `
                            <p>No payment records found for the selected filter.</p>
                          `}
                          <div class="no-print" style="margin-top: 20px; text-align: center; padding: 10px; border-top: 1px solid #eee;">
                            <button onclick="window.print()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                              Print
                            </button>
                            <button onclick="window.close()" style="margin-left: 10px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                              Close
                            </button>
                          </div>
                        </body>
                      </html>
                    `;
                    
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.onload = () => {
                      // Auto-print is blocked by most browsers, so we'll just focus the window
                      printWindow.focus();
                    };
                  }
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rentPayments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredPayments.map((payment) => {
                      const tenant = tenants.find(t => t.id === payment.tenantId);
                      const isPartial = payment.status === 'Partial' || 
                                     (payment.originalAmount && payment.originalAmount !== payment.amount);
                      // Get the lease to find the due date if not set on payment
                      const lease = leases.find(l => l.id === payment.leaseId);
                      const dueDate = payment.dueDate || lease?.startDate;
                      
                      return (
                        <TableRow key={payment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {tenant?.name || 'Unknown Tenant'}
                          </TableCell>
                          <TableCell>
                            {payment.month} {payment.year}
                          </TableCell>
                          <TableCell>
                            {isPartial ? (
                              <div className="flex flex-col">
                                {payment.originalAmount && (
                                  <span className="line-through text-gray-500 text-sm">
                                    ₹{payment.originalAmount.toLocaleString()}
                                  </span>
                                )}
                                <span>₹{payment.amount.toLocaleString()}</span>
                                {payment.remainingDue ? (
                                  <span className="text-xs text-red-600">
                                    Remaining: ₹{payment.remainingDue.toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              `₹${payment.amount.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.paidDate ? (
                              <div className="flex flex-col">
                                {formatDate(payment.paidDate)}
                                {payment.paymentMethod && (
                                  <span className="text-xs text-gray-500">
                                    via {payment.paymentMethod}
                                  </span>
                                )}
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === 'Paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : payment.status === 'Partial' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : payment.status === 'Overdue' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No payment records found</h3>
              <p className="text-gray-500">Rent payment history will appear here when available</p>
              <Button className="mt-4" variant="outline">
                Record Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetailsView;
