import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

interface PageSearchProps {
  placeholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function PageSearch({
  placeholder = "Search...",
  searchQuery,
  onSearchChange,
  className = "",
}: PageSearchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleChange}
        className="pl-9 w-full"
      />
    </div>
  );
}
