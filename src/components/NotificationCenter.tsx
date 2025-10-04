
import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

// Interfaces for data from localStorage
interface Lease {
  id: string;
  tenantId: string;
  endDate: string;
  monthlyRent: number;
  status: 'Active' | 'Expired' | 'Terminated';
}

interface Tenant {
  id: string;
  name: string;
}

interface Payment {
  tenantId: string;
  month: string;
  year: number;
  status: 'Paid' | 'Unpaid' | 'Advance';
}


export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Sample notifications - in real app, these would come from your backend
    const sampleNotifications: Notification[] = [
      {
        id: '2',
        title: 'Maintenance Request',
        message: 'New maintenance request from Apartment 3B',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: '3',
        title: 'Payment Received',
        message: 'Payment of $1,200 received from Jane Smith',
        type: 'success',
        timestamp: new Date(Date.now() - 7200000),
        read: true
      }
    ];

    const rentDueNotifications: Notification[] = [];
    try {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentDate = new Date();
      const currentMonthName = monthNames[currentDate.getMonth()];
      const currentYear = currentDate.getFullYear();

      const savedLeases = localStorage.getItem('rental_leases');
      const savedTenants = localStorage.getItem('rental_tenants');
      const savedPayments = localStorage.getItem('rental_payments');

      const leases: Lease[] = savedLeases ? JSON.parse(savedLeases) : [];
      const tenants: Tenant[] = savedTenants ? JSON.parse(savedTenants) : [];
      const payments: Payment[] = savedPayments ? JSON.parse(savedPayments) : [];

      const activeLeases = leases.filter(lease => {
        const today = new Date();
        const endDate = new Date(lease.endDate);
        return lease.status === 'Active' && endDate >= today;
      });

      activeLeases.forEach(lease => {
        const paymentForMonth = payments.find(p =>
          p.tenantId === lease.tenantId &&
          p.month === currentMonthName &&
          p.year === currentYear
        );

        if (!paymentForMonth || paymentForMonth.status === 'Unpaid') {
          const tenant = tenants.find(t => t.id === lease.tenantId);
          if (tenant) {
            rentDueNotifications.push({
              id: `rent-due-${lease.id}-${currentYear}-${currentMonthName}`,
              title: 'Rent Payment Due',
              message: `${tenant.name}'s rent of ₹${lease.monthlyRent} is due for ${currentMonthName}.`,
              type: 'warning',
              timestamp: new Date(),
              read: false,
            });
          }
        }
      });
    } catch (error) {
        console.error("Failed to generate rent notifications:", error);
    }
    
    const combinedNotifications = [...rentDueNotifications, ...sampleNotifications];
    
    // Remove duplicates
    const uniqueNotifications = combinedNotifications.filter((notification, index, self) =>
        index === self.findIndex((n) => n.id === notification.id)
    );

    setNotifications(uniqueNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'success': return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8 hover:bg-accent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg" align="end">
        <div className="border-b p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="mb-2 last:mb-0">
                  <Card 
                    className={`border-l-4 transition-all duration-200 hover:shadow-md ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'shadow-sm' : 'opacity-75'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {notification.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-950"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-950"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
