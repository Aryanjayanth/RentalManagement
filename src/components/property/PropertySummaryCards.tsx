
import { Card, CardContent } from "@/components/ui/card";
import type { Property } from "../pages/PropertyManagement";
import { getVacantUnits, getOccupiedUnits } from "./getVacantUnits";

interface PropertySummaryCardsProps {
  properties: Property[];
}

export default function PropertySummaryCards({ properties }: PropertySummaryCardsProps) {
  const totalOccupied = properties.reduce((sum, p) => sum + getOccupiedUnits(p), 0);
  const totalVacant = properties.reduce((sum, p) => sum + getVacantUnits(p), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
          <div className="text-sm text-gray-600">Total Properties</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{totalOccupied}</div>
          <div className="text-sm text-gray-600">Occupied Units</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">{totalVacant}</div>
          <div className="text-sm text-gray-600">Vacant Units</div>
        </CardContent>
      </Card>
    </div>
  )
}
