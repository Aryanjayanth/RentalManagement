
import { Card, CardContent } from "@/components/ui/card";
import { getVacantUnits, getOccupiedUnits } from "./getVacantUnits";
import type { Property } from "../pages/PropertyManagement";

interface PropertyListCardProps {
  property: Property;
  onClick: (property: Property) => void;
  getStatusColor: (status: string) => string;
}

export default function PropertyListCard({ property, onClick, getStatusColor }: PropertyListCardProps) {
  const occupiedUnits = getOccupiedUnits(property);
  const vacantUnits = getVacantUnits(property);
  const totalUnits = Number(property.totalFlats) || 0;

  return (
    <Card
      key={property.id}
      className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onClick(property)}
    >
      <div className="relative h-48 w-full">
        {property.image ? (
          <img 
            src={property.image} 
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${property.image ? 'hidden' : ''}`}>
          <span className="text-6xl">🏢</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-800">{property.name}</h3>
          <p className="text-sm text-gray-600 flex items-center">📍 {property.address}</p>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {occupiedUnits}/{totalUnits} Units
              <span className="ml-2 text-red-500">
                {vacantUnits} Vacant
              </span>
            </span>
            <span className="text-gray-500">{property.type}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
