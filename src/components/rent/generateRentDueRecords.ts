import { toast } from "@/hooks/use-toast";
import { Lease, Property, Tenant } from "../tenant/types";

export interface Payment {
  id: string;
  tenantId: string;
  leaseId: string;        // Added to track which lease this payment is for
  propertyId: string;     // Added to track which property this payment is for
  amount: number;
  date: string;
  status: "Paid" | "Unpaid" | "Partial";
  month: string;
  year: number;
  paymentMethod?: "Cash" | "UPI" | "Bank Transfer" | "Check";
  paidDate?: string;
  originalAmount?: number; // Original amount before partial payment
  remainingDue?: number;   // Remaining due after partial payment
}

/**
 * This utility inspects all active leases and creates rent due records for months
 * that have completed. Since rent is typically collected after the month ends,
 * we only create dues for months that are actually past.
 * 
 * Returns [updatedPayments, numberOfNewRecords]
 */
export function generateRentDueRecordsUtil({
  leases,
  payments,
  tenants,
}: {
  leases: Lease[];
  payments: Payment[];
  tenants: Tenant[];
}): { updatedPayments: Payment[]; newDueCount: number } {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate the last fully completed month
  // If today is June 17th, the last completed month is May
  const lastCompletedMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastCompletedYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  console.log(`[DEBUG] Today: ${today.toDateString()}`);
  console.log(`[DEBUG] Current month: ${monthNames[currentMonth]} ${currentYear}`);
  console.log(`[DEBUG] Last completed month: ${monthNames[lastCompletedMonth]} ${lastCompletedYear}`);

  const activeLeases = leases.filter((lease) => {
    const leaseEnd = new Date(lease.endDate);
    return (!lease.status || lease.status === "Active") && leaseEnd >= today;
  });

  const newUnpaidRecords: Payment[] = [];

  activeLeases.forEach((lease) => {
    console.log(`\n[DEBUG] Processing lease ${lease.id} for tenant ${lease.tenantId}`);
    console.log(`  - Monthly Rent: ₹${lease.monthlyRent}`);
    console.log(`  - Property ID: ${lease.propertyId || 'Not specified'}`);
    console.log(`  - Lease Period: ${lease.startDate} to ${lease.endDate}`);
    
    // Use lease.startDate, fallback to current month if no start date
    let leaseStartDate: Date;
    if (lease.startDate) {
      leaseStartDate = new Date(lease.startDate);
      console.log(`  - Using lease start date: ${leaseStartDate.toISOString().split('T')[0]}`);
    } else {
      // If no start date, start from current month
      leaseStartDate = new Date(currentYear, currentMonth, 1);
      console.log(`  - No start date, using current month: ${leaseStartDate.toISOString().split('T')[0]}`);
    }

    // Only go up to last completed month or lease end, whichever is earlier
    const leaseEndDate = new Date(lease.endDate);
    const leaseEndMonth = leaseEndDate.getFullYear() * 12 + leaseEndDate.getMonth();
    const endMonth = Math.min(
      lastCompletedYear * 12 + lastCompletedMonth,
      leaseEndMonth
    );
    
    console.log(`  - Generating dues from ${leaseStartDate.getFullYear()}-${leaseStartDate.getMonth() + 1} to ${Math.floor(endMonth / 12)}-${(endMonth % 12) + 1}`);
    
    let d = new Date(leaseStartDate.getFullYear(), leaseStartDate.getMonth(), 1);
    
    while (true) {
      const currentMonthIndex = d.getFullYear() * 12 + d.getMonth();
      
      if (currentMonthIndex > endMonth) {
        console.log(`  - Reached end month ${d.getFullYear()}-${d.getMonth() + 1}, stopping generation`);
        break;
      }
      
      const m = monthNames[d.getMonth()];
      const y = d.getFullYear();
      
      console.log(`  - Checking ${m} ${y}...`);
      
      // Check if payment already exists for this tenant/lease/month/year
      const existingPayment = payments.find(p => 
        p.tenantId === lease.tenantId && 
        p.leaseId === lease.id &&
        p.month === m && 
        p.year === y
      );
      
      if (existingPayment) {
        console.log(`    - Payment exists: ₹${existingPayment.amount} (${existingPayment.status})`);
      } else {
        // Set due date to 5th of the NEXT month (after the rental period)
        const dueDate = new Date(y, d.getMonth() + 1, 5);
        const propertyId = lease.propertyId || '';
        
        console.log(`    - Creating new due record for ${m} ${y}:`);
        console.log(`      - Amount: ₹${lease.monthlyRent || 0}`);
        console.log(`      - Due Date: ${dueDate.toISOString().split('T')[0]}`);
        console.log(`      - Lease ID: ${lease.id}`);
        console.log(`      - Property ID: ${propertyId}`);
        
        newUnpaidRecords.push({
          id: `rent-due-${lease.tenantId}-${lease.id}-${y}-${m}`.replace(/\s+/g, '-'),
          tenantId: lease.tenantId,
          leaseId: lease.id,
          propertyId: propertyId,
          amount: lease.monthlyRent || 0,
          date: dueDate.toISOString().split("T")[0],
          status: "Unpaid",
          month: m,
          year: y,
        });
      }
      
      // Move to first day of next month
      d.setMonth(d.getMonth() + 1);
    }
  });

  if (newUnpaidRecords.length > 0) {
    const updatedPayments = [...payments, ...newUnpaidRecords];
    console.log('[DEBUG] Generated new rent due records:', newUnpaidRecords);
    return { updatedPayments, newDueCount: newUnpaidRecords.length };
  } else {
    console.log('[DEBUG] No missing rent due records found.');
    return { updatedPayments: payments, newDueCount: 0 };
  }
}
