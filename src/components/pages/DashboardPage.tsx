
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import VacantUnitsCard from "../dashboard/VacantUnitsCard";
import { getVacantUnits, getOccupiedUnits } from "../property/getVacantUnits";

interface DashboardPageProps {
  onNavigateToSection?: (section: string) => void;
  user?: { role?: string }; // Add user prop
}

const DashboardPage = ({ onNavigateToSection, user }: DashboardPageProps) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyUnitsList, setPropertyUnitsList] = useState<any[]>([]);
  const [vacantUnits, setVacantUnits] = useState<number>(0);
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalTenants: 0,
    monthlyIncome: 0,
    overduePayments: 0,
    pendingProblems: 0,
    recentActivity: [] as any[],
    upcomingPayments: [] as any[],
    vacantUnits: 0
  });
  const [monthlyIncomeData, setMonthlyIncomeData] = useState([
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    { month: 'Jun', income: 0, expenses: 0 }
  ]);
  const [occupancyTrendData, setOccupancyTrendData] = useState([
    { month: 'Jan', occupancy: 85 },
    { month: 'Feb', occupancy: 90 },
    { month: 'Mar', occupancy: 88 },
    { month: 'Apr', occupancy: 95 },
    { month: 'May', occupancy: 92 },
    { month: 'Jun', occupancy: 0 }
  ]);

  useEffect(() => {
    // Load data from localStorage
    const propertiesLocal = JSON.parse(localStorage.getItem('rental_properties') || '[]');
    const tenants = JSON.parse(localStorage.getItem('rental_tenants') || '[]');
    const payments = JSON.parse(localStorage.getItem('rental_payments') || '[]');
    const problems = JSON.parse(localStorage.getItem('rental_problems') || '[]');
    const expenses = JSON.parse(localStorage.getItem('rental_expenses') || '[]');
    const leases = JSON.parse(localStorage.getItem('rental_leases') || '[]');

    setProperties(propertiesLocal);

    const occupiedCount = propertiesLocal.filter((p: any) => p.status === 'Fully Occupied' || p.status === 'Partially Occupied').length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = payments
      .filter((p: any) => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear && 
               p.status === 'Paid';
      })
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const overdueCount = payments.filter((p: any) => p.status === 'Unpaid').length;
    const pendingProblemsCount = problems.filter((p: any) => p.status === 'Open').length;

    // Enhanced Recent Activity from actual data
    const recentActivity = [];
    
    // Recent payments
    const recentPayments = payments
      .filter((p: any) => p.status === 'Paid')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    
    recentPayments.forEach((payment: any) => {
      const tenant = tenants.find((t: any) => t.id === payment.tenantId);
      const daysAgo = Math.floor((Date.now() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24));
      recentActivity.push({
        type: 'payment',
        message: `Payment received from ${tenant?.name || 'tenant'} - ₹${payment.amount.toLocaleString()}`,
        time: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
        color: 'green'
      });
    });

    // Recent property additions
    if (propertiesLocal.length > 0) {
      const recentProperty = propertiesLocal
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const daysAgo = Math.floor((Date.now() - new Date(recentProperty.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 7) {
        recentActivity.push({
          type: 'property',
          message: `New property added: ${recentProperty.name}`,
          time: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
          color: 'blue'
        });
      }
    }

    // Recent problems
    const recentProblems = problems
      .sort((a: any, b: any) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
      .slice(0, 1);
    
    recentProblems.forEach((problem: any) => {
      const daysAgo = Math.floor((Date.now() - new Date(problem.reportDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 3) {
        recentActivity.push({
          type: 'maintenance',
          message: `New issue reported: ${problem.description.substring(0, 40)}...`,
          time: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
          color: 'orange'
        });
      }
    });

    // Fix Upcoming Rent Collections with actual lease data
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5); // 5th of next month
    
    const upcomingPayments = leases
      .filter((lease: any) => lease.status === 'Active')
      .map((lease: any) => {
        const tenant = tenants.find((t: any) => t.id === lease.tenantId);
        const property = propertiesLocal.find((p: any) => p.id === lease.propertyId);
        
        // Check if payment for next month already exists
        const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long' });
        const paymentExists = payments.some((p: any) => 
          p.tenantId === lease.tenantId && 
          p.month === nextMonthName && 
          p.year === nextMonth.getFullYear()
        );

        if (!paymentExists && tenant && property) {
          return {
            id: lease.id,
            name: tenant.name,
            propertyName: property.name,
            amount: lease.monthlyRent,
            dueDate: nextMonth
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);

    // --- UPDATED vacant units calculation using the new functions ---
    let totalVacantUnits = 0;
    const unitsList: { propertyName: string; vacant: number; total: number }[] = [];
    propertiesLocal.forEach((p: any) => {
      const currVacant = getVacantUnits(p);
      const currOccupied = getOccupiedUnits(p);
      const totalUnits = Number(p.totalFlats) || 0;
      
      totalVacantUnits += currVacant;
      unitsList.push({
        propertyName: p.name || '',
        vacant: currVacant,
        total: totalUnits
      });
    });
    setVacantUnits(totalVacantUnits);
    setPropertyUnitsList(unitsList);

    setStats({
      totalProperties: propertiesLocal.length,
      occupiedProperties: occupiedCount,
      vacantProperties: propertiesLocal.length - occupiedCount,
      totalTenants: tenants.length,
      monthlyIncome,
      overduePayments: overdueCount,
      pendingProblems: pendingProblemsCount,
      recentActivity: recentActivity.slice(0, 3),
      upcomingPayments,
      vacantUnits: totalVacantUnits
    });

    // Calculate dynamic chart data
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

    const occupancyRate = propertiesLocal.length > 0 ? (occupiedCount / propertiesLocal.length) * 100 : 0;
    setOccupancyTrendData(prev => {
        const newData = [...prev];
        const currentMonthName = monthNames[new Date().getMonth()];
        if (newData[5]) {
            newData[5].occupancy = Math.round(occupancyRate);
        }
        return newData;
    });

  }, []);

  // --- Property Type Distribution - DYNAMIC ---
  // Count by type: e.g. 'Apartment', 'House', 'Commercial'
  const propertyTypeCounts: Record<string, number> = {};
  properties.forEach((p: any) => {
    const type = p.type || 'Other';
    propertyTypeCounts[type] = (propertyTypeCounts[type] || 0) + 1;
  });
  const totalPropertiesForType = Object.values(propertyTypeCounts).reduce((sum, count) => sum + count, 0);
  const propertyTypeData = Object.entries(propertyTypeCounts).map(([name, count]) => ({
    name,
    value: totalPropertiesForType ? Math.round((count / totalPropertiesForType) * 100) : 0,
    count,
    color:
      name === 'Apartment' || name === 'Apartments'
        ? '#3B82F6'
        : name === 'House' || name === 'Houses'
        ? '#10B981'
        : name === 'Commercial'
        ? '#F59E0B'
        : '#A78BFA',
  }));

  // --- Occupancy Trend Chart - DYNAMIC ---
  // Show % based on how many are occupied
  // Already updating occupancy in useEffect/occupancyTrendData
  // occupancyTrendData already handles the trend for the last 6 months dynamically (code remains!)

  // Add a fallback for if there are no properties/logical zeros (will show 0% for months with no data)

  // Only show income/financial stat cards and charts if not Staff
  const showFinance = user?.role !== 'Staff';

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: '🏠',
      change: '+2 this month',
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    showFinance && {
      title: 'Monthly Income',
      value: `₹${stats.monthlyIncome.toLocaleString()}`,
      icon: '💰',
      change: '+12% from last month',
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Active Tenants',
      value: stats.totalTenants,
      icon: '👥',
      change: '+3 new tenants',
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Vacant Units',
      value: vacantUnits,
      icon: '🟡',
      change: vacantUnits > 0 ? `${vacantUnits} units vacant` : 'Fully occupied',
      color: vacantUnits > 0 ? 'from-yellow-500 to-yellow-400' : 'from-green-500 to-green-600',
      textColor: vacantUnits > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: vacantUnits > 0 ? 'bg-yellow-50' : 'bg-green-50'
    },
    {
      title: 'Pending Issues',
      value: stats.overduePayments + stats.pendingProblems,
      icon: '⚠️',
      change: stats.overduePayments > 0 ? 'Needs attention' : 'All good!',
      color: stats.overduePayments > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      textColor: stats.overduePayments > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.overduePayments > 0 ? 'bg-red-50' : 'bg-green-50'
    }
  ].filter(Boolean);

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your property portfolio at a glance</p>
        </div>
        <div className="text-right bg-card p-4 rounded-xl shadow-sm border">
          <div className="text-sm text-muted-foreground">Today</div>
          <div className="text-xl font-bold">
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'short'
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards
          .filter(
            (stat) =>
              user?.role !== 'Staff' ||
              !stat.title?.toLowerCase().includes('income')
          )
          .filter(
            (stat) =>
              user?.role !== 'Staff' ||
              !stat.title?.toLowerCase().includes('collection')
          )
          .map((stat, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                  <div className={`h-2 w-16 bg-gradient-to-r ${stat.color} rounded-full opacity-30`}></div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Type Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Property Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {propertyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {propertyTypeData.length === 0 && (
                <div className="text-center text-muted-foreground mt-8">No property data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue vs Expenses Chart - NEW */}
        {showFinance && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                Revenue vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any, name: string) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Revenue' : 'Expenses']} />
                    <Bar dataKey="income" fill="#10B981" name="income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occupancy Trend Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Occupancy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Occupancy']} />
                  <Bar dataKey="occupancy" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
              {occupancyTrendData.every(d => !d.occupancy) && (
                <div className="text-center text-muted-foreground mt-8">No occupancy data available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => onNavigateToSection?.('properties')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🏠</div>
                  <div className="text-sm font-medium">Add Property</div>
                </div>
              </Button>
              <Button 
                className="h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => onNavigateToSection?.('tenants')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-medium">Add Tenant</div>
                </div>
              </Button>
              <Button 
                className="h-20 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => onNavigateToSection?.('rent-tracking')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💳</div>
                  <div className="text-sm font-medium">Record Payment</div>
                </div>
              </Button>
              <Button 
                className="h-20 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => onNavigateToSection?.('expense-tracking')}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💸</div>
                  <div className="text-sm font-medium">Add Expense</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Enhanced Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, index) => (
                <div key={index} className={`flex items-center space-x-4 p-4 bg-${activity.color}-50 dark:bg-${activity.color}-900/20 rounded-xl transition-all hover:shadow-md`}>
                  <div className={`w-3 h-3 bg-${activity.color}-500 rounded-full flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">No recent activity to show</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              Upcoming Rent Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingPayments.length > 0 ? stats.upcomingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:shadow-md transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{payment.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{payment.propertyName}</p>
                    <p className="text-xs text-muted-foreground">Due: {payment.dueDate.toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-yellow-600">₹{payment.amount.toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">💰</div>
                  <p className="text-sm">All rent collections are up to date!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vacant Units section */}
      <VacantUnitsCard vacantUnits={vacantUnits} propertyUnitsList={propertyUnitsList} />
    </div>
  );
};

export default DashboardPage;
