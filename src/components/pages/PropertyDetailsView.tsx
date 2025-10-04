import { useState, useEffect } from 'react';
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
import { ArrowLeft, Edit, Trash2, MapPin, Building, Home, Users, Calendar, DollarSign, FileText, TrendingUp, BarChart3, Download } from 'lucide-react';
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

const PropertyDetailsView = ({ property, onBack, onEdit, onDelete }: PropertyDetailsViewProps) => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeChartData, setIncomeChartData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);

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
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>{property.address}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <span>{property.type}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>Added: {new Date(property.createdAt).toLocaleDateString()}</span>
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

      {/* Recent Rent Payments */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Rent Payment History
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
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
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentPayments
                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                    .slice(0, 10)
                    .map((payment) => {
                      const tenant = tenants.find(t => t.id === payment.tenantId);
                      const isPartial = payment.status === 'Partial' || (payment.originalAmount && payment.originalAmount !== payment.amount);
                      
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
                            {new Date(payment.dueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            {payment.paidDate ? (
                              <div className="flex flex-col">
                                {new Date(payment.paidDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
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
              {rentPayments.length > 10 && (
                <div className="flex items-center justify-end border-t px-6 py-3">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                    View All Payments
                  </Button>
                </div>
              )}
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
