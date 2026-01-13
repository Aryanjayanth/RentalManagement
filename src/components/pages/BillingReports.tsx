import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar,
  AreaChart,
  Area
} from 'recharts';

import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building, 
  FileText, 
  Download as DownloadIcon,
  AlertCircle, 
  CheckCircle, 
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  FileDown,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Tenant, Property, Lease } from '../tenant/types';

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

    interface Expense {
    id: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    propertyId?: string;
    }

    interface BillingReportsProps {
    user?: { role?: string };
    }

const BillingReports = ({ user }: BillingReportsProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedProperty, setSelectedProperty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  
  // Available years for filter (current year and past 4 years)
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  
  // Available months for filter
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

    useEffect(() => {
        const savedPayments = localStorage.getItem('rental_payments');
        const savedExpenses = localStorage.getItem('rental_expenses');
        const savedTenants = localStorage.getItem('rental_tenants');
        const savedProperties = localStorage.getItem('rental_properties');
        const savedLeases = localStorage.getItem('rental_leases');
        
        if (savedPayments) setPayments(JSON.parse(savedPayments));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedTenants) setTenants(JSON.parse(savedTenants));
        if (savedProperties) setProperties(JSON.parse(savedProperties));
        if (savedLeases) setLeases(JSON.parse(savedLeases));
    }, []);

    // Get tenant name
    const getTenantName = (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        return tenant ? tenant.name : 'Unknown Tenant';
    };

    // Get property name
    const getPropertyName = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        return property ? property.name : 'Unknown Property';
    };

    // Get lease for tenant
    const getTenantLease = (tenantId: string) => {
        return leases.find(l => l.tenantId === tenantId);
    };

    // Filter data based on selections
    const filteredPayments = payments.filter(payment => {
        const yearMatch = payment.year.toString() === selectedYear;
        const monthMatch = selectedMonth === 'All' || payment.month === selectedMonth;
        const propertyMatch = selectedProperty === 'All' || getTenantLease(payment.tenantId)?.propertyId === selectedProperty;
        return yearMatch && monthMatch && propertyMatch;
    });

    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const yearMatch = expenseDate.getFullYear().toString() === selectedYear;
        const monthMatch = selectedMonth === 'All' || expenseDate.toLocaleString('en-US', { month: 'long' }) === selectedMonth;
        const propertyMatch = selectedProperty === 'All' || expense.propertyId === selectedProperty;
        return yearMatch && monthMatch && propertyMatch;
    });

    // Calculate metrics
    const totalIncome = filteredPayments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalOverdue = filteredPayments
        .filter(p => p.status === 'Unpaid')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = filteredExpenses
        .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = totalIncome - totalExpenses;

    const collectionRate = filteredPayments.length > 0 ? 
        (filteredPayments.filter(p => p.status === 'Paid').length / filteredPayments.length) * 100 : 0;

    const occupancyRate = properties.length > 0 ? 
        (properties.reduce((sum, p) => sum + p.occupiedFlats, 0) / 
        properties.reduce((sum, p) => sum + p.totalFlats, 0)) * 100 : 0;

    // Monthly data for charts
    const getMonthlyData = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = parseInt(selectedYear);
        
        return monthNames.map((month) => {
        const monthPayments = payments.filter(p => 
            p.status === 'Paid' && 
            p.year === currentYear && 
            p.month === month
        );
        const monthExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === currentYear && 
                expenseDate.toLocaleString('en-US', { month: 'long' }) === month;
        });
        
        return {
            month,
            income: monthPayments.reduce((sum, p) => sum + p.amount, 0),
            expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
            net: monthPayments.reduce((sum, p) => sum + p.amount, 0) - 
                monthExpenses.reduce((sum, e) => sum + e.amount, 0)
        };
        });
    };


    // Export functions
    const exportDetailedReport = () => {
        const reportData = {
        period: selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`,
        generated: new Date().toLocaleString(),
        summary: {
            totalIncome,
            totalExpenses,
            netIncome,
            totalOverdue,
            collectionRate: collectionRate.toFixed(1),
            occupancyRate: occupancyRate.toFixed(1)
        },
        payments: filteredPayments.map(p => ({
            tenant: getTenantName(p.tenantId),
            property: getPropertyName(getTenantLease(p.tenantId)?.propertyId || ''),
            amount: p.amount,
            status: p.status,
            date: p.date,
            month: p.month,
            year: p.year,
            method: p.paymentMethod || 'N/A'
        })),
        expenses: filteredExpenses.map(e => ({
            amount: e.amount,
            category: e.category,
            description: e.description,
            property: getPropertyName(e.propertyId || ''),
            date: e.date
        }))
        };

        const csvContent = [
        'RENTAL MANAGEMENT DETAILED REPORT',
        `Period: ${reportData.period}`,
        `Generated: ${reportData.generated}`,
        '',
        'SUMMARY',
        'Total Income,₹' + reportData.summary.totalIncome.toLocaleString(),
        'Total Expenses,₹' + reportData.summary.totalExpenses.toLocaleString(),
        'Net Income,₹' + reportData.summary.netIncome.toLocaleString(),
        'Total Overdue,₹' + reportData.summary.totalOverdue.toLocaleString(),
        'Collection Rate,' + reportData.summary.collectionRate + '%',
        'Occupancy Rate,' + reportData.summary.occupancyRate + '%',
        '',
        'PAYMENTS',
        'Tenant,Property,Amount,Status,Date,Month,Year,Method',
        ...reportData.payments.map(p => 
            `"${p.tenant}","${p.property}","₹${p.amount.toLocaleString()}","${p.status}","${p.date}","${p.month} ${p.year}","${p.method}"`
        ),
        '',
        'EXPENSES',
        'Amount,Category,Description,Property,Date',
        ...reportData.expenses.map(e => 
            `"₹${e.amount.toLocaleString()}","${e.category}","${e.description}","${e.property}","${e.date}"`
        )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detailed-report-${selectedYear}-${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const monthList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const yearList = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const expenseCategories = ['Maintenance', 'Repairs', 'Utilities', 'Insurance', 'Taxes', 'Supplies', 'Other'];

    const showFinance = user?.role !== 'Staff';

    return (
        <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-3 h-8 w-8 text-blue-600" />
                Billing & Reports
            </h1>
            <p className="text-gray-600 mt-1">Financial insights and reporting dashboard</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportDetailedReport} variant="outline" className="hover:bg-blue-50">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                <Label className="text-sm font-medium mb-2">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {yearList.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                
                <div>
                <Label className="text-sm font-medium mb-2">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">📅 All Months</SelectItem>
                    {monthList.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                
                <div>
                <Label className="text-sm font-medium mb-2">Property</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">🏠 All Properties</SelectItem>
                    {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                
                <div className="flex items-end">
                <div className="text-sm text-gray-500">
                    <div className="font-medium">Period:</div>
                    <div className="font-bold text-gray-900">
                    {selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}
                    </div>
                </div>
                </div>
            </div>
            </CardContent>
        </Card>

        {/* Summary Cards */}
        {showFinance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-6 w-6" />
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <TrendingDown className="h-6 w-6" />
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">Net Income</p>
                    <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{netIncome.toLocaleString()}
                    </p>
                    </div>
                    <div className={`p-3 rounded-full ${netIncome >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    <DollarSign className="h-6 w-6" />
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{collectionRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <CheckCircle className="h-6 w-6" />
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                    <p className="text-3xl font-bold text-amber-600">{occupancyRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                    <Building className="h-6 w-6" />
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Income vs Expenses */}
            <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`]} />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            </CardContent>
            </Card>

            {/* Payment Status Distribution */}
            <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={[
                        { name: 'Paid', value: filteredPayments.filter(p => p.status === 'Paid').length, color: '#10B981' },
                        { name: 'Unpaid', value: filteredPayments.filter(p => p.status === 'Unpaid').length, color: '#EF4444' },
                        { name: 'Advance', value: filteredPayments.filter(p => p.status === 'Advance').length, color: '#3B82F6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                        {filteredPayments.filter(p => p.status === 'Paid').length > 0 && <Cell fill="#10B981" />}
                        {filteredPayments.filter(p => p.status === 'Unpaid').length > 0 && <Cell fill="#EF4444" />}
                        {filteredPayments.filter(p => p.status === 'Advance').length > 0 && <Cell fill="#3B82F6" />}
                    </Pie>
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </CardContent>
            </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPayments.length > 0 ? (
                filteredPayments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                        <p className="font-semibold text-gray-900">{getTenantName(payment.tenantId)}</p>
                        <p className="text-sm text-gray-600">{getPropertyName(getTenantLease(payment.tenantId)?.propertyId || '')}</p>
                        <p className="text-sm text-gray-500">{payment.month} {payment.year}</p>
                        </div>
                        <div className="text-right">
                        <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                        <Badge className={
                            payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'Unpaid' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                        }>
                            {payment.status}
                        </Badge>
                        </div>
                    </div>
                    ))
                ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">💰</div>
                    <p className="text-gray-500 font-medium">No transactions found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
                )}
            </div>
            </CardContent>
        </Card>
        </div>
    );
    };

    export default BillingReports;
