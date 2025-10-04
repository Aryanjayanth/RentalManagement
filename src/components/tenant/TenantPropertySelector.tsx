
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Property } from "./types";

interface TenantPropertySelectorProps {
  properties: Property[];
  propertyId: string;
  setPropertyId: (value: string) => void;
}

const TenantPropertySelector = ({
  properties,
  propertyId,
  setPropertyId,
}: TenantPropertySelectorProps) => {
  if (properties.length === 0) {
    return (
      <div>
        <Label>No properties available. Please add a property first.</Label>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor="propertyId">Property</Label>
      <Select
        value={propertyId}
        onValueChange={(value) => setPropertyId(value)}
      >
        <SelectTrigger id="propertyId" className="w-full">
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((prop) => (
            <SelectItem key={prop.id} value={prop.id}>
              {prop.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TenantPropertySelector;
