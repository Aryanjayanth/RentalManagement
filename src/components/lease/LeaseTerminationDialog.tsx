
import { useState } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface LeaseTerminationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (shouldDeleteUnpaidRents: boolean) => void;
  tenantName: string;
}

const LeaseTerminationDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  tenantName 
}: LeaseTerminationDialogProps) => {
  const [checkedItems, setCheckedItems] = useState({
    electricityBill: false,
    propertyDamage: false,
    keysReturned: false,
    finalInspection: false,
    securityDeposit: false
  });
  const [deleteUnpaidRents, setDeleteUnpaidRents] = useState(true);

  const allChecked = Object.values(checkedItems).every(Boolean);

  const handleCheckChange = (key: keyof typeof checkedItems, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [key]: checked }));
  };

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm(deleteUnpaidRents);
      onOpenChange(false);
      setCheckedItems({
        electricityBill: false,
        propertyDamage: false,
        keysReturned: false,
        finalInspection: false,
        securityDeposit: false
      });
      setDeleteUnpaidRents(true);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Terminate Lease</AlertDialogTitle>
          <AlertDialogDescription>
            Please confirm the following items before terminating the lease for <strong>{tenantName}</strong>:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="electricity"
              checked={checkedItems.electricityBill}
              onCheckedChange={(checked) => handleCheckChange('electricityBill', checked as boolean)}
            />
            <Label htmlFor="electricity" className="text-sm">
              ⚡ Electricity bill paid and cleared
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="damage"
              checked={checkedItems.propertyDamage}
              onCheckedChange={(checked) => handleCheckChange('propertyDamage', checked as boolean)}
            />
            <Label htmlFor="damage" className="text-sm">
              🔧 Property damage assessment completed
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="keys"
              checked={checkedItems.keysReturned}
              onCheckedChange={(checked) => handleCheckChange('keysReturned', checked as boolean)}
            />
            <Label htmlFor="keys" className="text-sm">
              🔑 All keys and access cards returned
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inspection"
              checked={checkedItems.finalInspection}
              onCheckedChange={(checked) => handleCheckChange('finalInspection', checked as boolean)}
            />
            <Label htmlFor="inspection" className="text-sm">
              🏠 Final property inspection completed
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="deposit"
              checked={checkedItems.securityDeposit}
              onCheckedChange={(checked) => handleCheckChange('securityDeposit', checked as boolean)}
            />
            <Label htmlFor="deposit" className="text-sm">
              💰 Security deposit settlement processed
            </Label>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="deleteUnpaid"
                checked={deleteUnpaidRents}
                onCheckedChange={(checked) => setDeleteUnpaidRents(checked as boolean)}
              />
              <Label htmlFor="deleteUnpaid" className="text-sm">
                🗑️ Delete unpaid rent records (paid records will be kept for income tracking)
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!allChecked}
            className="bg-red-600 hover:bg-red-700"
          >
            Terminate Lease
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaseTerminationDialog;
