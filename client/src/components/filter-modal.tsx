import { useState } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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

  const toggleSection = (tagKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(tagKey)) {
      newExpanded.delete(tagKey);
    } else {
      newExpanded.add(tagKey);
    }
    setExpandedSections(newExpanded);
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
          {/* Color Filter */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('Color')}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors"
            >
              <span>Color</span>
              {expandedSections.has('Color') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.has('Color') && (
              <div className="space-y-2 ml-4 mb-4">
                {[
                  { value: 'knows', color: 'bg-green-200', border: 'border-green-300' },
                  { value: 'kind-of-knows', color: 'bg-orange-200', border: 'border-orange-300' },
                  { value: 'does-not-know', color: 'bg-red-200', border: 'border-red-300' }
                ].map(({ value, color, border }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`color-${value}`}
                      checked={
                        activeFilters['Color'] 
                          ? Array.isArray(activeFilters['Color']) 
                            ? (activeFilters['Color'] as string[]).includes(value)
                            : activeFilters['Color'] === value
                          : false
                      }
                      onCheckedChange={(checked) =>
                        handleFilterChange('Color', value, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`color-${value}`}
                      className="text-sm text-gray-700 cursor-pointer flex items-center space-x-2"
                    >
                      <div className={`w-4 h-4 rounded border-2 ${color} ${border}`} />
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {Object.entries(availableTags)
            .filter(([tagKey]) => tagKey.toLowerCase() !== 'title')
            .map(([tagKey, values]) => (
            <div key={tagKey}>
              <button
                type="button"
                onClick={() => toggleSection(tagKey)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition-colors"
              >
                <span>{tagKey}</span>
                {expandedSections.has(tagKey) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections.has(tagKey) && (
                <div className="space-y-2 ml-4 mb-4">
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
              )}
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
