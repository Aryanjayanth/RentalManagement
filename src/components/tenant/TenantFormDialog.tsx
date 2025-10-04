
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Tenant } from "./types";

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  formData: {
    name: string;
    email: string;
    phone: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onReset: () => void;
}

const TenantFormDialog = ({
  open,
  onOpenChange,
  editingTenant,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  onReset,
}: TenantFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button 
        onClick={onReset} 
        size="lg"
        className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <User className="h-5 w-5 mr-2" />
        Add New Tenant
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl">
          {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-gray-500 text-xs">(optional)</span></Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Emergency Contact</Label>
          <Input
            placeholder="Name"
            value={formData.emergencyContact.name}
            onChange={(e) => onFormChange({ 
              ...formData, 
              emergencyContact: { ...formData.emergencyContact, name: e.target.value }
            })}
            required
          />
          <Input
            placeholder="Phone"
            value={formData.emergencyContact.phone}
            onChange={(e) => onFormChange({ 
              ...formData, 
              emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
            })}
            required
          />
          <Input
            placeholder="Relationship (optional)"
            value={formData.emergencyContact.relationship}
            onChange={(e) => onFormChange({ 
              ...formData, 
              emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
            })}
          />
        </div>
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1">
            {editingTenant ? 'Update' : 'Add'} Tenant
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

export default TenantFormDialog;
