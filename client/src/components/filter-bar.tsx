import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onToggleFilters: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onToggleFilters,
}: FilterBarProps) {
  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    onSearchChange("");
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="text-gray-600"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Active Filters */}
      {(Object.keys(activeFilters).length > 0 || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="bg-primary-100 text-primary-800 border-primary-200"
            >
              {key}: {value}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(key)}
                className="ml-2 h-auto p-0 text-primary-600 hover:text-primary-800"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          
          {(Object.keys(activeFilters).length > 0 || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
