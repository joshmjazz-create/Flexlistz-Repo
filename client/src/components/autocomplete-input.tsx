import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from './ui/input';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  field: 'key' | 'composer' | 'style';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AutocompleteInput({
  field,
  value,
  onChange,
  placeholder,
  className,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Fetch field values for autocomplete
  const { data: fieldValues = [] } = useQuery<string[]>({
    queryKey: [`/api/field-values/${field}`],
  });

  // Filter values based on input - only show items that contain the typed text
  const filteredValues = inputValue.trim() 
    ? fieldValues.filter(val =>
        val.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
    setHasBeenEdited(false);
    setIsDropdownVisible(false);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setHasBeenEdited(true);
    
    // Calculate filtered values for the new input
    const newFilteredValues = newValue.trim() 
      ? fieldValues.filter(val =>
          val.toLowerCase().includes(newValue.toLowerCase())
        )
      : [];
    
    // Show dropdown if there are matching results and user has edited
    const shouldShow = newValue.trim().length > 0 && newFilteredValues.length > 0;
    setIsDropdownVisible(shouldShow);
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setIsDropdownVisible(false);
    setHasBeenEdited(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't hide dropdown if user clicks on dropdown items
    // The onMouseDown on dropdown prevents the blur from firing
  };

  // Only show dropdown if user has edited and there are matches
  const showDropdown = hasBeenEdited && isDropdownVisible && inputValue.trim().length > 0 && filteredValues.length > 0;

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && (
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      )}
      
      {showDropdown && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking dropdown
        >
          {filteredValues.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No matches found
            </div>
          ) : (
            filteredValues.slice(0, 10).map((fieldValue) => (
              <div
                key={fieldValue}
                className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelect(fieldValue)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === fieldValue ? "opacity-100" : "opacity-0"
                  )}
                />
                {fieldValue}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}