
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { generateRentDueRecordsUtil, Payment as RentDuePayment } from "./generateRentDueRecords";
import { Lease as LeaseType, Tenant as TenantType, Property as PropertyType } from "../tenant/types";
import RentTrackingHeader from './RentTrackingHeader';
import RentSummaryCards from './RentSummaryCards';
import RentTrackingFilters from './RentTrackingFilters';
import RentPaymentsList from './RentPaymentsList';

interface RentTrackingContainerProps {
  user?: { role?: string };
}

const RentTrackingContainer = ({ user }: RentTrackingContainerProps) => {
  const [payments, setPayments] = useState<RentDuePayment[]>([]);
  const [tenants, setTenants] = useState<TenantType[]>([]);
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [leases, setLeases] = useState<LeaseType[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('All');

  const generateRentDueRecords = () => {
    console.log('=== Starting rent due records generation ===');
    console.log(`- Current payments count: ${payments.length}`);
    console.log(`- Active leases count: ${leases.filter(l => {
      const today = new Date();
      const leaseEnd = new Date(l.endDate);
      return (!l.status || l.status === 'Active') && leaseEnd >= today;
    }).length}`);
    
    const { updatedPayments, newDueCount } = generateRentDueRecordsUtil({
      leases,
      payments,
      tenants,
    });

    console.log(`- Generated ${newDueCount} new due records`);
    console.log(`- Total payments after generation: ${updatedPayments.length}`);
    
    if (newDueCount > 0) {
      localStorage.setItem("rental_payments", JSON.stringify(updatedPayments));
      setPayments(updatedPayments);

      toast({
        title: "Rent Records Generated",
        description: `Created ${newDueCount} new rent due record(s) for missing months.`,
      });
      
      // Log the newly created records for debugging
      const newRecords = updatedPayments.slice(payments.length);
      console.log('Newly created records:', newRecords);
    } else {
      console.log('No new records were generated');
      toast({
        title: "All Up to Date",
        description: "No missing rent due records were found for current tenants.",
      });
    }
    
    console.log('=== Completed rent due records generation ===');
  };

  useEffect(() => {
    const savedPayments = localStorage.getItem('rental_payments');
    const savedTenants = localStorage.getItem('rental_tenants');
    const savedProperties = localStorage.getItem('rental_properties');
    const savedLeases = localStorage.getItem('rental_leases');
    
    const localPayments: RentDuePayment[] = savedPayments ? JSON.parse(savedPayments) : [];
    const localTenants: TenantType[] = savedTenants ? JSON.parse(savedTenants) : [];
    const localProperties: PropertyType[] = savedProperties ? JSON.parse(savedProperties) : [];
    const localLeases: LeaseType[] = savedLeases ? JSON.parse(savedLeases) : [];

    setPayments(localPayments);
    setTenants(localTenants);
    setProperties(localProperties);
    setLeases(localLeases);
  }, []);

  useEffect(() => {
    if (leases.length > 0 && tenants.length > 0) {
      // Debug: Log tenant and lease information
      console.log('=== DEBUG: Tenant and Lease Information ===');
      console.log('Tenants count:', tenants.length);
      
      // Find XYZ tenant (case insensitive search)
      const xyzTenant = tenants.find(t => 
        t.name && typeof t.name === 'string' && t.name.toLowerCase().includes('xyz')
      );
      
      if (xyzTenant) {
        console.log('✅ Found XYZ tenant:', xyzTenant);
        const xyzLeases = leases.filter(l => l.tenantId === xyzTenant.id);
        console.log(`📋 XYZ has ${xyzLeases.length} leases:`, xyzLeases);
        
        // Check if any leases are active
        const activeLeases = xyzLeases.filter(lease => {
          const today = new Date();
          const leaseEnd = new Date(lease.endDate);
          const isActive = (!lease.status || lease.status === 'Active') && leaseEnd >= today;
          
          console.log(`   - Lease ${lease.id} for ₹${lease.monthlyRent} (${lease.propertyId || 'no property'}): ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
          console.log(`     Start: ${lease.startDate}, End: ${lease.endDate}, Status: ${lease.status || 'Active'}`);
          
          return isActive;
        });
        
        console.log(`🔄 XYZ has ${activeLeases.length} active leases:`, activeLeases);
        
        // Log payment records for this tenant
        const tenantPayments = payments.filter(p => p.tenantId === xyzTenant.id);
        console.log(`💰 XYZ has ${tenantPayments.length} payment records:`);
        
        // Group payments by lease for better readability
        const paymentsByLease = new Map<string, any[]>();
        tenantPayments.forEach(payment => {
          const leaseId = payment.leaseId || 'no-lease';
          if (!paymentsByLease.has(leaseId)) {
            paymentsByLease.set(leaseId, []);
          }
          paymentsByLease.get(leaseId)?.push(payment);
        });
        
        // Log payments grouped by lease
        paymentsByLease.forEach((leasePayments, leaseId) => {
          const lease = xyzLeases.find(l => l.id === leaseId);
          console.log(`   - Lease ${leaseId} (${lease ? `₹${lease.monthlyRent}` : 'unknown amount'}):`);
          leasePayments.forEach(p => {
            console.log(`     - ${p.month} ${p.year}: ₹${p.amount} (${p.status})`);
          });
        });
        
        // Check for rent due records
        console.log('🔍 Checking rent due records for XYZ:');
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        
        activeLeases.forEach(lease => {
          const dueExists = payments.some(p => 
            p.leaseId === lease.id && 
            p.month === currentMonth && 
            p.year === currentYear
          );
          
          console.log(`   - ${dueExists ? '✅' : '❌'} Due record for ${currentMonth} ${currentYear} on lease ${lease.id} (₹${lease.monthlyRent}): ${dueExists ? 'EXISTS' : 'MISSING'}`);
        });
      } else {
        console.log('❌ XYZ tenant not found. Available tenant names:', 
          tenants.map(t => t.name).filter(Boolean));
      }
      
      // Log all active leases
      const activeLeases = leases.filter(lease => {
        const today = new Date();
        const leaseEnd = new Date(lease.endDate);
        return (!lease.status || lease.status === 'Active') && leaseEnd >= today;
      });
      console.log(`🏠 Total active leases: ${activeLeases.length}`, activeLeases);
      
      // Generate rent due records
      console.log('🔄 Generating rent due records...');
      generateRentDueRecords();
    }
  }, [leases, tenants, payments]);

  const savePayments = (updatedPayments: RentDuePayment[]) => {
    localStorage.setItem('rental_payments', JSON.stringify(updatedPayments));
    setPayments(updatedPayments);
  };

  const updatePaymentStatus = (paymentId: string, newStatus: 'Paid' | 'Unpaid' | 'Partial', updateData?: {
    paymentMethod?: string;
    actualDate?: string;
    amount?: number;
    originalAmount?: number;
    remainingDue?: number;
  }) => {
    const targetPayment = payments.find(p => p.id === paymentId);
    if (!targetPayment) return;

    // Check if this is completing a partial payment
    const isCompletingPartial = targetPayment.status === 'Partial' && 
                              updateData?.remainingDue === 0 && 
                              newStatus === 'Paid';

    if (newStatus === "Paid" && !isCompletingPartial) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Get all unpaid payments for this tenant and property/lease, sorted chronologically
      const unpaidPaymentsForTenant = payments
        .filter(
          p =>
            p.tenantId === targetPayment.tenantId &&
            p.status === 'Unpaid' &&
            p.id !== paymentId &&
            // Include either propertyId or leaseId check if they exist in the payment
            (targetPayment.propertyId ? p.propertyId === targetPayment.propertyId : true) &&
            (targetPayment.leaseId ? p.leaseId === targetPayment.leaseId : true)
        )
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });

      if (unpaidPaymentsForTenant.length > 0) {
        const targetIndex = (targetPayment.year * 12) + monthNames.indexOf(targetPayment.month);
        
        const earlierUnpaid = unpaidPaymentsForTenant.find(p => {
          const otherIndex = (p.year * 12) + monthNames.indexOf(p.month);
          return otherIndex < targetIndex;
        });

        if (earlierUnpaid) {
          toast({
            title: "Cannot Mark as Paid",
            description: `There is an earlier unpaid month (${earlierUnpaid.month} ${earlierUnpaid.year}) for this tenant. Please clear pending dues in chronological order.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        // Check if this is completing a partial payment
        const isCompletingPartial = p.status === 'Partial' && 
                                  updateData?.remainingDue === 0 && 
                                  newStatus === 'Paid';
        
        // For partial payments, store the original amount and remaining due
        const isPartial = newStatus === 'Partial' && !isCompletingPartial;
        const originalAmount = isPartial ? (updateData?.originalAmount || p.originalAmount || p.amount) : p.originalAmount;
        const amount = updateData?.amount || p.amount;
        const remainingDue = isPartial ? (updateData?.remainingDue || 0) : 0;
        
        // If completing a partial payment, use the original amount and clear remaining due
        const finalStatus = isCompletingPartial ? 'Paid' : newStatus;
        const finalAmount = isCompletingPartial ? (p.originalAmount || p.amount) : amount;
        
        return {
          ...p,
          status: finalStatus,
          ...(updateData?.paymentMethod && { 
            paymentMethod: updateData.paymentMethod 
          }),
          ...(updateData?.actualDate && { paidDate: updateData.actualDate }),
          ...(isPartial && { 
            amount: finalAmount,
            originalAmount,
            remainingDue
          }),
          ...(isCompletingPartial && {
            amount: finalAmount,
            originalAmount: undefined,
            remainingDue: 0
          }),
          ...(newStatus === 'Unpaid' && {
            amount: p.originalAmount || p.amount,
            originalAmount: undefined,
            remainingDue: 0,
            paymentMethod: undefined,
            paidDate: undefined
          })
        };
      }
      return p;
    });
    savePayments(updatedPayments);

    toast({ 
      title: `Payment status updated to ${newStatus}`,
      description: newStatus === 'Paid' ? `Payment marked as paid via ${updateData?.paymentMethod || 'Unknown method'} on ${updateData?.actualDate ? new Date(updateData.actualDate).toLocaleDateString('en-IN') : 'today'}` : undefined
    });
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  const getTenantPhone = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.phone || '';
  };

  const getPropertyName = (tenantId: string) => {
    // Find all leases for this tenant
    const tenantLeases = leases.filter(lease => lease.tenantId === tenantId);
    
    if (tenantLeases.length === 0) return 'No Lease';
    
    // Get the most recent active lease
    const activeLease = tenantLeases
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .find(lease => !lease.status || lease.status === 'Active');
    
    if (!activeLease) return 'No Active Lease';
    
    // Find the property for this lease
    const property = properties.find(p => p.id === activeLease.propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const isOverdue = (payment: RentDuePayment) => {
    const paymentDate = new Date(payment.date);
    const currentDate = new Date();
    const daysDiff = (currentDate.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24);
    return payment.status === 'Unpaid' && daysDiff > 5;
  };

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filterStatus === 'All' || payment.status === filterStatus;
    const tenantMatch = selectedTenant === 'all' || payment.tenantId === selectedTenant;
    return statusMatch && tenantMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return '✅';
      case 'Partial': return '💰';
      case 'Unpaid': return '❌';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Unpaid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'Cash': return '💵';
      case 'UPI': return '📱';
      case 'Bank Transfer': return '🏦';
      case 'Check': return '📋';
      default: return '💳';
    }
  };

  const totalPaid = filteredPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = filteredPayments.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      <RentTrackingHeader
        generateRentDueRecords={generateRentDueRecords}
        tenants={tenants}
        properties={properties}
        payments={payments}
        savePayments={savePayments}
        getPropertyName={getPropertyName}
      />

      <RentSummaryCards
        totalPaid={totalPaid}
        totalUnpaid={totalUnpaid}
        totalAdvance={0}
      />

      <RentTrackingFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        tenants={tenants}
      />

      <RentPaymentsList
        payments={filteredPayments}
        allPayments={payments}
        getTenantName={getTenantName}
        getTenantPhone={getTenantPhone}
        getPropertyName={getPropertyName}
        isOverdue={isOverdue}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        getPaymentMethodIcon={getPaymentMethodIcon}
        user={user}
        updatePaymentStatus={updatePaymentStatus}
      />
    </div>
  );
};

export default RentTrackingContainer;
