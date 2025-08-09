import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId?: string;
  activeFilters: Record<string, string | string[]>;
  onFiltersChange: (filters: Record<string, string | string[]>) => void;
}

export default function FilterModal({
  open,
  onOpenChange,
  collectionId,
  activeFilters,
  onFiltersChange,
}: FilterModalProps) {
  const { data: availableTags = {} } = useQuery<Record<string, string[]>>({
    queryKey: ["/api/collections", collectionId, "tags"],
    enabled: !!collectionId && open,
  });

  const handleFilterChange = (key: string, value: string, checked: boolean) => {
    const newFilters = { ...activeFilters };
    
    if (checked) {
      // For multiple filters, store as array of values per key
      if (newFilters[key]) {
        // If key exists, add to array if not already present
        const currentValues = Array.isArray(newFilters[key]) ? newFilters[key] : [newFilters[key]];
        if (!currentValues.includes(value)) {
          newFilters[key] = [...currentValues, value];
        }
      } else {
        // First value for this key
        newFilters[key] = [value];
      }
    } else {
      // Remove value from filter
      if (newFilters[key]) {
        const currentValues = Array.isArray(newFilters[key]) ? newFilters[key] : [newFilters[key]];
        const filteredValues = currentValues.filter(v => v !== value);
        if (filteredValues.length === 0) {
          delete newFilters[key];
        } else {
          newFilters[key] = filteredValues;
        }
      }
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const applyFilters = () => {
    onOpenChange(false);
  };

  // Count items for each tag value
  const getTagCount = (key: string, value: string) => {
    // This would ideally come from the API, but for now we'll show placeholder counts
    return 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filter Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(availableTags)
            .filter(([tagKey]) => tagKey.toLowerCase() !== 'title')
            .map(([tagKey, values]) => (
            <div key={tagKey}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {tagKey}
              </h3>
              <div className="space-y-2">
                {values.map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${tagKey}-${value}`}
                      checked={
                        activeFilters[tagKey] 
                          ? Array.isArray(activeFilters[tagKey]) 
                            ? (activeFilters[tagKey] as string[]).includes(value)
                            : activeFilters[tagKey] === value
                          : false
                      }
                      onCheckedChange={(checked) =>
                        handleFilterChange(tagKey, value, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`${tagKey}-${value}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {value} <span className="text-gray-400">({getTagCount(tagKey, value)})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(availableTags).filter(key => key.toLowerCase() !== 'title').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tags available in this collection
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear All
          </Button>
          <Button onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
