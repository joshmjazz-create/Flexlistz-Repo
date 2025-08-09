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
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);

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
    setHasBeenEdited(false); // Reset edit state when value changes from outside
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setHasBeenEdited(true); // Mark as edited when user types
    
    // Calculate filtered values for the new input
    const newFilteredValues = newValue.trim() 
      ? fieldValues.filter(val =>
          val.toLowerCase().includes(newValue.toLowerCase())
        )
      : [];
    
    // Show dropdown if there are matching results
    if (newValue.trim().length > 0 && newFilteredValues.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
    setHasBeenEdited(false); // Reset after selection
  };

  // Only show dropdown if:
  // 1. User has started editing (hasBeenEdited is true)
  // 2. There's text in the input field
  // 3. There are matching filtered values
  const showDropdown = hasBeenEdited && inputValue.trim().length > 0 && filteredValues.length > 0;

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (hasBeenEdited && showDropdown) {
            setOpen(true);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 200)} // Delay to allow selection
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && (
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      )}
      
      {open && showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
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