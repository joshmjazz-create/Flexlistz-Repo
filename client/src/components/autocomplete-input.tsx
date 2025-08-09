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

  // Fetch field values for autocomplete
  const { data: fieldValues = [] } = useQuery<string[]>({
    queryKey: [`/api/field-values/${field}`],
  });

  // Filter values based on input
  const filteredValues = fieldValues.filter(val =>
    val.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  const showDropdown = inputValue.length > 0 && filteredValues.length > 0;

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
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