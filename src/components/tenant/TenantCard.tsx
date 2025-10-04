
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Edit, Trash2, Bell } from 'lucide-react';
import { Tenant } from './types';

interface TenantCardProps {
  tenant: Tenant;
  propertyNames: string[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onTenantClick?: (tenant: Tenant) => void;
  remainingDue?: number;
}

const TenantCard = ({ tenant, propertyNames, onEdit, onDelete, onTenantClick, remainingDue = 0 }: TenantCardProps) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(tenant);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(tenant.id);
  };

  const handleNotify = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clean the phone number - remove any non-digit characters
    const cleanPhone = tenant.phone.replace(/\D/g, '');
    
    // Ensure the number starts with 91 (India country code) and has 10 digits
    let whatsappNumber = cleanPhone;
    
    // If number starts with 0, remove it
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = whatsappNumber.substring(1);
    }
    
    // If number doesn't start with 91, add it
    if (!whatsappNumber.startsWith('91') && whatsappNumber.length === 10) {
      whatsappNumber = '91' + whatsappNumber;
    }
    
    // Open WhatsApp with the number
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    
    console.log(`Opening WhatsApp for tenant: ${tenant.name}`, whatsappNumber);
  };

  const handleClick = () => {
    if (onTenantClick) {
      onTenantClick(tenant);
    }
  };

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tenant.name}</h3>
            <Badge className="bg-green-100 text-green-800 border-green-200 text-sm mb-3">
              ✅ Active
            </Badge>
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="text-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50"
              title="Delete tenant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNotify}
              className="text-amber-600 hover:bg-amber-50"
              title="Send notification"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {propertyNames.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-blue-500" />
              <span className="font-medium">{propertyNames.join(', ')}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-green-500" />
            <span>{tenant.phone}</span>
          </div>
          
          {tenant.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-purple-500" />
              <span className="truncate">{tenant.email}</span>
            </div>
          )}
          
          {remainingDue > 0 && (
            <div className="flex items-center text-sm font-medium mt-2">
              <span className="text-red-500">Remaining Due: ₹{remainingDue.toLocaleString()}</span>
            </div>
          )}

          {tenant.emergencyContact && typeof tenant.emergencyContact === 'object' && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Emergency Contact:</span> {tenant.emergencyContact.name} ({tenant.emergencyContact.phone})
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantCard;
