
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

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

interface PropertyFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProperty: Property | null;
  onSave: (property: Property, isEdit: boolean) => void;
  onCancel: () => void;
}

const PROPERTY_TYPES = [
  'Apartment',
  'Commercial',
  'Mixed (House and Shops)',
  'Villa',
  'Townhouse',
  'Studio',
  'Office Space',
  'Retail Space',
  'Warehouse',
  'Other'
];

const PropertyFormDialog = ({ isOpen, onOpenChange, editingProperty, onSave, onCancel }: PropertyFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: '',
    totalFlats: '',
    floors: '',
    description: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingProperty) {
      setFormData({
        name: editingProperty.name,
        address: editingProperty.address,
        type: editingProperty.type,
        totalFlats: editingProperty.totalFlats.toString(),
        floors: editingProperty.floors.toString(),
        description: editingProperty.description,
        image: editingProperty.image || ''
      });
      setImagePreview(editingProperty.image || '');
    } else {
      setFormData({
        name: '',
        address: '',
        type: '',
        totalFlats: '',
        floors: '',
        description: '',
        image: ''
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [editingProperty, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file.",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.type || !formData.totalFlats || !formData.floors) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const totalFlats = parseInt(formData.totalFlats);
    const floors = formData.floors.toUpperCase() === 'G' ? 0 : parseInt(formData.floors);

    if (totalFlats <= 0 || (isNaN(floors) || (floors <= 0 && formData.floors.toUpperCase() !== 'G'))) {
      toast({
        title: "Error",
        description: "Total flats must be a positive number, and floors must be a positive number or 'G' for ground floor.",
        variant: "destructive"
      });
      return;
    }

    const status = totalFlats === 0 ? 'Vacant' : 'Partially Occupied';

    const property: Property = {
      id: editingProperty?.id || Date.now().toString(),
      name: formData.name,
      address: formData.address,
      type: formData.type,
      totalFlats,
      occupiedFlats: editingProperty?.occupiedFlats || 0,
      floors,
      status: editingProperty?.status || status,
      description: formData.description,
      image: formData.image,
      createdAt: editingProperty?.createdAt || new Date().toISOString()
    };

    onSave(property, !!editingProperty);
    
    toast({
      title: editingProperty ? "Property Updated" : "Property Added",
      description: `${property.name} has been ${editingProperty ? 'updated' : 'added'} successfully.`
    });

    onOpenChange(false);
    if (onCancel) onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
          ➕ Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Property Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter property name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Property Type *</label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Units *</label>
              <Input
                type="number"
                value={formData.totalFlats}
                onChange={(e) => setFormData(prev => ({ ...prev, totalFlats: e.target.value }))}
                placeholder="0"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Floors *</label>
              <Input
                type="text"
                value={formData.floors}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers or 'G' (case insensitive)
                  if (value === '' || /^[0-9]+$/.test(value) || value.toUpperCase() === 'G') {
                    setFormData(prev => ({ ...prev, floors: value }));
                  }
                }}
                placeholder="G or number"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about the property"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Property Image</label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Property preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                <span className="text-sm text-gray-500">Image file</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingProperty ? 'Update Property' : 'Add Property'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;
