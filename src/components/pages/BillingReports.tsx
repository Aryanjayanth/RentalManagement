import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tenant, Property } from '../tenant/types';

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid';
  month: string;
  year: number;
}

interface BillingReportsProps {
  user?: { role?: string }; // Add user prop
}

const BillingReports = ({ user }: BillingReportsProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('All');
  // ↓ Add state for overall record download dialog
  const [isOverallDialogOpen, setIsOverallDialogOpen] = useState(false);
  const [recordYear, setRecordYear] = useState(new Date().getFullYear().toString());
  const [recordMonth, setRecordMonth] = useState(
    ["January","February","March","April","May","June","July","August","September","October","November","December"][new Date().getMonth()]
  );
  const [monthlyIncomeData, setMonthlyIncomeData] = useState([
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    { month: 'Jun', income: 0, expenses: 0 }
  ]);

  useEffect(() => {
    const savedPayments = localStorage.getItem('rental_payments');
    const savedTenants = localStorage.getItem('rental_tenants');
    const savedProperties = localStorage.getItem('rental_properties');
    
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedTenants) setTenants(JSON.parse(savedTenants));
    if (savedProperties) setProperties(JSON.parse(savedProperties));
  }, []);

  useEffect(() => {
    // Load data for chart from localStorage as in previous Dashboard
    const payments = JSON.parse(localStorage.getItem('rental_payments') || '[]');
    const expenses = JSON.parse(localStorage.getItem('rental_expenses') || '[]');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const newMonthlyData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: monthNames[d.getMonth()],
        income: 0,
        expenses: 0,
      };
    });

    payments.forEach((p: any) => {
      if (!p.date || p.status !== 'Paid') return;
      const paymentDate = new Date(p.date);
      const monthDiff = (new Date().getFullYear() - paymentDate.getFullYear()) * 12 + (new Date().getMonth() - paymentDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        newMonthlyData[5 - monthDiff].income += p.amount;
      }
    });

    expenses.forEach((e: any) => {
      if (!e.date) return;
      const expenseDate = new Date(e.date);
      const monthDiff = (new Date().getFullYear() - expenseDate.getFullYear()) * 12 + (new Date().getMonth() - expenseDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 6) {
        newMonthlyData[5 - monthDiff].expenses += e.amount;
      }
    });

    setMonthlyIncomeData(newMonthlyData);
  }, []);

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getPropertyName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return 'Unknown Property';
    const property = properties.find(p => p.id === tenant.propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const filteredPayments = payments.filter(payment => {
    const yearMatch = payment.year.toString() === selectedYear;
    const monthMatch = selectedMonth === 'All' || payment.month === selectedMonth;
    return yearMatch && monthMatch;
  });

  const totalIncome = filteredPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = filteredPayments
    .filter(p => p.status === 'Unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueList = filteredPayments.filter(p => p.status === 'Unpaid');
  const vacantProperties = properties.filter(p => p.status === 'Vacant');

  const collectionRate = filteredPayments.length > 0 ? 
    (filteredPayments.filter(p => p.status === 'Paid').length / filteredPayments.length) * 100 : 0;

  const exportToPDF = () => {
    const reportData = {
      period: selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`,
      totalIncome,
      totalOverdue,
      overdueCount: overdueList.length,
      vacantCount: vacantProperties.length,
      overdueList: overdueList.map(p => ({
        tenant: getTenantName(p.tenantId),
        property: getPropertyName(p.tenantId),
        amount: p.amount,
        month: `${p.month} ${p.year}`
      }))
    };

    const content = `
RENTAL MANAGEMENT COMPREHENSIVE REPORT
Period: ${reportData.period}
Generated: ${new Date().toLocaleDateString('en-IN')}

=================================
FINANCIAL SUMMARY
=================================
Total Income (Paid): ₹${reportData.totalIncome.toLocaleString()}
Total Overdue: ₹${reportData.totalOverdue.toLocaleString()}
Collection Rate: ${collectionRate.toFixed(1)}%

=================================
OVERDUE PAYMENTS (${reportData.overdueCount})
=================================
${reportData.overdueList.map(item => 
  `${item.tenant} - ${item.property} - ₹${item.amount.toLocaleString()} (${item.month})`
).join('\n')}

=================================
VACANT PROPERTIES (${reportData.vacantCount})
=================================
${vacantProperties.map(item => 
  `${item.name} - Status: ${item.status}`
).join('\n')}

=================================
END OF REPORT
=================================
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental-report-${reportData.period.replace(' ', '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const csvContent = [
      'Rental Management Report',
      `Period: ${selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}`,
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'FINANCIAL SUMMARY',
      `Total Income,₹${totalIncome.toLocaleString()}`,
      `Total Overdue,₹${totalOverdue.toLocaleString()}`,
      `Collection Rate,${collectionRate.toFixed(1)}%`,
      '',
      'OVERDUE PAYMENTS',
      'Tenant,Property,Amount,Period',
      ...overdueList.map(p => 
        `${getTenantName(p.tenantId)},${getPropertyName(p.tenantId)},₹${p.amount.toLocaleString()},${p.month} ${p.year}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental-report-${selectedMonth === 'All' ? selectedYear : `${selectedMonth}-${selectedYear}`}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2024', '2023', '2022', '2021'];

  // --- Compute vacant units and provide breakdown list ---
  const vacantUnits = properties.reduce(
    (sum, p) => sum + (p.totalFlats - p.occupiedFlats), 0
  );
  const propertyUnitsList = properties.map((p) => ({
    propertyName: p.name,
    vacant: p.totalFlats - p.occupiedFlats,
    total: p.totalFlats,
  }));

  const showFinance = user?.role !== 'Staff';

  // Add: Download overall record function
  const exportOverallRecord = () => {
    // Step 1: collect data for desired month/year
    // Use the month and year selected in the dialog
    const reportMonth = recordMonth; // e.g. "June"
    const reportYearNum = parseInt(recordYear);

    // Build list: property name, tenant name, phone, paid status
    // For each tenant, find payment for month/year
    const tenantRows = tenants.map(tenant => {
      const property = properties.find(p => p.id === tenant.propertyId);
      const paidForMonth = payments.some(p =>
        p.tenantId === tenant.id &&
        p.month === reportMonth &&
        p.year === reportYearNum &&
        p.status === "Paid"
      );
      return [
        property ? property.name : "Unknown Property",
        tenant.name,
        tenant.phone || "",
        paidForMonth ? "✔" : "✗"
      ];
    });

    // Build CSV
    const csvRows = [
      ["Property","Tenant","Phone","Paid for " + reportMonth + " " + recordYear].join(","),
      ...tenantRows.map(r =>
        // Ensure proper escaping
        r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
      )
    ];
    const csvContent = csvRows.join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const reportSuffix = `${reportMonth}-${recordYear}`;
    a.href = url;
    a.download = `overall-record-${reportSuffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsOverallDialogOpen(false);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-10"></div>
        <div className="relative p-8 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Billing & Reports
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive financial analysis and reporting</p>
            </div>
            <div className="flex space-x-3">
              {/* Add: Download overall record button */}
              <Button
                variant="outline"
                size="lg"
                className="hover:bg-green-50"
                onClick={() => setIsOverallDialogOpen(true)}
              >
                🗂️ Download Overall Record
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="lg" className="hover:bg-purple-50">
                📄 Export PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="lg" className="hover:bg-blue-50">
                📊 Export Excel
              </Button>
            </div>
          </div>
        </div>
        {/* Add dialog for record download */}
        {isOverallDialogOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-sm rounded-lg shadow-lg space-y-4">
              <div className="font-bold text-lg mb-2">Download Overall Record</div>
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={recordMonth}
                  onChange={e => setRecordMonth(e.target.value)}
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={recordYear}
                  onChange={e => setRecordYear(e.target.value)}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={exportOverallRecord} className="flex-1">
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOverallDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Report Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Report Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">📅 All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto">
              <div className="text-right">
                <div className="text-sm text-gray-500">Report Period</div>
                <div className="text-lg font-bold text-gray-900">
                  {selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      {showFinance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Income, Overdue, Advance, Collection Rate */}
          <Card className="border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-green-500 mt-1">+12% from last period</p>
                </div>
                <div className="p-4 rounded-full bg-green-100 text-green-600 text-2xl">
                  💰
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Overdue</p>
                  <p className="text-3xl font-bold text-red-600">₹{totalOverdue.toLocaleString()}</p>
                  <p className="text-xs text-red-500 mt-1">{overdueList.length} pending payments</p>
                </div>
                <div className="p-4 rounded-full bg-red-100 text-red-600 text-2xl">
                  ⚠️
                </div>
              </div>
            </CardContent>
          </Card>



          <Card className="border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{collectionRate.toFixed(1)}%</p>
                  <p className="text-xs text-purple-500 mt-1">Payment efficiency</p>
                </div>
                <div className="p-4 rounded-full bg-purple-100 text-purple-600 text-2xl">
                  📊
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder Card - Fills empty grid space */}
          <Card className="border-0 shadow-lg relative overflow-hidden opacity-75">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-amber-600">{properties.length}</p>
                  <p className="text-xs text-amber-500 mt-1">Managed properties</p>
                </div>
                <div className="p-4 rounded-full bg-amber-100 text-amber-600 text-2xl">
                  🏠
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collection Rate Progress */}
      {showFinance && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Payment Collection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Collection Efficiency</span>
                <span className="text-2xl font-bold text-purple-600">{collectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={collectionRate} className="h-4" />
              <div className="grid grid-cols-3 gap-4 text-center mt-6">
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{filteredPayments.filter(p => p.status === 'Paid').length}</div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{filteredPayments.filter(p => p.status === 'Unpaid').length}</div>
                  <div className="text-sm text-gray-600">Unpaid</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">{tenants.length}</div>
                  <div className="text-sm text-gray-600">Total Tenants</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Payments */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
              Overdue Payments ({overdueList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueList.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {overdueList.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-all">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{getTenantName(payment.tenantId)}</p>
                      <p className="text-sm text-gray-600">{getPropertyName(payment.tenantId)}</p>
                      <p className="text-sm text-gray-600">{payment.month} {payment.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-lg">₹{payment.amount.toLocaleString()}</p>
                      <Badge className="bg-red-500 text-white text-xs">OVERDUE</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-500 font-medium">No overdue payments!</p>
                <p className="text-sm text-gray-400">All tenants are up to date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart - Enhanced */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Payment Distribution
              <span className="ml-auto text-sm font-normal text-gray-500">
                {filteredPayments.length} total payments
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <defs>
                    <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="unpaidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { 
                        name: 'Paid', 
                        value: filteredPayments.filter(p => p.status === 'Paid').length,
                        amount: filteredPayments
                          .filter(p => p.status === 'Paid')
                          .reduce((sum, p) => sum + p.amount, 0)
                      },
                      { 
                        name: 'Unpaid', 
                        value: filteredPayments.filter(p => p.status === 'Unpaid').length,
                        amount: filteredPayments
                          .filter(p => p.status === 'Unpaid')
                          .reduce((sum, p) => sum + p.amount, 0)
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                      if (percent === 0) return null;
                      
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    <Cell fill="url(#paidGradient)" stroke="#fff" strokeWidth={1} />
                    <Cell fill="url(#unpaidGradient)" stroke="#fff" strokeWidth={1} />
                  </Pie>
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">
                              {data.value} payment{data.value !== 1 ? 's' : ''}
                            </p>
                            <p className="text-sm">
                              ₹{data.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {((data.value / filteredPayments.length) * 100).toFixed(1)}% of total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {filteredPayments.length > 0 ? 
                      `${((filteredPayments.filter(p => p.status === 'Paid').length / filteredPayments.length) * 100).toFixed(0)}%` : 
                      '0%'}
                  </p>
                  <p className="text-xs text-gray-500">Paid</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Paid</p>
                  <p className="text-lg font-bold text-green-600">
                    {filteredPayments.filter(p => p.status === 'Paid').length}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Unpaid</p>
                  <p className="text-lg font-bold text-red-600">
                    {filteredPayments.filter(p => p.status === 'Unpaid').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {showFinance && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPayments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-all">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{getTenantName(payment.tenantId)}</p>
                      <p className="text-sm text-gray-600">{getPropertyName(payment.tenantId)}</p>
                      <p className="text-sm text-gray-600">{payment.month} {payment.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                      <Badge className={`text-xs ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADD Income vs Expenses Chart HERE */}
      <div>
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              Monthly Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyIncomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']} />
                  <Line type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={3} />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingReports;
