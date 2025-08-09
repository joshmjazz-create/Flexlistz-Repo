import { useState, useEffect, useRef } from 'react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch field values for autocomplete
  const { data: fieldValues = [] } = useQuery<string[]>({
    queryKey: [`/api/field-values/${field}`],
  });

  // Filter values based on current input
  const filteredValues = hasUserInput && inputValue.trim()
    ? fieldValues.filter(val =>
        val.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
    setHasUserInput(false);
    setShowDropdown(false);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setHasUserInput(true);
    
    // Show dropdown if there are matching results
    if (newValue.trim()) {
      const matches = fieldValues.filter(val =>
        val.toLowerCase().includes(newValue.toLowerCase())
      );
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setShowDropdown(false);
    setHasUserInput(false);
  };

  const shouldShowDropdown = showDropdown && hasUserInput && filteredValues.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {shouldShowDropdown && (
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      )}
      
      {shouldShowDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredValues.slice(0, 10).map((fieldValue) => (
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
          ))}
        </div>
      )}
    </div>
  );
}