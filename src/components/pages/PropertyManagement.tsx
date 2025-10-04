import { useState, useEffect } from 'react';
import PropertyFormDialog from '../property/PropertyFormDialog';
import PropertyListCard from '../property/PropertyListCard';
import PropertySummaryCards from '../property/PropertySummaryCards';
import { getVacantUnits } from '../property/getVacantUnits';
import PropertyDetailsView from './PropertyDetailsView';

// Same interface as before
export interface Property {
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

const PropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const savedProperties = localStorage.getItem('rental_properties');
    if (savedProperties) {
      setProperties(JSON.parse(savedProperties));
    }
  }, []);

  const saveProperties = (updatedProperties: Property[]) => {
    localStorage.setItem('rental_properties', JSON.stringify(updatedProperties));
    setProperties(updatedProperties);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      const updatedProperties = properties.filter(p => p.id !== id);
      saveProperties(updatedProperties);
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  // On property form submission (add/edit)
  const handleSaveProperty = (property: Property, isEdit: boolean) => {
    let updatedProperties;
    if (isEdit) {
      // Ensure createdAt is preserved for existing properties
      const propertyWithCreatedAt = {
        ...property,
        createdAt: property.createdAt || new Date().toISOString()
      };
      updatedProperties = properties.map(p => p.id === property.id ? propertyWithCreatedAt : p);
    } else {
      // Add createdAt for new properties
      const propertyWithTimestamp = {
        ...property,
        createdAt: new Date().toISOString()
      };
      updatedProperties = [...properties, propertyWithTimestamp];
    }
    saveProperties(updatedProperties);
    setEditingProperty(null);
  };

  // If viewing a specific property, show the detailed view
  if (selectedProperty) {
    return (
      <PropertyDetailsView 
        property={selectedProperty} 
        onBack={() => setSelectedProperty(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Property Management</h2>
          <p className="text-gray-600">Manage your rental properties and track occupancy</p>
        </div>
        <PropertyFormDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          editingProperty={editingProperty}
          onSave={handleSaveProperty}
          onCancel={() => setEditingProperty(null)}
        />
      </div>

      {/* Summary Cards */}
      <PropertySummaryCards properties={properties} />

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <PropertyListCard
            key={property.id}
            property={property}
            onClick={handlePropertyClick}
            getStatusColor={(status) => {
              switch (status) {
                case 'Fully Occupied': return 'bg-green-100 text-green-800';
                case 'Partially Occupied': return 'bg-yellow-100 text-yellow-800';
                case 'Vacant': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            }}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Properties Yet</h3>
          <p className="text-gray-500">Add your first property to get started with rental management.</p>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
