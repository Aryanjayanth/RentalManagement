
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VacantUnitsCardProps {
  vacantUnits: number;
  propertyUnitsList: { propertyName: string; vacant: number; total: number }[];
}

const VacantUnitsCard = ({ vacantUnits, propertyUnitsList }: VacantUnitsCardProps) => (
  <Card className="border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="text-xl text-yellow-600 flex items-center">
        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
        Vacant Units <span className="ml-2 font-bold text-yellow-700 text-lg">({vacantUnits})</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {vacantUnits > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {propertyUnitsList
            .filter(u => u.vacant > 0)
            .map((unit, idx) => (
              <div
                key={unit.propertyName + idx}
                className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{unit.propertyName}</p>
                  <p className="text-sm text-gray-600">{unit.vacant} vacant unit(s) out of {unit.total}</p>
                </div>
                <Badge className="bg-yellow-500 text-white">VACANT</Badge>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-500 font-medium">All units occupied!</p>
          <p className="text-sm text-gray-400">100% occupancy rate</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default VacantUnitsCard;
